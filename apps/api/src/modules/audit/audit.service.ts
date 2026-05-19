import { Injectable } from "@nestjs/common";
import { AuditAction, Prisma } from "@tms/db";
import { PrismaService } from "../../config/prisma.service";
import type { AuditLogFilters, PaginationQuery, PaginatedResponse } from "@tms/shared";
import { AuditContextService } from "./audit-context.service";

export interface AuditLogParams {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  summary: string;
  beforeSnapshot?: object;
  afterSnapshot?: object;
  metadata?: object;
  actorUserId?: string;
  actorUsername?: string;
  actorRole?: string;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditContextService: AuditContextService,
  ) {}

  async log(params: AuditLogParams, tx?: Prisma.TransactionClient): Promise<void> {
    const ctx = this.auditContextService.get();
    const client = tx ?? this.prisma;

    await client.auditLog.create({
      data: {
        actorUserId: params.actorUserId ?? ctx?.userId,
        actorUsername: params.actorUsername ?? ctx?.username,
        actorRole: params.actorRole ?? ctx?.role,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        summary: params.summary,
        beforeSnapshot: params.beforeSnapshot as Prisma.InputJsonValue | undefined,
        afterSnapshot: params.afterSnapshot as Prisma.InputJsonValue | undefined,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
      },
    });
  }

  async findAll(
    filters: AuditLogFilters,
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (filters.action) where.action = filters.action as AuditAction;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.actorUserId) where.actorUserId = filters.actorUserId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
