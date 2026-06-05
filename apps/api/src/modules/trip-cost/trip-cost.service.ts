import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import { PrismaService } from "../../config/prisma.service";
import type { CreateTripCostDto, UpdateTripCostDto } from "@tms/shared";

@Injectable()
export class TripCostService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tripCost.findMany({
      select: { id: true, name: true, amount: true, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async create(dto: CreateTripCostDto) {
    try {
      return await this.prisma.tripCost.create({
        data: {
          name: dto.name.trim(),
          amount: dto.amount ?? null,
        },
        select: { id: true, name: true, amount: true, isActive: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException(`Cost name "${dto.name}" already exists`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateTripCostDto) {
    const existing = await this.prisma.tripCost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`TripCost ${id} not found`);

    try {
      return await this.prisma.tripCost.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.amount !== undefined && { amount: dto.amount }),
        },
        select: { id: true, name: true, amount: true, isActive: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException(`Cost name "${dto.name}" already exists`);
      }
      throw e;
    }
  }

  async hardDelete(id: string) {
    const existing = await this.prisma.tripCost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`TripCost ${id} not found`);
    await this.prisma.tripCost.delete({ where: { id } });
    return { deleted: true };
  }
}
