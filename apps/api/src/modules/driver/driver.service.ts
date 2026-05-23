import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ENTITY_TYPES } from "@tms/shared";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";

@Injectable()
export class DriverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.driver.findMany({
      orderBy: { fullName: "asc" },
      include: {
        vehicle: {
          select: { id: true, licensePlate: true, vehicleType: true },
        },
      },
    });
  }

  async create(dto: CreateDriverDto) {
    return this.prisma.$transaction(async (tx) => {
      const driver = await tx.driver.create({
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          notes: dto.notes,
          status: "ACTIVE",
        },
      });
      await this.auditService.log(
        {
          action: "CREATE",
          entityType: ENTITY_TYPES.DRIVER,
          entityId: driver.id,
          summary: `Created driver: ${driver.fullName}`,
          afterSnapshot: driver as object,
        },
        tx,
      );
      return driver;
    });
  }

  async update(id: string, dto: UpdateDriverDto) {
    const existing = await this.prisma.driver.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Driver not found");

    return this.prisma.$transaction(async (tx) => {
      // Handle vehicle assignment/unassignment
      if (dto.vehicleId !== undefined) {
        if (dto.vehicleId === null) {
          // Unassign: clear vehicleId and set vehicle back to WAITING_DRIVER
          if (existing.vehicleId) {
            await tx.vehicle.update({
              where: { id: existing.vehicleId },
              data: { status: "WAITING_DRIVER" },
            });
          }
          await tx.driver.update({ where: { id }, data: { vehicleId: null } });
        } else {
          // Assign: validate vehicle exists and has no other driver
          const vehicle = await tx.vehicle.findUnique({ where: { id: dto.vehicleId } });
          if (!vehicle) throw new NotFoundException("Vehicle not found");

          const otherDriver = await tx.driver.findFirst({
            where: { vehicleId: dto.vehicleId, id: { not: id } },
          });
          if (otherDriver) throw new ConflictException("Vehicle already has an assigned driver");

          await tx.driver.update({ where: { id }, data: { vehicleId: dto.vehicleId } });

          // Only transition WAITING_DRIVER → ACTIVE; leave MAINTENANCE alone
          if (vehicle.status === "WAITING_DRIVER") {
            await tx.vehicle.update({ where: { id: dto.vehicleId }, data: { status: "ACTIVE" } });
          }
        }
      }

      // Update other fields
      const { vehicleId: _v, ...rest } = dto;
      const driver = await tx.driver.update({
        where: { id },
        data: {
          ...(rest.fullName !== undefined && { fullName: rest.fullName }),
          ...(rest.phone !== undefined && { phone: rest.phone }),
          ...(rest.status !== undefined && { status: rest.status as any }),
          ...(rest.notes !== undefined && { notes: rest.notes }),
        },
        include: {
          vehicle: { select: { id: true, licensePlate: true, vehicleType: true } },
        },
      });

      await this.auditService.log(
        {
          action: "UPDATE",
          entityType: ENTITY_TYPES.DRIVER,
          entityId: driver.id,
          summary: `Updated driver: ${driver.fullName}`,
          beforeSnapshot: existing as object,
          afterSnapshot: driver as object,
        },
        tx,
      );

      return driver;
    });
  }
}
