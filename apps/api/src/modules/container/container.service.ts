import { Injectable } from "@nestjs/common";
import { ContainerStatus } from "@tms/db";
import { PrismaService } from "../../config/prisma.service";

export interface ContainerFilters {
  status?: ContainerStatus;
  locationId?: string;
}

@Injectable()
export class ContainerService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters: ContainerFilters = {}) {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.locationId) where.currentLocationId = filters.locationId;
    return this.prisma.container.findMany({
      where,
      include: { currentLocation: { select: { id: true, code: true, name: true } } },
      orderBy: { containerNumber: "asc" },
    });
  }
}
