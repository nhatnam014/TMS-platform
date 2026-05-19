import { Injectable, NotFoundException } from "@nestjs/common";
import { ContainerStatus, YardMoveStatus } from "@tms/db";
import { PrismaService } from "../../config/prisma.service";
import { ENTITY_TYPES } from "@tms/shared";
import type { YardMoveFilters } from "@tms/shared";
import { AuditService } from "../audit/audit.service";
import { CreateYardMoveDto } from "./dto/create-yard-move.dto";
import { CreateYardMoveCostDto } from "./dto/create-yard-move-cost.dto";

const ZONE_TO_CONTAINER_STATUS: Record<string, ContainerStatus> = {
  STAGING_DROP: ContainerStatus.EMPTY_AT_YARD,
  LOADING_DOCK: ContainerStatus.BEING_LOADED,
  STAGING_READY: ContainerStatus.LOADED_READY,
};

@Injectable()
export class YardMoveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateYardMoveDto) {
    return this.prisma.$transaction(async (tx) => {
      const move = await tx.yardMove.create({
        data: {
          date: new Date(dto.date),
          containerId: dto.containerId,
          fromZone: dto.fromZone,
          toZone: dto.toZone,
          locationId: dto.locationId,
          status: YardMoveStatus.PENDING,
          notes: dto.notes,
        },
        include: { container: true, location: true, costs: true },
      });

      await this.auditService.log(
        {
          action: "CREATE",
          entityType: ENTITY_TYPES.YARD_MOVE,
          entityId: move.id,
          summary: `Created yard move: ${dto.fromZone} → ${dto.toZone}`,
          afterSnapshot: move as object,
        },
        tx,
      );

      return move;
    });
  }

  findAll(filters: YardMoveFilters = {}) {
    return this.prisma.yardMove.findMany({
      where: {
        ...(filters.locationId ? { locationId: filters.locationId } : {}),
        ...(filters.status ? { status: filters.status as YardMoveStatus } : {}),
      },
      include: {
        container: { select: { id: true, containerNumber: true, sizeType: true, status: true } },
        location: { select: { id: true, code: true, name: true } },
        costs: true,
      },
      orderBy: { date: "desc" },
    });
  }

  async findOne(id: string) {
    const move = await this.prisma.yardMove.findUnique({
      where: { id },
      include: { container: true, location: true, costs: true },
    });
    if (!move) throw new NotFoundException(`YardMove ${id} not found`);
    return move;
  }

  async updateStatus(id: string, status: YardMoveStatus) {
    const move = await this.findOne(id);

    if (status === YardMoveStatus.COMPLETED) {
      const containerStatus = ZONE_TO_CONTAINER_STATUS[move.toZone];
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.yardMove.update({
          where: { id },
          data: { status },
          include: { container: true, location: true, costs: true },
        });
        if (containerStatus) {
          await tx.container.update({
            where: { id: move.containerId },
            data: { status: containerStatus, factoryZone: move.toZone },
          });
        }

        await this.auditService.log(
          {
            action: "STATUS_CHANGE",
            entityType: ENTITY_TYPES.YARD_MOVE,
            entityId: id,
            summary: `Yard move status changed from ${move.status} to ${status}`,
            beforeSnapshot: { status: move.status },
            afterSnapshot: { status },
          },
          tx,
        );

        return updated;
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.yardMove.update({
        where: { id },
        data: { status },
        include: { container: true, location: true, costs: true },
      });

      await this.auditService.log(
        {
          action: "STATUS_CHANGE",
          entityType: ENTITY_TYPES.YARD_MOVE,
          entityId: id,
          summary: `Yard move status changed from ${move.status} to ${status}`,
          beforeSnapshot: { status: move.status },
          afterSnapshot: { status },
        },
        tx,
      );

      return updated;
    });
  }

  async addCost(id: string, dto: CreateYardMoveCostDto) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const cost = await tx.yardMoveCost.create({
        data: {
          yardMoveId: id,
          type: dto.type,
          amount: dto.amount,
          note: dto.note,
        },
      });

      await this.auditService.log(
        {
          action: "COST_ADDED",
          entityType: ENTITY_TYPES.YARD_MOVE_COST,
          entityId: cost.id,
          summary: `Cost added to yard move: ${dto.type} ${dto.amount}`,
          afterSnapshot: cost as object,
          metadata: { yardMoveId: id },
        },
        tx,
      );

      return cost;
    });
  }
}
