import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import type {
  CreateServiceTypeDto,
  UpdateServiceTypeDto,
  PaginationQuery,
  PaginatedResponse,
} from "@tms/shared";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class ServiceTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    search: string | undefined,
    isActive: boolean | undefined,
    pagination: PaginationQuery = {},
  ): Promise<PaginatedResponse<any>> {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceTypeMasterWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search?.trim()) {
      const s = search.trim();
      where.OR = [
        { code: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: s, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.serviceTypeMaster.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: "asc" },
      }),
      this.prisma.serviceTypeMaster.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
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
