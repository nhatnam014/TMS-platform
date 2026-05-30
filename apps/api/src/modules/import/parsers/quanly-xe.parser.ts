import * as ExcelJS from "exceljs";
import type { VehicleType } from "@tms/shared";
import { parseExcelDate } from "../utils/excel-date";

export interface ParsedVehicleRow {
  rowNum: number;
  type: "vehicle" | "vehicle_driver" | "trailer_orphan" | "trailer_continuation" | "skip";
  reason?: string;
  licensePlate?: string;
  vehicleType?: VehicleType;
  inspectionExpiry?: Date | null;
  insuranceExpiry?: Date | null;
  registrationExpiry?: Date | null;
  driverName?: string;
  driverPhone?: string;
  trailerNumber?: string;
  trailerInspectionExpiry?: Date | null;
  trailerInsuranceExpiry?: Date | null;
}

function cellText(row: ExcelJS.Row, colIdx: number): string {
  const v = row.getCell(colIdx).value;
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function findSheetByPartialName(workbook: ExcelJS.Workbook, partial: string): ExcelJS.Worksheet | undefined {
  const lower = partial.toLowerCase();
  return workbook.worksheets.find((ws) => ws.name.toLowerCase().includes(lower));
}

function buildHeaderMap(headerRow: ExcelJS.Row): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colIdx) => {
    const key = String(cell.value ?? "").trim().toLowerCase();
    if (key) map[key] = colIdx;
  });
  return map;
}

function col(hmap: Record<string, number>, ...candidates: string[]): number {
  for (const c of candidates) {
    const idx = hmap[c.toLowerCase()];
    if (idx !== undefined) return idx;
  }
  return -1;
}

export function parseQuanLyXe(workbook: ExcelJS.Workbook): ParsedVehicleRow[] {
  const ws = findSheetByPartialName(workbook, "quản lý xe") ?? findSheetByPartialName(workbook, "quan ly xe") ?? workbook.worksheets[0];
  if (!ws) return [];

  // Find first non-empty row to use as header
  let headerRowNum = 1;
  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (headerRowNum === 1 && rowNum <= 3) {
      const text = String(row.getCell(1).value ?? "").toLowerCase();
      if (text === "stt" || text.includes("stt")) headerRowNum = rowNum;
    }
  });

  const headerRow = ws.getRow(headerRowNum);
  const hmap = buildHeaderMap(headerRow);

  const STT = col(hmap, "stt");
  const HO_TEN = col(hmap, "họ và tên", "họ và tên", "ho va ten", "tên tài xế");
  const DIEN_THOAI = col(hmap, "điện thoại", "dien thoai", "sdt", "sĐt");
  const SO_XE = col(hmap, "số xe", "so xe", "biển số");
  const LOAI_XE = col(hmap, "loại xe", "loai xe");
  const HAN_DK = col(hmap, "hạn đăng kiểm", "han dang kiem", "đăng kiểm xe");
  const HAN_BH = col(hmap, "hạn bảo hiểm xe", "han bao hiem xe", "bảo hiểm xe");
  const SO_MOOC = col(hmap, "số mooc", "số moóc", "so mooc", "rơ moóc", "ro mooc");
  const HAN_DK_MOOC = col(hmap, "hạn đăng kiểm mooc", "hạn đk mooc", "đăng kiểm mooc");
  const HAN_BH_MOOC = col(hmap, "hạn bảo hiểm mooc", "bảo hiểm mooc");

  const VEHICLE_TYPE_MAP: Record<string, VehicleType> = {
    shacman: "SHACMAN", chenglong: "CHENGLONG", howo: "HOWO",
    freightliner: "FREIGHTLINER", faw: "FAW",
  };

  const results: ParsedVehicleRow[] = [];
  const dataStartRow = headerRowNum + 1;

  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum <= headerRowNum) return;
    // skip rows that are entirely empty
    const rowValues = row.values as (ExcelJS.CellValue | undefined)[];
    if (rowValues.every((v) => v === null || v === undefined || v === "")) return;

    const sttRaw = STT > 0 ? cellText(row, STT) : "";
    const driverName = HO_TEN > 0 ? cellText(row, HO_TEN) : "";
    const licensePlate = SO_XE > 0 ? cellText(row, SO_XE) : "";
    const trailerNumber = SO_MOOC > 0 ? cellText(row, SO_MOOC) : "";
    const vehicleTypeRaw = LOAI_XE > 0 ? cellText(row, LOAI_XE).toLowerCase() : "";

    const inspectionExpiry = HAN_DK > 0 ? parseExcelDate(row.getCell(HAN_DK).value) : null;
    const insuranceExpiry = HAN_BH > 0 ? parseExcelDate(row.getCell(HAN_BH).value) : null;
    const trailerInspectionExpiry = HAN_DK_MOOC > 0 ? parseExcelDate(row.getCell(HAN_DK_MOOC).value) : null;
    const trailerInsuranceExpiry = HAN_BH_MOOC > 0 ? parseExcelDate(row.getCell(HAN_BH_MOOC).value) : null;

    const vehicleType: VehicleType = VEHICLE_TYPE_MAP[vehicleTypeRaw] ?? "OTHER";
    const phone = DIEN_THOAI > 0 ? cellText(row, DIEN_THOAI) : "";

    const base = { rowNum, inspectionExpiry, insuranceExpiry, trailerInspectionExpiry, trailerInsuranceExpiry, vehicleType };

    if (!sttRaw && trailerNumber) {
      // Continuation trailer row
      results.push({ ...base, type: "trailer_continuation", trailerNumber });
      return;
    }

    if (!sttRaw) return; // skip non-data rows

    if (!licensePlate && !driverName) {
      if (trailerNumber) {
        results.push({ ...base, type: "trailer_orphan", trailerNumber });
      }
      return;
    }

    if (licensePlate && driverName) {
      results.push({ ...base, type: "vehicle_driver", licensePlate, driverName, driverPhone: phone || undefined, trailerNumber: trailerNumber || undefined });
    } else if (licensePlate) {
      results.push({ ...base, type: "vehicle", licensePlate, trailerNumber: trailerNumber || undefined });
    }
  });

  return results;
}
