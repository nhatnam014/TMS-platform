import { Injectable, NotFoundException } from "@nestjs/common";
import type { CreateCostTemplateDto, UpdateCostTemplateDto } from "@tms/shared";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class CostTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(q?: string) {
    return this.prisma.costTemplate.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : {},
      orderBy: { name: "asc" },
    });
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
}
