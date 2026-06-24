import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";
import {
  ENTITY_TYPES,
  type VehicleRecordFilters,
  type PaginationQuery,
  type PaginatedResponse,
} from "@tms/shared";
import { CreateVehicleRecordDto } from "./dto/create-vehicle-record.dto";
import { UpdateVehicleRecordDto } from "./dto/update-vehicle-record.dto";

@Injectable()
export class VehicleRecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    filters: VehicleRecordFilters,
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
          { tenTaiXe: { contains: s, mode: Prisma.QueryMode.insensitive } },
          { sdt: { contains: s } },
          { loaiXe: { contains: s, mode: Prisma.QueryMode.insensitive } },
          { bienSo: { contains: s, mode: Prisma.QueryMode.insensitive } },
          { moocs: { some: { soMooc: { contains: s, mode: Prisma.QueryMode.insensitive } } } },
        ],
      });
    }

    if (filters.expiryFrom || filters.expiryTo) {
      const range: Prisma.DateTimeNullableFilter = {};
      if (filters.expiryFrom) range.gte = new Date(filters.expiryFrom);
      if (filters.expiryTo) {
        const end = new Date(filters.expiryTo);
        end.setHours(23, 59, 59, 999);
        range.lte = end;
      }

      const expiryConditions: Prisma.VehicleRecordWhereInput[] = [];
      const scope = filters.expiryScope ?? "all";
      const type = filters.expiryType ?? "all";

      if (scope !== "mooc") {
        if (type !== "cavet") expiryConditions.push({ hanDangKiem: range });
        if (type !== "dangkiem") expiryConditions.push({ hanCaVet: range });
      }
      if (scope !== "xe") {
        if (type !== "cavet") expiryConditions.push({ moocs: { some: { hanDangKiem: range } } });
        if (type !== "dangkiem") expiryConditions.push({ moocs: { some: { hanCaVet: range } } });
      }

      if (expiryConditions.length > 0) {
        andConditions.push({ OR: expiryConditions });
      }
    }

    const where: Prisma.VehicleRecordWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [data, total] = await Promise.all([
      this.prisma.vehicleRecord.findMany({
        where,
        include: { moocs: true, kmRounds: { orderBy: { roundNumber: "asc" } } },
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
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

  async create(dto: CreateVehicleRecordDto) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.vehicleRecord.create({
        data: {
          tenTaiXe: dto.tenTaiXe,
          sdt: dto.sdt,
          loaiXe: dto.loaiXe,
          bienSo: dto.bienSo,
          hanDangKiem: dto.hanDangKiem ? new Date(dto.hanDangKiem) : undefined,
          hanBaoHiem: dto.hanBaoHiem ? new Date(dto.hanBaoHiem) : undefined,
          hanCaVet: dto.hanCaVet ? new Date(dto.hanCaVet) : undefined,
          ghiChu: dto.ghiChu,
          donViSuaChua: dto.donViSuaChua,
          ngayLam: dto.ngayLam ? new Date(dto.ngayLam) : undefined,
          kmHienTai: dto.kmHienTai,
          ghiChuBaoDuong: dto.ghiChuBaoDuong,
          moocs: dto.moocs?.length
            ? {
                create: dto.moocs.map((m) => ({
                  soMooc: m.soMooc,
                  hanDangKiem: m.hanDangKiem ? new Date(m.hanDangKiem) : undefined,
                  hanBaoHiem: m.hanBaoHiem ? new Date(m.hanBaoHiem) : undefined,
                  hanCaVet: m.hanCaVet ? new Date(m.hanCaVet) : undefined,
                })),
              }
            : undefined,
        },
        include: { moocs: true, kmRounds: { orderBy: { roundNumber: "asc" } } },
      });

      await this.auditService.log(
        {
          action: "CREATE",
          entityType: ENTITY_TYPES.VEHICLE_RECORD,
          entityId: record.id,
          summary: `Created vehicle record: ${record.bienSo ?? "(no plate)"} — ${record.tenTaiXe ?? "(no driver)"}`,
          afterSnapshot: record as object,
        },
        tx,
      );

      return record;
    });
  }

  async update(id: string, dto: UpdateVehicleRecordDto) {
    const existing = await this.prisma.vehicleRecord.findUnique({
      where: { id },
      include: { moocs: true },
    });
    if (!existing) throw new NotFoundException("Vehicle record not found");

    return this.prisma.$transaction(async (tx) => {
      if (dto.moocs !== undefined) {
        await tx.vehicleRecordMooc.deleteMany({ where: { vehicleRecordId: id } });
      }

      const record = await tx.vehicleRecord.update({
        where: { id },
        data: {
          ...(dto.tenTaiXe !== undefined && { tenTaiXe: dto.tenTaiXe }),
          ...(dto.sdt !== undefined && { sdt: dto.sdt }),
          ...(dto.loaiXe !== undefined && { loaiXe: dto.loaiXe }),
          ...(dto.bienSo !== undefined && { bienSo: dto.bienSo }),
          ...(dto.hanDangKiem !== undefined && {
            hanDangKiem: dto.hanDangKiem ? new Date(dto.hanDangKiem) : null,
          }),
          ...(dto.hanBaoHiem !== undefined && {
            hanBaoHiem: dto.hanBaoHiem ? new Date(dto.hanBaoHiem) : null,
          }),
          ...(dto.hanCaVet !== undefined && {
            hanCaVet: dto.hanCaVet ? new Date(dto.hanCaVet) : null,
          }),
          ...(dto.ghiChu !== undefined && { ghiChu: dto.ghiChu }),
          ...(dto.donViSuaChua !== undefined && { donViSuaChua: dto.donViSuaChua ?? null }),
          ...(dto.ngayLam !== undefined && { ngayLam: dto.ngayLam ? new Date(dto.ngayLam) : null }),
          ...(dto.kmHienTai !== undefined && { kmHienTai: dto.kmHienTai ?? null }),
          ...(dto.ghiChuBaoDuong !== undefined && { ghiChuBaoDuong: dto.ghiChuBaoDuong ?? null }),
          ...(dto.moocs !== undefined &&
            dto.moocs.length > 0 && {
              moocs: {
                create: dto.moocs.map((m) => ({
                  soMooc: m.soMooc,
                  hanDangKiem: m.hanDangKiem ? new Date(m.hanDangKiem) : undefined,
                  hanBaoHiem: m.hanBaoHiem ? new Date(m.hanBaoHiem) : undefined,
                  hanCaVet: m.hanCaVet ? new Date(m.hanCaVet) : undefined,
                })),
              },
            }),
        },
        include: { moocs: true, kmRounds: { orderBy: { roundNumber: "asc" } } },
      });

      await this.auditService.log(
        {
          action: "UPDATE",
          entityType: ENTITY_TYPES.VEHICLE_RECORD,
          entityId: record.id,
          summary: `Updated vehicle record: ${record.bienSo ?? "(no plate)"} — ${record.tenTaiXe ?? "(no driver)"}`,
          beforeSnapshot: existing as object,
          afterSnapshot: record as object,
        },
        tx,
      );

      return record;
    });
  }

  async distinctLoaiXe(): Promise<string[]> {
    const rows = await this.prisma.vehicleRecord.findMany({
      select: { loaiXe: true },
      distinct: ["loaiXe"],
      where: { loaiXe: { not: null } },
      orderBy: { loaiXe: "asc" },
    });
    return rows.map((r) => r.loaiXe as string);
  }

  async delete(id: string) {
    const existing = await this.prisma.vehicleRecord.findUnique({
      where: { id },
      include: { moocs: true },
    });
    if (!existing) throw new NotFoundException("Vehicle record not found");

    return this.prisma.$transaction(async (tx) => {
      await tx.vehicleRecord.delete({ where: { id } });

      await this.auditService.log(
        {
          action: "DELETE",
          entityType: ENTITY_TYPES.VEHICLE_RECORD,
          entityId: id,
          summary: `Deleted vehicle record: ${existing.bienSo ?? "(no plate)"} — ${existing.tenTaiXe ?? "(no driver)"}`,
          beforeSnapshot: existing as object,
        },
        tx,
      );
    });
  }
}
