import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ENTITY_TYPES } from "@tms/shared";
import { CreateVehicleRecordDto } from "./dto/create-vehicle-record.dto";
import { UpdateVehicleRecordDto } from "./dto/update-vehicle-record.dto";

@Injectable()
export class VehicleRecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.vehicleRecord.findMany({
      include: { moocs: true },
      orderBy: { createdAt: "asc" },
    });
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
        include: { moocs: true },
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
        include: { moocs: true },
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
