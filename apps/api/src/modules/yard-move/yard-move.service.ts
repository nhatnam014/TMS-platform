import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import { PrismaService } from "../../config/prisma.service";
import { ENTITY_TYPES } from "@tms/shared";
import type { YardMoveFilters, PaginationQuery, PaginatedResponse } from "@tms/shared";
import { AuditService } from "../audit/audit.service";
import { CreateYardMoveDto } from "./dto/create-yard-move.dto";
import { UpdateYardMoveDto } from "./dto/update-yard-move.dto";

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
          date: dto.date,
          gps: dto.gps,
          fullName: dto.fullName,
          truck: dto.truck,
          mooc: dto.mooc,
          booking: dto.booking,
          containerNumber: dto.containerNumber,
          notes: dto.notes,
          daKeo: dto.daKeo,
        },
      });

      await this.auditService.log(
        {
          action: "CREATE",
          entityType: ENTITY_TYPES.YARD_MOVE,
          entityId: move.id,
          summary: `Created yard move: ${dto.date}${dto.fullName ? ` - ${dto.fullName}` : ""}`,
          afterSnapshot: move as object,
        },
        tx,
      );

      return move;
    });
  }

  async findAll(
    filters: YardMoveFilters = {},
    pagination: PaginationQuery = {},
  ): Promise<PaginatedResponse<any>> {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.YardMoveWhereInput = {
      isActive: true,
    };

    if (filters.search?.trim()) {
      const s = filters.search.trim();
      where.OR = [
        { gps: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { fullName: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { truck: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { mooc: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { booking: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { containerNumber: { contains: s, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.yardMove.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.yardMove.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const move = await this.prisma.yardMove.findUnique({ where: { id } });
    if (!move) throw new NotFoundException(`YardMove ${id} not found`);
    return move;
  }

  async update(id: string, dto: UpdateYardMoveDto) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.yardMove.update({
        where: { id },
        data: {
          ...(dto.date !== undefined ? { date: dto.date } : {}),
          ...(dto.gps !== undefined ? { gps: dto.gps } : {}),
          ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
          ...(dto.truck !== undefined ? { truck: dto.truck } : {}),
          ...(dto.mooc !== undefined ? { mooc: dto.mooc } : {}),
          ...(dto.booking !== undefined ? { booking: dto.booking } : {}),
          ...(dto.containerNumber !== undefined ? { containerNumber: dto.containerNumber } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          ...(dto.daKeo !== undefined ? { daKeo: dto.daKeo } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      await this.auditService.log(
        {
          action: dto.isActive === false ? "DELETE" : "UPDATE",
          entityType: ENTITY_TYPES.YARD_MOVE,
          entityId: id,
          summary: dto.isActive === false ? "Yard move soft-deleted" : "Yard move updated",
          afterSnapshot: updated as object,
        },
        tx,
      );

      return updated;
    });
  }
}
