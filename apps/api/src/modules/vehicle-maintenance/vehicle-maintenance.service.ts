import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { PaginationQuery, PaginatedResponse } from "@tms/shared";
import { CreateVehicleMaintenanceDto } from "./dto/create-vehicle-maintenance.dto";
import { UpdateVehicleMaintenanceDto } from "./dto/update-vehicle-maintenance.dto";

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

    const andConditions: Prisma.VehicleMaintenanceRecordWhereInput[] = [];

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

    const where: Prisma.VehicleMaintenanceRecordWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [data, total] = await Promise.all([
      this.prisma.vehicleMaintenanceRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ ngayLam: "desc" }, { createdAt: "desc" }],
      }),
      this.prisma.vehicleMaintenanceRecord.count({ where }),
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
    const rows = await this.prisma.vehicleMaintenanceRecord.findMany({
      select: { loaiXe: true },
      distinct: ["loaiXe"],
      where: { loaiXe: { not: null } },
      orderBy: { loaiXe: "asc" },
    });
    return rows.map((r) => r.loaiXe as string);
  }

  async findOne(id: string) {
    const record = await this.prisma.vehicleMaintenanceRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException("Vehicle maintenance record not found");
    return record;
  }

  async create(dto: CreateVehicleMaintenanceDto) {
    const vehicleRecord = dto.bienSo
      ? await this.prisma.vehicleRecord.findFirst({ where: { bienSo: dto.bienSo } })
      : null;

    const record = await this.prisma.vehicleMaintenanceRecord.create({
      data: {
        vehicleRecordId: vehicleRecord?.id ?? null,
        bienSo: dto.bienSo ?? null,
        tenTaiXe: dto.tenTaiXe ?? null,
        sdt: dto.sdt ?? null,
        loaiXe: dto.loaiXe ?? null,
        donViSuaChua: dto.donViSuaChua ?? null,
        ngayLam: dto.ngayLam ? new Date(dto.ngayLam) : null,
        soKmBaoDuong: dto.soKmBaoDuong ? new Prisma.Decimal(dto.soKmBaoDuong) : null,
        kiBaoDuongTiepTheo: dto.kiBaoDuongTiepTheo ? new Prisma.Decimal(dto.kiBaoDuongTiepTheo) : null,
        soKmHienTai: dto.soKmHienTai ? new Prisma.Decimal(dto.soKmHienTai) : null,
        ghiChu: dto.ghiChu ?? null,
      },
    });

    await this.auditService.log({
      action: "CREATE",
      entityType: "VehicleMaintenanceRecord",
      entityId: record.id,
      summary: `Tạo bảo dưỡng xe: ${record.bienSo ?? "(chưa có biển số)"} — ${record.ngayLam?.toISOString().slice(0, 10) ?? ""}`,
      afterSnapshot: record as object,
    });

    return record;
  }

  async update(id: string, dto: UpdateVehicleMaintenanceDto) {
    const existing = await this.prisma.vehicleMaintenanceRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Vehicle maintenance record not found");

    const bienSo = dto.bienSo !== undefined ? dto.bienSo : existing.bienSo;
    const vehicleRecord = bienSo
      ? await this.prisma.vehicleRecord.findFirst({ where: { bienSo } })
      : null;

    const record = await this.prisma.vehicleMaintenanceRecord.update({
      where: { id },
      data: {
        ...(dto.bienSo !== undefined && { bienSo: dto.bienSo ?? null, vehicleRecordId: vehicleRecord?.id ?? null }),
        ...(dto.tenTaiXe !== undefined && { tenTaiXe: dto.tenTaiXe ?? null }),
        ...(dto.sdt !== undefined && { sdt: dto.sdt ?? null }),
        ...(dto.loaiXe !== undefined && { loaiXe: dto.loaiXe ?? null }),
        ...(dto.donViSuaChua !== undefined && { donViSuaChua: dto.donViSuaChua ?? null }),
        ...(dto.ngayLam !== undefined && { ngayLam: dto.ngayLam ? new Date(dto.ngayLam) : null }),
        ...(dto.soKmBaoDuong !== undefined && {
          soKmBaoDuong: dto.soKmBaoDuong ? new Prisma.Decimal(dto.soKmBaoDuong) : null,
        }),
        ...(dto.kiBaoDuongTiepTheo !== undefined && {
          kiBaoDuongTiepTheo: dto.kiBaoDuongTiepTheo ? new Prisma.Decimal(dto.kiBaoDuongTiepTheo) : null,
        }),
        ...(dto.soKmHienTai !== undefined && {
          soKmHienTai: dto.soKmHienTai ? new Prisma.Decimal(dto.soKmHienTai) : null,
        }),
        ...(dto.ghiChu !== undefined && { ghiChu: dto.ghiChu ?? null }),
      },
    });

    await this.auditService.log({
      action: "UPDATE",
      entityType: "VehicleMaintenanceRecord",
      entityId: record.id,
      summary: `Cập nhật bảo dưỡng xe: ${record.bienSo ?? "(chưa có biển số)"}`,
      beforeSnapshot: existing as object,
      afterSnapshot: record as object,
    });

    return record;
  }

  async remove(id: string) {
    const existing = await this.prisma.vehicleMaintenanceRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Vehicle maintenance record not found");

    await this.prisma.vehicleMaintenanceRecord.delete({ where: { id } });

    await this.auditService.log({
      action: "DELETE",
      entityType: "VehicleMaintenanceRecord",
      entityId: id,
      summary: `Xóa bảo dưỡng xe: ${existing.bienSo ?? "(chưa có biển số)"}`,
      beforeSnapshot: existing as object,
    });
  }
}
