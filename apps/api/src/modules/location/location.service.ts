import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import { ENTITY_TYPES } from "@tms/shared";
import type { CreateLocationDto, UpdateLocationDto } from "@tms/shared";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class LocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll() {
    return this.prisma.location.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, locationType: true, address: true },
      orderBy: { name: "asc" },
    });
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
}
