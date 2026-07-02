import { BadRequestException, Injectable } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";
import type {
  ImportResult,
  ImportChangedRecord,
  ImportChangedField,
  ImportCreatedRecord,
} from "@tms/shared";
import { parseQuanLyXe } from "./parsers/quanly-xe.parser";
import { parseKeHoachXe } from "./parsers/kehoach-xe.parser";
import { parseBaoDuongXe } from "./parsers/baoduong-xe.parser";
import { parseLenhBai } from "./parsers/lenh-bai.parser";
import { stripDrawingsFromXlsx } from "./utils/strip-drawings";

function normalizeForDiff(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && typeof (value as { toNumber?: unknown }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return value;
}

function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): ImportChangedField[] {
  const changes: ImportChangedField[] = [];
  for (const field of Object.keys(after)) {
    const oldValue = normalizeForDiff(before[field]);
    const newValue = normalizeForDiff(after[field]);
    if (oldValue !== newValue) {
      changes.push({ field, oldValue, newValue });
    }
  }
  return changes;
}

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
      const cleanedBuffer = await stripDrawingsFromXlsx(buffer);
      await workbook.xlsx.load(cleanedBuffer as unknown as ArrayBuffer);
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
    const createdRecords: ImportCreatedRecord[] = [];
    let imported = 0;
    let updated = 0;
    let currentRecordId: string | null = null;
    let currentRecordIsUpdate = false;
    let currentRecordIdentifier: string = "";
    let currentRecordRowNum = 0;
    let currentRecordMoocNames = new Set<string>();
    let currentRecordHasMoocColumn = false;
    const changeGroups = new Map<
      string,
      { rowNum: number; identifier: string; changes: ImportChangedField[] }
    >();

    function recordChanges(
      vehicleRecordId: string,
      rowNum: number,
      identifier: string,
      changes: ImportChangedField[],
    ) {
      if (changes.length === 0) return;
      const existing = changeGroups.get(vehicleRecordId);
      if (existing) {
        existing.changes.push(...changes);
      } else {
        changeGroups.set(vehicleRecordId, { rowNum, identifier, changes: [...changes] });
      }
    }

    // Deletes moocs left over from a previous import that no longer appear under the
    // vehicle's "record" row + its "mooc_continuation" rows in this file — only when this
    // file actually has a SỐ MOOC column (otherwise the file just doesn't track moocs at all).
    const flushMoocSync = async () => {
      if (!currentRecordId || !currentRecordIsUpdate || !currentRecordHasMoocColumn) return;
      const moocsToDelete = await this.prisma.vehicleRecordMooc.findMany({
        where: {
          vehicleRecordId: currentRecordId,
          soMooc: { notIn: [...currentRecordMoocNames] },
        },
      });
      if (moocsToDelete.length === 0) return;
      await this.prisma.vehicleRecordMooc.deleteMany({
        where: { id: { in: moocsToDelete.map((m) => m.id) } },
      });
      recordChanges(
        currentRecordId,
        currentRecordRowNum,
        currentRecordIdentifier,
        moocsToDelete.map((m) => ({
          field: `mooc[${m.soMooc}]`,
          oldValue: "present",
          newValue: null,
        })),
      );
    };

    for (const row of rows) {
      try {
        if (row.type === "record") {
          await flushMoocSync();
          currentRecordMoocNames = new Set();
          currentRecordHasMoocColumn = !!row.hasMoocColumn;
          currentRecordRowNum = row.rowNum;

          const vehicleData = {
            tenTaiXe: row.tenTaiXe ?? null,
            sdt: row.sdt ?? null,
            loaiXe: row.loaiXe ?? null,
            bienSo: row.bienSo ?? null,
            hanDangKiem: row.hanDangKiem ?? null,
            hanBaoHiem: row.hanBaoHiem ?? null,
            hanCaVet: row.hanCaVet ?? null,
            ghiChu: row.ghiChu ?? null,
          };

          const existing = row.id
            ? await this.prisma.vehicleRecord.findUnique({ where: { id: row.id } })
            : null;

          if (row.id && !existing) {
            warnings.push(`Hàng ${row.rowNum}: ID "${row.id}" không tồn tại — đã tạo mới`);
          }

          if (existing) {
            // UPDATE existing record by ID
            const record = await this.prisma.vehicleRecord.update({
              where: { id: row.id },
              data: vehicleData,
            });
            currentRecordId = record.id;
            currentRecordIsUpdate = true;
            const identifier = row.bienSo ?? row.tenTaiXe ?? row.id!;
            currentRecordIdentifier = identifier;

            const scalarChanges = diffFields(existing, vehicleData);
            recordChanges(currentRecordId, row.rowNum, identifier, scalarChanges);

            if (row.soMooc) {
              currentRecordMoocNames.add(row.soMooc);
              const moocChanges = await this.upsertMooc(currentRecordId, row.soMooc, {
                hanDangKiem: row.moocHanDangKiem ?? null,
                hanBaoHiem: row.moocHanBaoHiem ?? null,
                hanCaVet: row.moocHanCaVet ?? null,
              });
              recordChanges(currentRecordId, row.rowNum, identifier, moocChanges);
            }
            updated++;
          } else {
            // CREATE new record (no `id` cell, or `id` cell didn't match any existing record)
            const record = await this.prisma.vehicleRecord.create({
              data: {
                ...vehicleData,
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
            currentRecordIsUpdate = false;
            imported++;
            createdRecords.push({
              rowNum: row.rowNum,
              identifier: row.bienSo ?? row.tenTaiXe ?? record.id,
              entityId: record.id,
            });
          }
        } else if (row.type === "mooc_continuation") {
          if (!currentRecordId) {
            errors.push(`Hàng ${row.rowNum}: mooc continuation nhưng chưa có xe nào, bỏ qua`);
            continue;
          }
          if (row.soMooc) currentRecordMoocNames.add(row.soMooc);
          const moocChanges = await this.upsertMooc(currentRecordId, row.soMooc ?? "", {
            hanDangKiem: row.moocHanDangKiem ?? null,
            hanBaoHiem: row.moocHanBaoHiem ?? null,
            hanCaVet: row.moocHanCaVet ?? null,
          });
          if (currentRecordIsUpdate) {
            recordChanges(currentRecordId, row.rowNum, currentRecordIdentifier, moocChanges);
          }
        }
      } catch (err) {
        errors.push(`Hàng ${row.rowNum}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    try {
      await flushMoocSync();
    } catch (err) {
      errors.push(`Lỗi đồng bộ mooc cho xe cuối file: ${err instanceof Error ? err.message : String(err)}`);
    }

    const changedRecords: ImportChangedRecord[] = [];
    for (const [vehicleRecordId, group] of changeGroups) {
      try {
        await this.auditService.log({
          action: "UPDATE",
          entityType: "VehicleRecord",
          entityId: vehicleRecordId,
          summary: `Excel import cập nhật xe (${group.identifier}): ${group.changes.map((c) => c.field).join(", ")}`,
          beforeSnapshot: Object.fromEntries(group.changes.map((c) => [c.field, c.oldValue])),
          afterSnapshot: Object.fromEntries(group.changes.map((c) => [c.field, c.newValue])),
        });
      } catch (err) {
        console.error("Audit log failed (non-fatal):", err);
      }
      changedRecords.push({
        rowNum: group.rowNum,
        identifier: group.identifier,
        entityId: vehicleRecordId,
        changes: group.changes,
      });
    }

    try {
      await this.auditService.log({
        action: "CREATE",
        entityType: "VehicleRecord",
        summary: `Excel import: ${imported} tạo mới, ${updated} cập nhật, ${errors.length} lỗi`,
      });
    } catch (err) {
      console.error("Audit log failed (non-fatal):", err);
    }

    return {
      imported,
      updated,
      warnings,
      errors,
      ...(changedRecords.length > 0 && { changedRecords }),
      ...(createdRecords.length > 0 && { createdRecords }),
    };
  }

  async importTripPlans(buffer: Buffer): Promise<ImportResult> {
    const warnings: string[] = [];
    let rows: ReturnType<typeof parseKeHoachXe>;
    try {
      const workbook = new ExcelJS.Workbook();
      const cleanedBuffer = await stripDrawingsFromXlsx(buffer);
      await workbook.xlsx.load(cleanedBuffer as unknown as ArrayBuffer);
      rows = parseKeHoachXe(workbook, warnings);
    } catch (err) {
      console.error("[import/trip-plans] xlsx parse failed:", err);
      throw new BadRequestException("File không hợp lệ hoặc không đúng định dạng .xlsx");
    }
    const errors: string[] = [];
    const changedRecords: ImportChangedRecord[] = [];
    const createdRecords: ImportCreatedRecord[] = [];
    let imported = 0;
    let updated = 0;

    // listSortedAt is no longer the default list sort key (the list now defaults to
    // tripDate desc) but is kept populated for any future "most recently touched" view.
    // Rows are processed sequentially, so a plain `new Date()` per row would assign
    // strictly increasing timestamps; deriving each row's timestamp from a single batch
    // start time minus its index keeps row 0 (top of the file) at the latest timestamp.
    const importBatchStartedAt = Date.now();

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const listSortedAt = new Date(importBatchStartedAt - rowIndex);
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

        const txResult = await this.prisma.$transaction(async (tx) => {
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

          const before = row.id ? await tx.tripPlan.findUnique({ where: { id: row.id } }) : null;
          if (row.id && !before) {
            warnings.push(`Hàng ${row.rowNum}: ID "${row.id}" không tồn tại — đã tạo mới`);
          }

          let tripPlanId: string;
          if (before) {
            // UPDATE existing trip plan
            const updateData = {
              tripDate: row.tripDate!,
              ...(row.tripNumber !== undefined && { tripNumber: row.tripNumber }),
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
              ...(row.documentSentDate !== undefined && {
                documentSentDate: row.documentSentDate,
              }),
              ...(row.phiNangAmount !== undefined && {
                phiNangAmount: row.phiNangAmount,
                phiNangName: "PHÍ NÂNG",
              }),
              ...(row.shdNang !== undefined && { shdNang: row.shdNang }),
              ...(row.phiHaAmount !== undefined && {
                phiHaAmount: row.phiHaAmount,
                phiHaName: "PHÍ HẠ",
              }),
              ...(row.shdHa !== undefined && { shdHa: row.shdHa }),
              ...(row.phiVeSinhAmount !== undefined && {
                phiVeSinhAmount: row.phiVeSinhAmount,
                phiVeSinhName: "PHÍ VỆ SINH",
              }),
              ...(row.shdVeSinh !== undefined && { shdVeSinh: row.shdVeSinh }),
              ...(row.phiCuocAmount !== undefined && {
                phiCuocAmount: row.phiCuocAmount,
                phiCuocName: "PHÍ CƯỢC",
              }),
              ...(row.veCongAmount !== undefined && {
                veCongAmount: row.veCongAmount,
                veCongName: "VÉ CỔNG",
              }),
              ...(row.shdVeCong !== undefined && { shdVeCong: row.shdVeCong }),
              ...(row.chiPhiKhacAmount !== undefined && {
                chiPhiKhacAmount: row.chiPhiKhacAmount,
                chiPhiKhacName: "PHÍ ĐỨT TEM",
              }),
              ...(row.chiPhiTraiTuyenAmount !== undefined && {
                chiPhiTraiTuyenAmount: row.chiPhiTraiTuyenAmount,
                chiPhiTraiTuyenName: "CHI PHÍ TRÁI TUYẾN",
              }),
              ...(row.cauDuongAmount !== undefined && {
                cauDuongAmount: row.cauDuongAmount,
                cauDuongName: "CẦU ĐƯỜNG",
              }),
            };

            // listSortedAt is bumped on every import-touch (re-enters the "recent batch"
            // ordering, in file order) but is excluded from the changed-field diff/audit
            // log below — it always differs and isn't a meaningful business-data change.
            await tx.tripPlan.update({
              where: { id: before.id },
              data: { ...updateData, listSortedAt },
            });

            const changes = diffFields(before, updateData);
            if (changes.length > 0) {
              const identifier = `${row.vehiclePlate ?? "?"} - ${row.tripDate!.toISOString().slice(0, 10)}`;
              await this.auditService.log(
                {
                  action: "UPDATE",
                  entityType: "TripPlan",
                  entityId: before.id,
                  summary: `Excel import cập nhật chuyến (${identifier}): ${changes.map((c) => c.field).join(", ")}`,
                  beforeSnapshot: Object.fromEntries(changes.map((c) => [c.field, c.oldValue])),
                  afterSnapshot: Object.fromEntries(changes.map((c) => [c.field, c.newValue])),
                },
                tx,
              );
              changedRecords.push({
                rowNum: row.rowNum,
                identifier,
                entityId: before.id,
                changes,
              });
            }

            // Replace costs with what's in the file
            await tx.tripPlanCost.deleteMany({ where: { tripPlanId: before.id } });
            tripPlanId = before.id;
          } else {
            // CREATE new trip plan — tripNumber is written verbatim from the STT cell
            // (no auto-increment); listSortedAt is kept populated but no longer drives default sort
            const tripPlan = await tx.tripPlan.create({
              data: {
                tripDate: row.tripDate!,
                tripNumber: row.tripNumber ?? null,
                listSortedAt,
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
                documentSentDate: row.documentSentDate ?? null,
                phiNangAmount: row.phiNangAmount ?? null,
                phiNangName: row.phiNangAmount !== undefined ? "PHÍ NÂNG" : null,
                shdNang: row.shdNang ?? null,
                phiHaAmount: row.phiHaAmount ?? null,
                phiHaName: row.phiHaAmount !== undefined ? "PHÍ HẠ" : null,
                shdHa: row.shdHa ?? null,
                phiVeSinhAmount: row.phiVeSinhAmount ?? null,
                phiVeSinhName: row.phiVeSinhAmount !== undefined ? "PHÍ VỆ SINH" : null,
                shdVeSinh: row.shdVeSinh ?? null,
                phiCuocAmount: row.phiCuocAmount ?? null,
                phiCuocName: row.phiCuocAmount !== undefined ? "PHÍ CƯỢC" : null,
                veCongAmount: row.veCongAmount ?? null,
                veCongName: row.veCongAmount !== undefined ? "VÉ CỔNG" : null,
                shdVeCong: row.shdVeCong ?? null,
                chiPhiKhacAmount: row.chiPhiKhacAmount ?? null,
                chiPhiKhacName: row.chiPhiKhacAmount !== undefined ? "PHÍ ĐỨT TEM" : null,
                chiPhiTraiTuyenAmount: row.chiPhiTraiTuyenAmount ?? null,
                chiPhiTraiTuyenName:
                  row.chiPhiTraiTuyenAmount !== undefined ? "CHI PHÍ TRÁI TUYẾN" : null,
                cauDuongAmount: row.cauDuongAmount ?? null,
                cauDuongName: row.cauDuongAmount !== undefined ? "CẦU ĐƯỜNG" : null,
              },
            });
            tripPlanId = tripPlan.id;
          }

          for (const costItem of row.costs ?? []) {
            await tx.tripPlanCost.create({
              data: {
                tripPlanId,
                costName: costItem.costName,
                amount: costItem.amount,
                invoiceNumber: costItem.invoiceNumber ?? null,
              },
            });
          }

          return { wasUpdate: !!before, tripPlanId };
        });

        if (txResult.wasUpdate) {
          updated++;
        } else {
          imported++;
          const identifier = `${row.vehiclePlate ?? "?"} - ${row.tripDate!.toISOString().slice(0, 10)}`;
          createdRecords.push({ rowNum: row.rowNum, identifier, entityId: txResult.tripPlanId });
        }
      } catch (err) {
        errors.push(`Hàng ${row.rowNum}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    await this.auditService.log({
      action: "CREATE",
      entityType: "TripPlan",
      summary: `Excel import: ${imported} tạo mới, ${updated} cập nhật, ${warnings.length} cảnh báo, ${errors.length} lỗi`,
    });

    return {
      imported,
      updated,
      warnings,
      errors,
      ...(changedRecords.length > 0 && { changedRecords }),
      ...(createdRecords.length > 0 && { createdRecords }),
    };
  }

  async importVehicleMaintenance(buffer: Buffer): Promise<ImportResult> {
    const warnings: string[] = [];
    let rows: ReturnType<typeof parseBaoDuongXe>;
    try {
      const workbook = new ExcelJS.Workbook();
      const cleanedBuffer = await stripDrawingsFromXlsx(buffer);
      await workbook.xlsx.load(cleanedBuffer as unknown as ArrayBuffer);
      rows = parseBaoDuongXe(workbook);
    } catch (err) {
      console.error("[import/vehicle-maintenance] xlsx parse failed:", err);
      throw new BadRequestException("File không hợp lệ hoặc không đúng định dạng .xlsx");
    }

    const errors: string[] = [];
    let imported = 0;
    let updated = 0;
    const changedRecords: ImportChangedRecord[] = [];
    const createdRecords: ImportCreatedRecord[] = [];

    for (const row of rows) {
      try {
        let vehicleRecordId: string;
        let recordChanges: ImportChangedField[] = [];
        let identifier = row.bienSo ?? row.id ?? `row-${row.rowNum}`;

        const existing = row.id
          ? await this.prisma.vehicleRecord.findUnique({ where: { id: row.id } })
          : null;
        if (row.id && !existing) {
          warnings.push(`Hàng ${row.rowNum}: ID "${row.id}" không tồn tại — đã tạo mới`);
        }

        if (existing) {
          // Update existing VehicleRecord by ID
          const updateData = {
            ...(row.bienSo !== undefined && { bienSo: row.bienSo }),
            ...(row.tenTaiXe !== undefined && { tenTaiXe: row.tenTaiXe }),
            ...(row.sdt !== undefined && { sdt: row.sdt }),
            ...(row.loaiXe !== undefined && { loaiXe: row.loaiXe }),
            ...(row.donViSuaChua !== undefined && { donViSuaChua: row.donViSuaChua ?? null }),
            ...(row.ngayLam !== undefined && { ngayLam: row.ngayLam ?? null }),
            ...(row.kmHienTai !== undefined && { kmHienTai: row.kmHienTai ?? null }),
            ...(row.ghiChuBaoDuong !== undefined && { ghiChuBaoDuong: row.ghiChuBaoDuong ?? null }),
          };
          await this.prisma.vehicleRecord.update({
            where: { id: existing.id },
            data: updateData,
          });
          vehicleRecordId = existing.id;
          identifier = existing.bienSo ?? existing.id;
          recordChanges = diffFields(existing, updateData);
          updated++;
        } else {
          // Create new VehicleRecord (no `id` cell, or `id` cell didn't match any existing record)
          const newRecord = await this.prisma.vehicleRecord.create({
            data: {
              bienSo: row.bienSo ?? null,
              tenTaiXe: row.tenTaiXe ?? null,
              sdt: row.sdt ?? null,
              loaiXe: row.loaiXe ?? null,
              donViSuaChua: row.donViSuaChua ?? null,
              ngayLam: row.ngayLam ?? null,
              kmHienTai: row.kmHienTai ?? null,
              ghiChuBaoDuong: row.ghiChuBaoDuong ?? null,
            },
          });
          vehicleRecordId = newRecord.id;
          imported++;
          createdRecords.push({
            rowNum: row.rowNum,
            identifier: row.bienSo ?? newRecord.id,
            entityId: newRecord.id,
          });
        }

        // Upsert km rounds
        for (const kmRound of row.kmRounds) {
          const existingRound = await this.prisma.vehicleMaintenanceKmRound.findUnique({
            where: {
              vehicleRecordId_roundNumber: {
                vehicleRecordId,
                roundNumber: kmRound.roundNumber,
              },
            },
          });
          await this.prisma.vehicleMaintenanceKmRound.upsert({
            where: {
              vehicleRecordId_roundNumber: {
                vehicleRecordId,
                roundNumber: kmRound.roundNumber,
              },
            },
            create: { vehicleRecordId, roundNumber: kmRound.roundNumber, kmCon: kmRound.kmCon },
            update: { kmCon: kmRound.kmCon },
          });
          if (existingRound) {
            const roundChanges = diffFields(existingRound, { kmCon: kmRound.kmCon });
            recordChanges.push(
              ...roundChanges.map((c) => ({
                ...c,
                field: `kmRounds[Lần ${kmRound.roundNumber}].${c.field}`,
              })),
            );
          } else {
            recordChanges.push({
              field: `kmRounds[Lần ${kmRound.roundNumber}].kmCon`,
              oldValue: null,
              newValue: kmRound.kmCon,
            });
          }
        }

        // Delete km rounds for columns this file knows about (has a "LẦN n" header)
        // but whose cell was left blank for this row — a deliberate clear, not "file doesn't track this round"
        if (existing) {
          const presentRoundNumbers = new Set(row.kmRounds.map((r) => r.roundNumber));
          const roundNumbersToClear = row.knownRoundNumbers.filter(
            (rn) => !presentRoundNumbers.has(rn),
          );
          if (roundNumbersToClear.length > 0) {
            const roundsToDelete = await this.prisma.vehicleMaintenanceKmRound.findMany({
              where: { vehicleRecordId, roundNumber: { in: roundNumbersToClear } },
            });
            if (roundsToDelete.length > 0) {
              await this.prisma.vehicleMaintenanceKmRound.deleteMany({
                where: { vehicleRecordId, roundNumber: { in: roundNumbersToClear } },
              });
              for (const r of roundsToDelete) {
                recordChanges.push({
                  field: `kmRounds[Lần ${r.roundNumber}].kmCon`,
                  oldValue: r.kmCon,
                  newValue: null,
                });
              }
            }
          }
        }

        if (existing && recordChanges.length > 0) {
          try {
            await this.auditService.log({
              action: "UPDATE",
              entityType: "VehicleRecord",
              entityId: vehicleRecordId,
              summary: `Excel import cập nhật bảo dưỡng (${identifier}): ${recordChanges.map((c) => c.field).join(", ")}`,
              beforeSnapshot: Object.fromEntries(recordChanges.map((c) => [c.field, c.oldValue])),
              afterSnapshot: Object.fromEntries(recordChanges.map((c) => [c.field, c.newValue])),
            });
          } catch (err) {
            console.error("Audit log failed (non-fatal):", err);
          }
          changedRecords.push({
            rowNum: row.rowNum,
            identifier,
            entityId: vehicleRecordId,
            changes: recordChanges,
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
        summary: `Excel import bảo dưỡng xe: ${imported} tạo mới, ${updated} cập nhật, ${errors.length} lỗi`,
      });
    } catch (err) {
      console.error("Audit log failed (non-fatal):", err);
    }

    return {
      imported,
      updated,
      warnings,
      errors,
      ...(changedRecords.length > 0 && { changedRecords }),
      ...(createdRecords.length > 0 && { createdRecords }),
    };
  }

  async importYardMoves(
    buffer: Buffer,
    confirm: boolean,
  ): Promise<
    ImportResult | { toCreate: number; toUpdate: number; warnings: string[]; errors: string[] }
  > {
    const warnings: string[] = [];
    let rows: ReturnType<typeof parseLenhBai>;
    try {
      const workbook = new ExcelJS.Workbook();
      const cleanedBuffer = await stripDrawingsFromXlsx(buffer);
      await workbook.xlsx.load(cleanedBuffer as unknown as ArrayBuffer);
      rows = parseLenhBai(workbook, warnings);
    } catch (err) {
      console.error("[import/yard-moves] xlsx parse failed:", err);
      throw new BadRequestException("File không hợp lệ hoặc không đúng định dạng .xlsx");
    }

    const errors: string[] = [];
    for (const row of rows) {
      if (row.type === "skip" && row.reason) errors.push(row.reason);
    }

    // ── Phase 1: Preview (no writes) ──────────────────────────────────────────
    if (!confirm) {
      let toCreate = 0;
      let toUpdate = 0;
      for (const row of rows) {
        if (row.type !== "data") continue;
        if (row.id) {
          const existing = await this.prisma.yardMove.findUnique({ where: { id: row.id } });
          if (existing) {
            toUpdate++;
            continue;
          }
        }
        toCreate++;
      }
      return { toCreate, toUpdate, warnings, errors };
    }

    // ── Phase 2: Execute (writes) ─────────────────────────────────────────────
    const changedRecords: ImportChangedRecord[] = [];
    const createdRecords: ImportCreatedRecord[] = [];
    let imported = 0;
    let updated = 0;

    for (const row of rows) {
      if (row.type !== "data") continue;
      try {
        const data = {
          date: row.date!,
          gps: row.gps ?? null,
          fullName: row.fullName ?? null,
          truck: row.truck ?? null,
          mooc: row.mooc ?? null,
          booking: row.booking ?? null,
          containerNumber: row.containerNumber ?? null,
          notes: row.notes ?? null,
          daKeo: row.daKeo ?? null,
        };
        const identifier = `${row.date!.toISOString().slice(0, 10)}${row.fullName ? ` - ${row.fullName}` : ""}`;

        const before = row.id ? await this.prisma.yardMove.findUnique({ where: { id: row.id } }) : null;
        if (row.id && !before) {
          warnings.push(`Hàng ${row.rowNum}: ID "${row.id}" không tồn tại — đã tạo mới`);
        }

        if (before) {
          await this.prisma.yardMove.update({ where: { id: before.id }, data });

          const changes = diffFields(before, data);
          if (changes.length > 0) {
            await this.auditService.log({
              action: "UPDATE",
              entityType: "YardMove",
              entityId: before.id,
              summary: `Excel import cập nhật tiến độ vận tải (${identifier}): ${changes.map((c) => c.field).join(", ")}`,
              beforeSnapshot: Object.fromEntries(changes.map((c) => [c.field, c.oldValue])),
              afterSnapshot: Object.fromEntries(changes.map((c) => [c.field, c.newValue])),
            });
            changedRecords.push({ rowNum: row.rowNum, identifier, entityId: before.id, changes });
          }
          updated++;
        } else {
          const created = await this.prisma.yardMove.create({ data });
          createdRecords.push({ rowNum: row.rowNum, identifier, entityId: created.id });
          imported++;
        }
      } catch (err) {
        errors.push(`Hàng ${row.rowNum}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    await this.auditService.log({
      action: "CREATE",
      entityType: "YardMove",
      summary: `Excel import: ${imported} tạo mới, ${updated} cập nhật, ${warnings.length} cảnh báo, ${errors.length} lỗi`,
    });

    return {
      imported,
      updated,
      warnings,
      errors,
      ...(changedRecords.length > 0 && { changedRecords }),
      ...(createdRecords.length > 0 && { createdRecords }),
    };
  }

  private async upsertMooc(
    vehicleRecordId: string,
    soMooc: string,
    dates: { hanDangKiem: Date | null; hanBaoHiem: Date | null; hanCaVet: Date | null },
  ): Promise<ImportChangedField[]> {
    const existing = await this.prisma.vehicleRecordMooc.findFirst({
      where: { vehicleRecordId, soMooc },
    });
    if (existing) {
      await this.prisma.vehicleRecordMooc.update({
        where: { id: existing.id },
        data: dates,
      });
      return diffFields(existing, dates).map((c) => ({
        ...c,
        field: `mooc[${soMooc}].${c.field}`,
      }));
    } else {
      await this.prisma.vehicleRecordMooc.create({
        data: { vehicleRecordId, soMooc, ...dates },
      });
      return [
        { field: `mooc[${soMooc}]`, oldValue: null, newValue: "present" },
        ...diffFields({}, dates).map((c) => ({
          ...c,
          field: `mooc[${soMooc}].${c.field}`,
        })),
      ];
    }
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
