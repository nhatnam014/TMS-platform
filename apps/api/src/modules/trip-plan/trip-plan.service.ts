import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContainerStatus, Prisma, TripMode, TripStatus } from "@tms/db";
import { PrismaService } from "../../config/prisma.service";
import type {
  CreateTripPlanDto,
  AddTripCostDto,
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
        { outboundContainer: { containerNumber: { contains: s, mode: Prisma.QueryMode.insensitive } } },
        { inboundContainer: { containerNumber: { contains: s, mode: Prisma.QueryMode.insensitive } } },
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
          outboundContainer: { select: { id: true, containerNumber: true, sizeType: true } },
          inboundContainer: { select: { id: true, containerNumber: true, sizeType: true } },
          pickupLocation: { select: { id: true, code: true, name: true } },
          loadUnloadLocation: { select: { id: true, code: true, name: true } },
          dropoffLocation: { select: { id: true, code: true, name: true } },
          costs: true,
        },
      }),
      this.prisma.tripPlan.count({ where }),
    ]);

    return {
      data,
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
        outboundContainer: true,
        inboundContainer: true,
        pickupLocation: true,
        loadUnloadLocation: true,
        dropoffLocation: true,
        costs: true,
      },
    });

    if (!trip) throw new NotFoundException(`Trip plan ${id} not found`);
    return trip;
  }

  async create(dto: CreateTripPlanDto) {
    const tripMode = (dto.tripMode as TripMode | undefined) ?? TripMode.STANDARD;

    let outboundContainerId = dto.outboundContainerId;
    let inboundContainerId = dto.inboundContainerId;

    // Upsert containers by number if IDs not provided (legacy path)
    if (!outboundContainerId && dto.outboundContainerNumber) {
      const container = await this.prisma.container.upsert({
        where: { containerNumber: dto.outboundContainerNumber },
        update: {},
        create: { containerNumber: dto.outboundContainerNumber, sizeType: "HC40" },
      });
      outboundContainerId = container.id;
    }

    if (!inboundContainerId && dto.inboundContainerNumber) {
      const container = await this.prisma.container.upsert({
        where: { containerNumber: dto.inboundContainerNumber },
        update: {},
        create: { containerNumber: dto.inboundContainerNumber, sizeType: "HC40" },
      });
      inboundContainerId = container.id;
    }

    // DROP_AND_HOOK validation
    if (tripMode === TripMode.DROP_AND_HOOK) {
      if (!outboundContainerId) {
        throw new BadRequestException(
          "DROP_AND_HOOK trips require outboundContainerId (or outboundContainerNumber)",
        );
      }
      if (inboundContainerId && outboundContainerId === inboundContainerId) {
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
          outboundContainerId,
          inboundContainerId,
          pickupLocationId: dto.pickupLocationId,
          loadUnloadLocationId: dto.loadUnloadLocationId,
          dropoffLocationId: dto.dropoffLocationId,
          notes: dto.notes,
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

    if (trip.tripMode === TripMode.DROP_AND_HOOK) {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.tripPlan.update({
          where: { id },
          data: { status: status as any },
        });

        const newStatus = status as TripStatus;

        if (newStatus === TripStatus.DISPATCHED && trip.outboundContainerId) {
          await tx.container.update({
            where: { id: trip.outboundContainerId },
            data: { status: ContainerStatus.EMPTY_IN_TRANSIT },
          });
        } else if (newStatus === TripStatus.IN_TRANSIT && trip.outboundContainerId) {
          await tx.container.update({
            where: { id: trip.outboundContainerId },
            data: { status: ContainerStatus.EMPTY_AT_YARD },
          });
        } else if (newStatus === TripStatus.COMPLETED && trip.inboundContainerId) {
          await tx.container.update({
            where: { id: trip.inboundContainerId },
            data: { status: ContainerStatus.DELIVERED },
          });
        } else if (newStatus === TripStatus.CANCELLED && trip.outboundContainerId) {
          await tx.container.update({
            where: { id: trip.outboundContainerId },
            data: { status: ContainerStatus.EMPTY_AVAILABLE },
          });
        }

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

  findLoadedReady(locationId: string) {
    return this.prisma.container.findMany({
      where: {
        status: ContainerStatus.LOADED_READY,
        currentLocationId: locationId,
      },
      include: { currentLocation: { select: { id: true, code: true, name: true } } },
    });
  }

  async addCost(tripId: string, dto: AddTripCostDto) {
    await this.findOne(tripId);
    return this.prisma.$transaction(async (tx) => {
      const cost = await tx.tripCost.create({
        data: {
          tripPlanId: tripId,
          costType: dto.costType as any,
          amount: dto.amount,
          invoiceNumber: dto.invoiceNumber,
          description: dto.description,
        },
      });

      await this.auditService.log(
        {
          action: "COST_ADDED",
          entityType: ENTITY_TYPES.TRIP_COST,
          entityId: cost.id,
          summary: `Cost added to trip plan: ${dto.costType} ${dto.amount}`,
          afterSnapshot: cost as object,
          metadata: { tripPlanId: tripId },
        },
        tx,
      );

      return cost;
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
