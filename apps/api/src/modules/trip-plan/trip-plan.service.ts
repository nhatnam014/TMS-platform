import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, TripMode } from "@tms/db";
import { PrismaService } from "../../config/prisma.service";
import type {
  CreateTripPlanDto,
  UpdateTripPlanDto,
  TripPlanFilters,
  PaginationQuery,
  PaginatedResponse,
} from "@tms/shared";
import { ENTITY_TYPES } from "@tms/shared";
import { AuditService } from "../audit/audit.service";

const TRIP_PLAN_INCLUDE = {
  customer: { select: { id: true, code: true, name: true } },
  carrier: { select: { id: true, code: true, name: true } },
  serviceTypeMaster: { select: { id: true, code: true, description: true } },
  containerSize: { select: { id: true, code: true, name: true } },
  costs: {
    select: {
      id: true,
      costName: true,
      amount: true,
      invoiceNumber: true,
    },
  },
} as const;

function mapCosts(
  costs: { id: string; costName: string | null; amount: any; invoiceNumber: string | null }[],
) {
  return costs.map((c) => ({
    id: c.id,
    costName: c.costName ?? null,
    amount: Number(c.amount),
    invoiceNumber: c.invoiceNumber ?? null,
  }));
}

@Injectable()
export class TripPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    filters: TripPlanFilters,
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<any>> {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const sortBy = pagination.sortBy ?? "tripNumber";
    const sortOrder = pagination.sortOrder ?? "asc";
    const skip = (page - 1) * limit;

    const where: Prisma.TripPlanWhereInput = {};

    if (filters.dateFrom || filters.dateTo) {
      where.tripDate = {};
      if (filters.dateFrom) where.tripDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.tripDate.lte = new Date(filters.dateTo);
    }
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.carrierId) where.carrierId = filters.carrierId;
    if (filters.vehiclePlate)
      where.vehiclePlate = { contains: filters.vehiclePlate, mode: Prisma.QueryMode.insensitive };
    if (filters.serviceTypeCode) {
      (where as any).serviceTypeMaster = { code: filters.serviceTypeCode };
    }
    if (filters.status) where.status = filters.status as any;

    if (filters.search) {
      const s = filters.search.trim();
      const num = parseInt(s, 10);
      where.OR = [
        ...(isNaN(num) ? [] : [{ tripNumber: num }]),
        { vehiclePlate: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { customer: { name: { contains: s, mode: Prisma.QueryMode.insensitive } } },
        { outboundContainerNumber: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { inboundContainerNumber: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { notes: { contains: s, mode: Prisma.QueryMode.insensitive } },
        // Location names
        { pickupLocationName: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { loadUnloadLocationName: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { dropoffLocationName: { contains: s, mode: Prisma.QueryMode.insensitive } },
        // SHĐ (invoice numbers)
        { shdNang: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { shdHa: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { shdVeSinh: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { shdVeCong: { contains: s, mode: Prisma.QueryMode.insensitive } },
        // Cost names
        { phiNangName: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { phiHaName: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { phiVeSinhName: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { phiCuocName: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { veCongName: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { chiPhiKhacName: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { chiPhiTraiTuyenName: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { cauDuongName: { contains: s, mode: Prisma.QueryMode.insensitive } },
        // Carrier and service type (relation fields)
        { carrier: { name: { contains: s, mode: Prisma.QueryMode.insensitive } } },
        { serviceTypeMaster: { code: { contains: s, mode: Prisma.QueryMode.insensitive } } },
        { serviceTypeMaster: { description: { contains: s, mode: Prisma.QueryMode.insensitive } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tripPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: TRIP_PLAN_INCLUDE,
      }),
      this.prisma.tripPlan.count({ where }),
    ]);

    const mapped = data.map((tp: any) => ({
      ...tp,
      serviceType: tp.serviceTypeMaster ?? null,
      costs: mapCosts(tp.costs),
    }));

    return {
      data: mapped,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const trip = await this.prisma.tripPlan.findUnique({
      where: { id },
      include: TRIP_PLAN_INCLUDE,
    });

    if (!trip) throw new NotFoundException(`Trip plan ${id} not found`);

    return {
      ...trip,
      serviceType: (trip as any).serviceTypeMaster ?? null,
      costs: mapCosts(trip.costs as any),
    };
  }

  async create(dto: CreateTripPlanDto) {
    const tripMode = (dto.tripMode as TripMode | undefined) ?? TripMode.STANDARD;

    if (tripMode === TripMode.DROP_AND_HOOK) {
      if (!dto.outboundContainerNumber) {
        throw new BadRequestException("DROP_AND_HOOK trips require outboundContainerNumber");
      }
      if (
        dto.inboundContainerNumber &&
        dto.outboundContainerNumber === dto.inboundContainerNumber
      ) {
        throw new BadRequestException(
          "DROP_AND_HOOK trips require outbound and inbound containers to be different",
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const maxResult = await tx.tripPlan.aggregate({ _max: { tripNumber: true } });
      const tripNumber = (maxResult._max.tripNumber ?? 0) + 1;

      const trip = await tx.tripPlan.create({
        data: {
          tripNumber,
          tripDate: new Date(dto.tripDate),
          serviceTypeId: dto.serviceTypeId,
          tripMode,
          vehiclePlate: dto.vehiclePlate ?? null,
          customerId: dto.customerId,
          carrierId: dto.carrierId ?? null,
          containerSizeId: dto.containerSizeId ?? null,
          outboundContainerNumber: dto.outboundContainerNumber ?? null,
          inboundContainerNumber: dto.inboundContainerNumber ?? null,
          pickupLocationName: dto.pickupLocationName ?? null,
          loadUnloadLocationName: dto.loadUnloadLocationName ?? null,
          dropoffLocationName: dto.dropoffLocationName ?? null,
          documentSentDate: dto.documentSentDate ? new Date(dto.documentSentDate) : null,
          description: dto.description ?? null,
          notes: dto.notes ?? null,
          // Fixed cost slots
          phiNangName: dto.phiNangName ?? null,
          phiNangAmount: dto.phiNangAmount ?? null,
          shdNang: dto.shdNang ?? null,
          phiHaName: dto.phiHaName ?? null,
          phiHaAmount: dto.phiHaAmount ?? null,
          shdHa: dto.shdHa ?? null,
          phiVeSinhName: dto.phiVeSinhName ?? null,
          phiVeSinhAmount: dto.phiVeSinhAmount ?? null,
          shdVeSinh: dto.shdVeSinh ?? null,
          phiCuocName: dto.phiCuocName ?? null,
          phiCuocAmount: dto.phiCuocAmount ?? null,
          veCongName: dto.veCongName ?? null,
          veCongAmount: dto.veCongAmount ?? null,
          shdVeCong: dto.shdVeCong ?? null,
          chiPhiKhacName: dto.chiPhiKhacName ?? null,
          chiPhiKhacAmount: dto.chiPhiKhacAmount ?? null,
          chiPhiTraiTuyenName: dto.chiPhiTraiTuyenName ?? null,
          chiPhiTraiTuyenAmount: dto.chiPhiTraiTuyenAmount ?? null,
          cauDuongName: dto.cauDuongName ?? null,
          cauDuongAmount: dto.cauDuongAmount ?? null,
        },
        include: {
          customer: true,
          carrier: true,
        },
      });

      if (dto.otherCosts && dto.otherCosts.length > 0) {
        await tx.tripPlanCost.createMany({
          data: dto.otherCosts.map((c) => ({
            tripPlanId: trip.id,
            costName: c.costName ?? null,
            amount: c.amount,
            invoiceNumber: c.invoiceNumber ?? null,
          })),
        });
      }

      await this.auditService.log(
        {
          action: "CREATE",
          entityType: ENTITY_TYPES.TRIP_PLAN,
          entityId: trip.id,
          summary: `Created trip plan (${tripMode}) for ${new Date(dto.tripDate).toISOString().slice(0, 10)}`,
          afterSnapshot: trip as object,
        },
        tx,
      );

      return trip;
    });
  }

  async updateStatus(id: string, status: string) {
    const trip = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.tripPlan.update({
        where: { id },
        data: { status: status as any },
      });

      await this.auditService.log(
        {
          action: "STATUS_CHANGE",
          entityType: ENTITY_TYPES.TRIP_PLAN,
          entityId: id,
          summary: `Trip plan status changed from ${trip.status} to ${status}`,
          beforeSnapshot: { status: trip.status },
          afterSnapshot: { status },
        },
        tx,
      );

      return updated;
    });
  }

  async update(id: string, dto: UpdateTripPlanDto) {
    const trip = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.tripPlan.update({
        where: { id },
        data: {
          ...(dto.tripDate !== undefined && { tripDate: new Date(dto.tripDate) }),
          ...(dto.serviceTypeId !== undefined && { serviceTypeId: dto.serviceTypeId }),
          ...(dto.tripMode !== undefined && { tripMode: dto.tripMode as any }),
          ...(dto.vehiclePlate !== undefined && { vehiclePlate: dto.vehiclePlate }),
          ...(dto.customerId !== undefined && { customerId: dto.customerId }),
          ...(dto.carrierId !== undefined && { carrierId: dto.carrierId }),
          ...(dto.containerSizeId !== undefined && { containerSizeId: dto.containerSizeId }),
          ...(dto.outboundContainerNumber !== undefined && {
            outboundContainerNumber: dto.outboundContainerNumber,
          }),
          ...(dto.inboundContainerNumber !== undefined && {
            inboundContainerNumber: dto.inboundContainerNumber,
          }),
          ...(dto.pickupLocationName !== undefined && {
            pickupLocationName: dto.pickupLocationName,
          }),
          ...(dto.loadUnloadLocationName !== undefined && {
            loadUnloadLocationName: dto.loadUnloadLocationName,
          }),
          ...(dto.dropoffLocationName !== undefined && {
            dropoffLocationName: dto.dropoffLocationName,
          }),
          ...(dto.documentSentDate !== undefined && {
            documentSentDate: dto.documentSentDate ? new Date(dto.documentSentDate) : null,
          }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.status !== undefined && { status: dto.status as any }),
          ...(dto.phiNangName !== undefined && { phiNangName: dto.phiNangName }),
          ...(dto.phiNangAmount !== undefined && { phiNangAmount: dto.phiNangAmount }),
          ...(dto.shdNang !== undefined && { shdNang: dto.shdNang }),
          ...(dto.phiHaName !== undefined && { phiHaName: dto.phiHaName }),
          ...(dto.phiHaAmount !== undefined && { phiHaAmount: dto.phiHaAmount }),
          ...(dto.shdHa !== undefined && { shdHa: dto.shdHa }),
          ...(dto.phiVeSinhName !== undefined && { phiVeSinhName: dto.phiVeSinhName }),
          ...(dto.phiVeSinhAmount !== undefined && { phiVeSinhAmount: dto.phiVeSinhAmount }),
          ...(dto.shdVeSinh !== undefined && { shdVeSinh: dto.shdVeSinh }),
          ...(dto.phiCuocName !== undefined && { phiCuocName: dto.phiCuocName }),
          ...(dto.phiCuocAmount !== undefined && { phiCuocAmount: dto.phiCuocAmount }),
          ...(dto.veCongName !== undefined && { veCongName: dto.veCongName }),
          ...(dto.veCongAmount !== undefined && { veCongAmount: dto.veCongAmount }),
          ...(dto.shdVeCong !== undefined && { shdVeCong: dto.shdVeCong }),
          ...(dto.chiPhiKhacName !== undefined && { chiPhiKhacName: dto.chiPhiKhacName }),
          ...(dto.chiPhiKhacAmount !== undefined && { chiPhiKhacAmount: dto.chiPhiKhacAmount }),
          ...(dto.chiPhiTraiTuyenName !== undefined && {
            chiPhiTraiTuyenName: dto.chiPhiTraiTuyenName,
          }),
          ...(dto.chiPhiTraiTuyenAmount !== undefined && {
            chiPhiTraiTuyenAmount: dto.chiPhiTraiTuyenAmount,
          }),
          ...(dto.cauDuongName !== undefined && { cauDuongName: dto.cauDuongName }),
          ...(dto.cauDuongAmount !== undefined && { cauDuongAmount: dto.cauDuongAmount }),
        },
      });

      if (dto.otherCosts !== undefined) {
        await tx.tripPlanCost.deleteMany({ where: { tripPlanId: id } });
        if (dto.otherCosts.length > 0) {
          await tx.tripPlanCost.createMany({
            data: dto.otherCosts.map((c) => ({
              tripPlanId: id,
              costName: c.costName ?? null,
              amount: c.amount,
              invoiceNumber: c.invoiceNumber ?? null,
            })),
          });
        }
      }

      await this.auditService.log(
        {
          action: "UPDATE",
          entityType: ENTITY_TYPES.TRIP_PLAN,
          entityId: id,
          summary: `Updated trip plan`,
          beforeSnapshot: trip as object,
          afterSnapshot: updated as object,
        },
        tx,
      );

      return updated;
    });
  }

  async delete(id: string) {
    const trip = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.tripPlan.delete({ where: { id } });

      await this.auditService.log(
        {
          action: "DELETE",
          entityType: ENTITY_TYPES.TRIP_PLAN,
          entityId: id,
          summary: `Deleted trip plan`,
          beforeSnapshot: trip as object,
        },
        tx,
      );

      return deleted;
    });
  }
}
