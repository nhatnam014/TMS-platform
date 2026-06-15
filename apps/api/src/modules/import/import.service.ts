import { BadRequestException, Injectable } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { ImportResult, VehicleConflictEntry, VehicleImportPreviewResult } from "@tms/shared";
import { parseQuanLyXe } from "./parsers/quanly-xe.parser";
import { parseKeHoachXe } from "./parsers/kehoach-xe.parser";

@Injectable()
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async importVehicles(
    buffer: Buffer,
    confirm: boolean,
  ): Promise<ImportResult | VehicleImportPreviewResult> {
    let rows: ReturnType<typeof parseQuanLyXe>;
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
      rows = parseQuanLyXe(workbook);
    } catch (err) {
      console.error("[import/vehicles] xlsx parse failed:", err);
      throw new BadRequestException("File không hợp lệ hoặc không đúng định dạng .xlsx");
    }

    const errors: string[] = [];

    // ── Phase 1: Preview (no writes) ──────────────────────────────────────────
    if (!confirm) {
      const conflicts: VehicleConflictEntry[] = [];
      let toCreate = 0;

      for (const row of rows) {
        if (row.type !== "record") continue;

        toCreate++;

        if (row.bienSo) {
          const conflict = await this.detectVehicleConflict(row.bienSo, row);
          if (conflict) conflicts.push(conflict);
        }
      }

      // Collect structural errors (mooc_continuation with no preceding record)
      let hasRecord = false;
      for (const row of rows) {
        if (row.type === "record") {
          hasRecord = true;
          continue;
        }
        if (row.type === "mooc_continuation" && !hasRecord) {
          errors.push(`Hàng ${row.rowNum}: mooc continuation nhưng chưa có xe nào, bỏ qua`);
        }
      }

      return { toCreate, conflicts, errors };
    }

    // ── Phase 2: Execute (writes) ─────────────────────────────────────────────
    const warnings: string[] = [];
    let imported = 0;
    let currentRecordId: string | null = null;

    for (const row of rows) {
      try {
        if (row.type === "record") {
          // Driver upsert — only when both name and phone are present
          if (row.tenTaiXe && row.sdt) {
            await this.findOrCreateDriver(row.tenTaiXe, row.sdt);
          }

          // Vehicle upsert (create or update on conflict)
          if (row.bienSo) {
            await this.upsertVehicle(row.bienSo, row);
          }

          const record = await this.prisma.vehicleRecord.create({
            data: {
              tenTaiXe: row.tenTaiXe ?? null,
              sdt: row.sdt ?? null,
              loaiXe: row.loaiXe ?? null,
              bienSo: row.bienSo ?? null,
              hanDangKiem: row.hanDangKiem ?? null,
              hanBaoHiem: row.hanBaoHiem ?? null,
              hanCaVet: row.hanCaVet ?? null,
              ghiChu: row.ghiChu ?? null,
              ...(row.soMooc
                ? {
                    moocs: {
                      create: [
                        {
                          soMooc: row.soMooc,
                          hanDangKiem: row.moocHanDangKiem ?? null,
                          hanBaoHiem: row.moocHanBaoHiem ?? null,
                          hanCaVet: row.moocHanCaVet ?? null,
                        },
                      ],
                    },
                  }
                : {}),
            },
          });
          currentRecordId = record.id;
          imported++;
        } else if (row.type === "mooc_continuation") {
          if (!currentRecordId) {
            errors.push(`Hàng ${row.rowNum}: mooc continuation nhưng chưa có xe nào, bỏ qua`);
            continue;
          }
          await this.prisma.vehicleRecordMooc.create({
            data: {
              vehicleRecordId: currentRecordId,
              soMooc: row.soMooc ?? "",
              hanDangKiem: row.moocHanDangKiem ?? null,
              hanBaoHiem: row.moocHanBaoHiem ?? null,
              hanCaVet: row.moocHanCaVet ?? null,
            },
          });
        }
      } catch (err) {
        errors.push(`Hàng ${row.rowNum}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    try {
      await this.auditService.log({
        action: "CREATE",
        entityType: "VehicleRecord",
        summary: `Excel import: ${imported} bản ghi quản lý xe, ${errors.length} lỗi`,
      });
    } catch (err) {
      console.error("Audit log failed (non-fatal):", err);
    }

    return { imported, warnings, errors };
  }

  private async findOrCreateDriver(fullName: string, phone: string) {
    if (!fullName && !phone) return null;
    const existing = await this.prisma.driver.findFirst({
      where: { fullName, phone: phone || null },
    });
    if (existing) return existing;
    return this.prisma.driver.create({
      data: { fullName, phone: phone || null, status: "ACTIVE" },
    });
  }

  private async detectVehicleConflict(
    licensePlate: string,
    row: ReturnType<typeof parseQuanLyXe>[number],
  ): Promise<VehicleConflictEntry | null> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { licensePlate } });
    if (!vehicle) return null;

    const fields: VehicleConflictEntry["fields"] = {};

    if (row.loaiXe && vehicle.vehicleType !== row.loaiXe) {
      fields["vehicleType"] = { current: vehicle.vehicleType, incoming: row.loaiXe };
    }

    const toDateStr = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

    const incomingInspection = toDateStr(row.hanDangKiem);
    const currentInspection = toDateStr(vehicle.inspectionExpiry);
    if (incomingInspection !== currentInspection) {
      fields["inspectionExpiry"] = { current: currentInspection, incoming: incomingInspection };
    }

    const incomingInsurance = toDateStr(row.hanBaoHiem);
    const currentInsurance = toDateStr(vehicle.insuranceExpiry);
    if (incomingInsurance !== currentInsurance) {
      fields["insuranceExpiry"] = { current: currentInsurance, incoming: incomingInsurance };
    }

    const incomingRegistration = toDateStr(row.hanCaVet);
    const currentRegistration = toDateStr(vehicle.registrationExpiry);
    if (incomingRegistration !== currentRegistration) {
      fields["registrationExpiry"] = {
        current: currentRegistration,
        incoming: incomingRegistration,
      };
    }

    if (Object.keys(fields).length === 0) return null;
    return { licensePlate, fields };
  }

  private async upsertVehicle(licensePlate: string, row: ReturnType<typeof parseQuanLyXe>[number]) {
    const existing = await this.prisma.vehicle.findUnique({ where: { licensePlate } });
    const KNOWN_VEHICLE_TYPES = ["SHACMAN", "CHENGLONG", "HOWO", "FREIGHTLINER", "FAW", "OTHER"];
    const vehicleType =
      row.loaiXe && KNOWN_VEHICLE_TYPES.includes(row.loaiXe) ? (row.loaiXe as any) : "OTHER";

    if (existing) {
      await this.prisma.vehicle.update({
        where: { licensePlate },
        data: {
          vehicleType,
          inspectionExpiry: row.hanDangKiem ?? null,
          insuranceExpiry: row.hanBaoHiem ?? null,
          registrationExpiry: row.hanCaVet ?? null,
        },
      });
    } else {
      await this.prisma.vehicle.create({
        data: {
          licensePlate,
          vehicleType,
          inspectionExpiry: row.hanDangKiem ?? null,
          insuranceExpiry: row.hanBaoHiem ?? null,
          registrationExpiry: row.hanCaVet ?? null,
        },
      });
    }
  }

  async importTripPlans(buffer: Buffer): Promise<ImportResult> {
    const warnings: string[] = [];
    let rows: ReturnType<typeof parseKeHoachXe>;
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
      rows = parseKeHoachXe(workbook, warnings);
    } catch (err) {
      console.error("[import/trip-plans] xlsx parse failed:", err);
      throw new BadRequestException("File không hợp lệ hoặc không đúng định dạng .xlsx");
    }
    const errors: string[] = [];
    let imported = 0;

    for (const row of rows) {
      try {
        if (row.type === "skip") {
          if (row.reason) errors.push(row.reason);
          continue;
        }

        if (!row.vehiclePlate) {
          errors.push(`Hàng ${row.rowNum}: thiếu số xe, bỏ qua`);
          continue;
        }
        if (!row.tripDate) {
          errors.push(`Hàng ${row.rowNum}: thiếu ngày, bỏ qua`);
          continue;
        }

        const vehicle = await this.findOrCreateVehicle(row.vehiclePlate, warnings);
        const customer = await this.findOrCreateCustomer(row.customerName, warnings);

        let carrierId: string | undefined;
        if (row.carrierName) {
          const carrier = await this.findOrCreateCarrier(row.carrierName, warnings);
          carrierId = carrier.id;
        }

        await this.prisma.$transaction(async (tx) => {
          const serviceTypeId = row.serviceTypeCode
            ? (
                await this.lookupOrCreateServiceType(
                  row.serviceTypeCode,
                  row.serviceTypeCode,
                  warnings,
                  tx,
                )
              ).id
            : (await this.lookupOrCreateServiceType("SEA-EX", "SEA - EXPORT", warnings, tx)).id;

          const containerSizeId = row.containerSizeCode
            ? (await this.lookupOrCreateContainerSize(row.containerSizeCode, warnings, tx)).id
            : null;

          const tripPlan = await tx.tripPlan.create({
            data: {
              tripDate: row.tripDate!,
              tripNumber: row.tripNumber ?? null,
              serviceTypeId,
              vehicleId: vehicle.id,
              customerId: customer.id,
              carrierId: carrierId ?? null,
              containerSizeId,
              outboundContainerNumber: row.outboundContainerNumber ?? null,
              inboundContainerNumber: row.inboundContainerNumber ?? null,
              pickupLocationName: row.pickupLocationName ?? null,
              loadUnloadLocationName: row.loadUnloadLocationName ?? null,
              dropoffLocationName: row.dropoffLocationName ?? null,
              description: row.description ?? null,
              notes: row.notes ?? null,
            },
          });

          for (const costItem of row.costs ?? []) {
            await tx.tripPlanCost.create({
              data: {
                tripPlanId: tripPlan.id,
                costName: costItem.costName,
                amount: costItem.amount,
                invoiceNumber: costItem.invoiceNumber ?? null,
              },
            });
          }
        });

        imported++;
      } catch (err) {
        errors.push(`Hàng ${row.rowNum}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    await this.auditService.log({
      action: "CREATE",
      entityType: "TripPlan",
      summary: `Excel import: ${imported} chuyến xe, ${warnings.length} cảnh báo, ${errors.length} lỗi`,
    });

    return { imported, warnings, errors };
  }

  private async lookupOrCreateServiceType(
    code: string,
    description: string,
    warnings: string[],
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
  ) {
    const existing = await tx.serviceTypeMaster.findUnique({ where: { code } });
    if (existing) return existing;
    warnings.push(`Tạo mới loại dịch vụ: ${code}`);
    return tx.serviceTypeMaster.create({ data: { code, description } });
  }

  private async lookupOrCreateContainerSize(
    code: string,
    warnings: string[],
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
  ) {
    const existing = await tx.containerSize.findUnique({ where: { code } });
    if (existing) return existing;
    warnings.push(`Tạo mới size cont: ${code}`);
    return tx.containerSize.create({ data: { code, name: code } });
  }

  private async findOrCreateVehicle(licensePlate: string, warnings: string[]) {
    const existing = await this.prisma.vehicle.findUnique({ where: { licensePlate } });
    if (existing) return existing;
    warnings.push(`Xe mới tự tạo: ${licensePlate}`);
    return this.prisma.vehicle.create({ data: { licensePlate, vehicleType: "OTHER" } });
  }

  private async findOrCreateCustomer(name: string | undefined, warnings: string[]) {
    if (!name) {
      return this.prisma.customer
        .findFirst({ where: { code: "UNKNOWN" } })
        .then(
          (c) =>
            c ?? this.prisma.customer.create({ data: { code: "UNKNOWN", name: "Không xác định" } }),
        );
    }
    const existing = await this.prisma.customer.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) return existing;
    warnings.push(`Khách hàng mới tự tạo: ${name}`);
    const code = name.toUpperCase().replace(/\s+/g, "_").slice(0, 50);
    return this.prisma.customer.create({ data: { code: `${code}_${Date.now()}`, name } });
  }

  private async findOrCreateCarrier(name: string, warnings: string[]) {
    const existing = await this.prisma.carrier.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) return existing;
    warnings.push(`Hãng xe mới tự tạo: ${name}`);
    const code = name.toUpperCase().replace(/\s+/g, "_").slice(0, 50);
    return this.prisma.carrier.create({ data: { code: `${code}_${Date.now()}`, name } });
  }
}
