import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, TripMode } from "@tms/db";
import { PrismaService } from "../../config/prisma.service";
import type {
  CreateTripPlanDto,
  AddTripPlanCostDto,
  TripPlanFilters,
  PaginationQuery,
  PaginatedResponse,
} from "@tms/shared";
import { ENTITY_TYPES } from "@tms/shared";
import { AuditService } from "../audit/audit.service";

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
    const sortBy = pagination.sortBy ?? "tripDate";
    const sortOrder = pagination.sortOrder ?? "desc";
    const skip = (page - 1) * limit;

    const where: Prisma.TripPlanWhereInput = {};

    if (filters.dateFrom || filters.dateTo) {
      where.tripDate = {};
      if (filters.dateFrom) where.tripDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.tripDate.lte = new Date(filters.dateTo);
    }
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.carrierId) where.carrierId = filters.carrierId;
    if (filters.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters.serviceType) where.serviceType = filters.serviceType as any;
    if (filters.status) where.status = filters.status as any;

    if (filters.search) {
      const s = filters.search.trim();
      const num = parseInt(s, 10);
      where.OR = [
        ...(isNaN(num) ? [] : [{ tripNumber: num }]),
        { vehicle: { licensePlate: { contains: s, mode: Prisma.QueryMode.insensitive } } },
        { customer: { name: { contains: s, mode: Prisma.QueryMode.insensitive } } },
        { outboundContainerNumber: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { inboundContainerNumber: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { notes: { contains: s, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tripPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          vehicle: { select: { id: true, licensePlate: true, vehicleType: true } },
          customer: { select: { id: true, code: true, name: true } },
          carrier: { select: { id: true, code: true, name: true } },
          pickupLocation: { select: { id: true, code: true, name: true } },
          loadUnloadLocation: { select: { id: true, code: true, name: true } },
          dropoffLocation: { select: { id: true, code: true, name: true } },
          costs: {
            select: {
              id: true,
              tripCostId: true,
              costName: true,
              amount: true,
              invoiceNumber: true,
            },
          },
        },
      }),
      this.prisma.tripPlan.count({ where }),
    ]);

    const mapped = data.map((tp: any) => ({
      ...tp,
      costs: tp.costs.map((c: any) => ({
        id: c.id,
        tripCostId: c.tripCostId ?? null,
        costName: c.costName ?? null,
        amount: Number(c.amount),
        invoiceNumber: c.invoiceNumber ?? null,
      })),
    }));

    return {
      data: mapped,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const trip = await this.prisma.tripPlan.findUnique({
      where: { id },
      include: {
        vehicle: true,
        customer: true,
        carrier: true,
        pickupLocation: true,
        loadUnloadLocation: true,
        dropoffLocation: true,
        costs: {
          select: {
            id: true,
            tripCostId: true,
            costName: true,
            amount: true,
            invoiceNumber: true,
          },
        },
      },
    });

    if (!trip) throw new NotFoundException(`Trip plan ${id} not found`);

    return {
      ...trip,
      costs: trip.costs.map((c: any) => ({
        id: c.id,
        tripCostId: c.tripCostId ?? null,
        costName: c.costName ?? null,
        amount: Number(c.amount),
        invoiceNumber: c.invoiceNumber ?? null,
      })),
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
      const trip = await tx.tripPlan.create({
        data: {
          tripDate: new Date(dto.tripDate),
          serviceType: dto.serviceType as any,
          tripMode,
          vehicleId: dto.vehicleId,
          customerId: dto.customerId,
          carrierId: dto.carrierId,
          containerSize: dto.containerSize ?? null,
          outboundContainerNumber: dto.outboundContainerNumber ?? null,
          inboundContainerNumber: dto.inboundContainerNumber ?? null,
          pickupLocationId: dto.pickupLocationId,
          loadUnloadLocationId: dto.loadUnloadLocationId,
          dropoffLocationId: dto.dropoffLocationId,
          documentSentDate: dto.documentSentDate ? new Date(dto.documentSentDate) : null,
          description: dto.description ?? null,
          notes: dto.notes,
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
          chiPhiPhatSinhName: dto.chiPhiPhatSinhName ?? null,
          chiPhiPhatSinhAmount: dto.chiPhiPhatSinhAmount ?? null,
        },
        include: {
          vehicle: true,
          customer: true,
          carrier: true,
        },
      });

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

  async addCost(tripId: string, dto: AddTripPlanCostDto) {
    const tripCost = await this.prisma.tripCost.findUnique({ where: { id: dto.tripCostId } });
    if (!tripCost) throw new NotFoundException(`TripCost ${dto.tripCostId} not found`);

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException("Amount must be greater than 0");
    }

    await this.findOne(tripId);

    return this.prisma.$transaction(async (tx) => {
      const cost = await tx.tripPlanCost.create({
        data: {
          tripPlanId: tripId,
          tripCostId: dto.tripCostId,
          costName: tripCost.name,
          amount: dto.amount,
          invoiceNumber: dto.invoiceNumber ?? null,
        },
      });

      await tx.tripPlan.update({
        where: { id: tripId },
        data: {
          tripCostName: tripCost.name,
          tripCostAmount: dto.amount,
        },
      });

      await this.auditService.log(
        {
          action: "COST_ADDED",
          entityType: ENTITY_TYPES.TRIP_COST,
          entityId: cost.id,
          summary: `Cost added to trip plan: ${tripCost.name} ${dto.amount}`,
          afterSnapshot: cost as object,
          metadata: { tripPlanId: tripId },
        },
        tx,
      );

      return {
        id: cost.id,
        tripCostId: cost.tripCostId,
        costName: tripCost.name,
        amount: Number(cost.amount),
        invoiceNumber: cost.invoiceNumber ?? null,
      };
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
