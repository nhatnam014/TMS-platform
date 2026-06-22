import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db"; // kept for QueryMode
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { PaginationQuery, PaginatedResponse } from "@tms/shared";
import { UpdateMaintenanceFieldsDto } from "./dto/update-maintenance-fields.dto";
import { KmRoundDto } from "./dto/km-round.dto";

@Injectable()
export class VehicleMaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    filters: { search?: string; loaiXe?: string },
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<any>> {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    const andConditions: Prisma.VehicleRecordWhereInput[] = [];

    if (filters.search) {
      const s = filters.search.trim();
      andConditions.push({
        OR: [
          { bienSo: { contains: s, mode: Prisma.QueryMode.insensitive } },
          { tenTaiXe: { contains: s, mode: Prisma.QueryMode.insensitive } },
          { donViSuaChua: { contains: s, mode: Prisma.QueryMode.insensitive } },
          { loaiXe: { contains: s, mode: Prisma.QueryMode.insensitive } },
        ],
      });
    }

    if (filters.loaiXe) {
      andConditions.push({ loaiXe: { equals: filters.loaiXe, mode: Prisma.QueryMode.insensitive } });
    }

    const where: Prisma.VehicleRecordWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [data, total] = await Promise.all([
      this.prisma.vehicleRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        include: { kmRounds: { orderBy: { roundNumber: "asc" } } },
      }),
      this.prisma.vehicleRecord.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async distinctUnits(): Promise<string[]> {
    const rows = await this.prisma.vehicleRecord.findMany({
      select: { loaiXe: true },
      distinct: ["loaiXe"],
      where: { loaiXe: { not: null } },
      orderBy: { loaiXe: "asc" },
    });
    return rows.map((r) => r.loaiXe as string);
  }

  async findOne(vehicleRecordId: string) {
    const record = await this.prisma.vehicleRecord.findUnique({
      where: { id: vehicleRecordId },
      include: { kmRounds: { orderBy: { roundNumber: "asc" } } },
    });
    if (!record) throw new NotFoundException("Vehicle record not found");
    return {
      donViSuaChua: record.donViSuaChua,
      ngayLam: record.ngayLam,
      kmRounds: record.kmRounds,
    };
  }

  async updateMaintenanceFields(vehicleRecordId: string, dto: UpdateMaintenanceFieldsDto) {
    const existing = await this.prisma.vehicleRecord.findUnique({ where: { id: vehicleRecordId } });
    if (!existing) throw new NotFoundException("Vehicle record not found");

    const record = await this.prisma.vehicleRecord.update({
      where: { id: vehicleRecordId },
      data: {
        ...(dto.donViSuaChua !== undefined && { donViSuaChua: dto.donViSuaChua ?? null }),
        ...(dto.ngayLam !== undefined && { ngayLam: dto.ngayLam ? new Date(dto.ngayLam) : null }),
      },
    });

    await this.auditService.log({
      action: "UPDATE",
      entityType: "VehicleRecord",
      entityId: vehicleRecordId,
      summary: `Cập nhật thông tin bảo dưỡng: ${record.bienSo ?? "(chưa có biển số)"}`,
      beforeSnapshot: existing as object,
      afterSnapshot: record as object,
    });

    return record;
  }

  async listKmRounds(vehicleRecordId: string) {
    const record = await this.prisma.vehicleRecord.findUnique({ where: { id: vehicleRecordId } });
    if (!record) throw new NotFoundException("Vehicle record not found");

    return this.prisma.vehicleMaintenanceKmRound.findMany({
      where: { vehicleRecordId },
      orderBy: { roundNumber: "asc" },
    });
  }

  async batchUpsertKmRounds(vehicleRecordId: string, rounds: KmRoundDto[]) {
    const record = await this.prisma.vehicleRecord.findUnique({ where: { id: vehicleRecordId } });
    if (!record) throw new NotFoundException("Vehicle record not found");

    const results = await Promise.all(
      rounds.map((r) =>
        this.prisma.vehicleMaintenanceKmRound.upsert({
          where: { vehicleRecordId_roundNumber: { vehicleRecordId, roundNumber: r.roundNumber } },
          create: { vehicleRecordId, roundNumber: r.roundNumber, kmCon: r.kmCon },
          update: { kmCon: r.kmCon },
        }),
      ),
    );

    return results;
  }

  async deleteKmRound(vehicleRecordId: string, roundNumber: number) {
    const existing = await this.prisma.vehicleMaintenanceKmRound.findUnique({
      where: { vehicleRecordId_roundNumber: { vehicleRecordId, roundNumber } },
    });
    if (!existing) throw new NotFoundException("Km round not found");

    await this.prisma.vehicleMaintenanceKmRound.delete({
      where: { vehicleRecordId_roundNumber: { vehicleRecordId, roundNumber } },
    });
  }
}
