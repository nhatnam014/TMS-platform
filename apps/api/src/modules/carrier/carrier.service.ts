import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import { ENTITY_TYPES } from "@tms/shared";
import type {
  CreateCarrierDto,
  UpdateCarrierDto,
  PaginationQuery,
  PaginatedResponse,
  BulkDeleteResult,
} from "@tms/shared";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class CarrierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    search: string | undefined,
    pagination: PaginationQuery = {},
  ): Promise<PaginatedResponse<any>> {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CarrierWhereInput = { isActive: true };
    if (search?.trim()) {
      const s = search.trim();
      where.OR = [
        { name: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { code: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { phone: { contains: s, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.carrier.findMany({
        where,
        select: { id: true, code: true, name: true, phone: true },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.carrier.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(dto: CreateCarrierDto) {
    return this.prisma.$transaction(async (tx) => {
      try {
        const carrier = await tx.carrier.create({
          data: {
            code: dto.code,
            name: dto.name,
            phone: dto.phone,
          },
        });

        await this.auditService.log(
          {
            action: "CREATE",
            entityType: ENTITY_TYPES.CARRIER,
            entityId: carrier.id,
            summary: `Created carrier: ${carrier.code} — ${carrier.name}`,
            afterSnapshot: carrier as object,
          },
          tx,
        );

        return carrier;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new ConflictException(`Carrier code "${dto.code}" is already in use`);
        }
        throw e;
      }
    });
  }

  async update(id: string, dto: UpdateCarrierDto) {
    const existing = await this.prisma.carrier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Carrier ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      try {
        const carrier = await tx.carrier.update({
          where: { id },
          data: dto,
        });

        await this.auditService.log(
          {
            action: "UPDATE",
            entityType: ENTITY_TYPES.CARRIER,
            entityId: id,
            summary: `Updated carrier: ${carrier.code}`,
            beforeSnapshot: existing as object,
            afterSnapshot: carrier as object,
          },
          tx,
        );

        return carrier;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new ConflictException(`Carrier code "${dto.code}" is already in use`);
        }
        throw e;
      }
    });
  }

  async bulkDelete(ids: string[]): Promise<BulkDeleteResult> {
    const deleted: string[] = [];
    const skipped: { id: string; reason: string }[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const id of ids) {
        const existing = await tx.carrier.findUnique({ where: { id } });
        if (!existing) {
          skipped.push({ id, reason: "Not found" });
          continue;
        }

        const tripPlanCount = await tx.tripPlan.count({ where: { carrierId: id } });
        if (tripPlanCount > 0) {
          skipped.push({
            id,
            reason: `Referenced by ${tripPlanCount} trip plan(s)`,
          });
          continue;
        }

        await tx.carrier.delete({ where: { id } });

        await this.auditService.log(
          {
            action: "DELETE",
            entityType: ENTITY_TYPES.CARRIER,
            entityId: id,
            summary: `Deleted carrier: ${existing.code} — ${existing.name}`,
            beforeSnapshot: existing as object,
          },
          tx,
        );

        deleted.push(id);
      }
    });

    return { deleted, skipped };
  }
}
