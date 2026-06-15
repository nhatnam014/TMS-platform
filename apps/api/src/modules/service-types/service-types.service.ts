import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import type { CreateServiceTypeDto, UpdateServiceTypeDto } from "@tms/shared";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class ServiceTypesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.serviceTypeMaster.findMany({
      orderBy: { code: "asc" },
    });
  }

  async create(dto: CreateServiceTypeDto) {
    try {
      return await this.prisma.serviceTypeMaster.create({
        data: {
          code: dto.code,
          description: dto.description,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException(`Service type code "${dto.code}" is already in use`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateServiceTypeDto) {
    const existing = await this.prisma.serviceTypeMaster.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Service type ${id} not found`);

    try {
      return await this.prisma.serviceTypeMaster.update({
        where: { id },
        data: dto,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException(`Service type code "${dto.code}" is already in use`);
      }
      throw e;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.serviceTypeMaster.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Service type ${id} not found`);

    const tripPlanCount = await this.prisma.tripPlan.count({
      where: { serviceTypeId: id },
    });
    if (tripPlanCount > 0) {
      throw new ConflictException(
        `Cannot delete: ${tripPlanCount} trip plan(s) reference this service type`,
      );
    }

    return this.prisma.serviceTypeMaster.delete({ where: { id } });
  }
}
