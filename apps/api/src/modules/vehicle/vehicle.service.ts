import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ENTITY_TYPES } from "@tms/shared";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";

@Injectable()
export class VehicleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.vehicle.findMany({
      include: {
        driver: { select: { id: true, fullName: true, phone: true } },
        trailers: {
          where: { releasedAt: null },
          include: { trailer: true },
        },
      },
      orderBy: { licensePlate: "asc" },
    });
  }

  async create(dto: CreateVehicleDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const vehicle = await tx.vehicle.create({
          data: {
            licensePlate: dto.licensePlate,
            vehicleType: dto.vehicleType as any,
            status: "WAITING_DRIVER",
            inspectionExpiry: dto.inspectionExpiry ? new Date(dto.inspectionExpiry) : undefined,
            insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : undefined,
            registrationExpiry: dto.registrationExpiry ? new Date(dto.registrationExpiry) : undefined,
            notes: dto.notes,
          },
        });
        await this.auditService.log(
          {
            action: "CREATE",
            entityType: ENTITY_TYPES.VEHICLE,
            entityId: vehicle.id,
            summary: `Created vehicle: ${vehicle.licensePlate}`,
            afterSnapshot: vehicle as object,
          },
          tx,
        );
        return vehicle;
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictException("License plate already registered");
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Vehicle not found");

    try {
      return await this.prisma.$transaction(async (tx) => {
        const vehicle = await tx.vehicle.update({
          where: { id },
          data: {
            ...(dto.licensePlate !== undefined && { licensePlate: dto.licensePlate }),
            ...(dto.vehicleType !== undefined && { vehicleType: dto.vehicleType as any }),
            ...(dto.status !== undefined && { status: dto.status as any }),
            ...(dto.inspectionExpiry !== undefined && {
              inspectionExpiry: dto.inspectionExpiry ? new Date(dto.inspectionExpiry) : null,
            }),
            ...(dto.insuranceExpiry !== undefined && {
              insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
            }),
            ...(dto.registrationExpiry !== undefined && {
              registrationExpiry: dto.registrationExpiry ? new Date(dto.registrationExpiry) : null,
            }),
            ...(dto.notes !== undefined && { notes: dto.notes }),
          },
        });
        await this.auditService.log(
          {
            action: "UPDATE",
            entityType: ENTITY_TYPES.VEHICLE,
            entityId: vehicle.id,
            summary: `Updated vehicle: ${vehicle.licensePlate}`,
            beforeSnapshot: existing as object,
            afterSnapshot: vehicle as object,
          },
          tx,
        );
        return vehicle;
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictException("License plate already registered");
      }
      throw err;
    }
  }

  async getComplianceAlerts(daysAhead = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    const [vehicles, trailers] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { inspectionExpiry: { lte: cutoff } },
            { insuranceExpiry: { lte: cutoff } },
            { registrationExpiry: { lte: cutoff } },
          ],
        },
        include: { driver: true },
      }),
      this.prisma.trailer.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { inspectionExpiry: { lte: cutoff } },
            { insuranceExpiry: { lte: cutoff } },
            { registrationExpiry: { lte: cutoff } },
          ],
        },
      }),
    ]);

    return { vehicles, trailers };
  }
}
