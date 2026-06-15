import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import type { CreateContainerSizeDto, UpdateContainerSizeDto } from "@tms/shared";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class ContainerSizesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.containerSize.findMany({
      orderBy: { code: "asc" },
    });
  }

  async create(dto: CreateContainerSizeDto) {
    try {
      return await this.prisma.containerSize.create({
        data: {
          code: dto.code,
          name: dto.name,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException(`Container size code "${dto.code}" is already in use`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateContainerSizeDto) {
    const existing = await this.prisma.containerSize.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Container size ${id} not found`);

    try {
      return await this.prisma.containerSize.update({
        where: { id },
        data: dto,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException(`Container size code "${dto.code}" is already in use`);
      }
      throw e;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.containerSize.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Container size ${id} not found`);

    const tripPlanCount = await this.prisma.tripPlan.count({
      where: { containerSizeId: id },
    });
    if (tripPlanCount > 0) {
      throw new ConflictException(
        `Cannot delete: ${tripPlanCount} trip plan(s) reference this container size`,
      );
    }

    return this.prisma.containerSize.delete({ where: { id } });
  }
}
