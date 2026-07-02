import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import { ENTITY_TYPES } from "@tms/shared";
import type {
  CreateLocationDto,
  UpdateLocationDto,
  PaginationQuery,
  PaginatedResponse,
  BulkDeleteResult,
} from "@tms/shared";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class LocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    search: string | undefined,
    type: string | undefined,
    pagination: PaginationQuery = {},
  ): Promise<PaginatedResponse<any>> {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LocationWhereInput = { isActive: true };
    if (type) where.locationType = type as any;
    if (search?.trim()) {
      const s = search.trim();
      where.OR = [
        { name: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { code: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { address: { contains: s, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        select: { id: true, code: true, name: true, locationType: true, address: true },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.location.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(dto: CreateLocationDto) {
    return this.prisma.$transaction(async (tx) => {
      try {
        const location = await tx.location.create({
          data: {
            code: dto.code,
            name: dto.name,
            locationType: dto.locationType as any,
            address: dto.address,
            latitude: dto.latitude,
            longitude: dto.longitude,
          },
        });

        await this.auditService.log(
          {
            action: "CREATE",
            entityType: ENTITY_TYPES.LOCATION,
            entityId: location.id,
            summary: `Created location: ${location.code} — ${location.name}`,
            afterSnapshot: location as object,
          },
          tx,
        );

        return location;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new ConflictException(`Location code "${dto.code}" is already in use`);
        }
        throw e;
      }
    });
  }

  async update(id: string, dto: UpdateLocationDto) {
    const existing = await this.prisma.location.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Location ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      try {
        const location = await tx.location.update({
          where: { id },
          data: dto as any,
        });

        await this.auditService.log(
          {
            action: "UPDATE",
            entityType: ENTITY_TYPES.LOCATION,
            entityId: id,
            summary: `Updated location: ${location.code}`,
            beforeSnapshot: existing as object,
            afterSnapshot: location as object,
          },
          tx,
        );

        return location;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new ConflictException(`Location code "${dto.code}" is already in use`);
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
        const existing = await tx.location.findUnique({ where: { id } });
        if (!existing) {
          skipped.push({ id, reason: "Not found" });
          continue;
        }

        await tx.location.delete({ where: { id } });

        await this.auditService.log(
          {
            action: "DELETE",
            entityType: ENTITY_TYPES.LOCATION,
            entityId: id,
            summary: `Deleted location: ${existing.code} — ${existing.name}`,
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
