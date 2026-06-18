import { BadRequestException, Injectable } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { ImportResult } from "@tms/shared";
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
  ): Promise<ImportResult | { toCreate: number; warnings: string[]; errors: string[] }> {
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
      let toCreate = 0;
      for (const row of rows) {
        if (row.type === "record") toCreate++;
      }

      // Collect structural errors
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

      return { toCreate, warnings: [], errors };
    }

    // ── Phase 2: Execute (writes) ─────────────────────────────────────────────
    const warnings: string[] = [];
    let imported = 0;
    let currentRecordId: string | null = null;

    for (const row of rows) {
      try {
        if (row.type === "record") {
          if (row.bienSo) {
            const existing = await this.prisma.vehicleRecord.findFirst({
              where: { bienSo: row.bienSo },
            });
            if (existing) {
              warnings.push(`Hàng ${row.rowNum}: biển số ${row.bienSo} đã tồn tại, bỏ qua`);
              currentRecordId = existing.id;
              continue;
            }
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

        if (!row.tripDate) {
          errors.push(`Hàng ${row.rowNum}: thiếu ngày, bỏ qua`);
          continue;
        }

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
              vehiclePlate: row.vehiclePlate ?? null,
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
