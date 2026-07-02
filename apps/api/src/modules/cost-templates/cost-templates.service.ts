import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreateCostTemplateDto,
  UpdateCostTemplateDto,
  PaginationQuery,
  PaginatedResponse,
  BulkDeleteResult,
} from "@tms/shared";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class CostTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    q: string | undefined,
    pagination: PaginationQuery = {},
  ): Promise<PaginatedResponse<any>> {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};

    const [data, total] = await Promise.all([
      this.prisma.costTemplate.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
      this.prisma.costTemplate.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  create(dto: CreateCostTemplateDto) {
    return this.prisma.costTemplate.create({
      data: {
        name: dto.name,
        defaultAmount: dto.defaultAmount !== undefined ? dto.defaultAmount : null,
      },
    });
  }

  async update(id: string, dto: UpdateCostTemplateDto) {
    const existing = await this.prisma.costTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Cost template ${id} not found`);

    return this.prisma.costTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...("defaultAmount" in dto ? { defaultAmount: dto.defaultAmount ?? null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.costTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Cost template ${id} not found`);
    return this.prisma.costTemplate.delete({ where: { id } });
  }

  async bulkDelete(ids: string[]): Promise<BulkDeleteResult> {
    const deleted: string[] = [];
    const skipped: { id: string; reason: string }[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const id of ids) {
        const existing = await tx.costTemplate.findUnique({ where: { id } });
        if (!existing) {
          skipped.push({ id, reason: "Not found" });
          continue;
        }

        await tx.costTemplate.delete({ where: { id } });
        deleted.push(id);
      }
    });

    return { deleted, skipped };
  }
}
