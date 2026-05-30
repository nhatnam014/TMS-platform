import * as ExcelJS from "exceljs";
import type { ContainerSize, ServiceType } from "@tms/shared";
import { parseExcelDate } from "../utils/excel-date";
import { normalizeContainerSize } from "../utils/container-size";

export interface ParsedTripPlanRow {
  rowNum: number;
  type: "data" | "skip";
  reason?: string;
  tripNumber?: number;
  tripDate?: Date;
  vehiclePlate?: string;
  customerName?: string;
  carrierName?: string;
  serviceType?: ServiceType;
  outboundContainerNumber?: string;
  outboundContainerSize?: ContainerSize;
  inboundContainerNumber?: string;
  inboundContainerSize?: ContainerSize;
  pickupLocation?: string;
  loadUnloadLocation?: string;
  dropoffLocation?: string;
  totalCost?: number;
  notes?: string;
}

function cellText(row: ExcelJS.Row, colIdx: number): string {
  if (colIdx < 0) return "";
  const v = row.getCell(colIdx).value;
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cellNum(row: ExcelJS.Row, colIdx: number): number | undefined {
  if (colIdx < 0) return undefined;
  const v = row.getCell(colIdx).value;
  if (v === null || v === undefined) return undefined;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? undefined : n;
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

export function parseKeHoachXe(workbook: ExcelJS.Workbook): ParsedTripPlanRow[] {
  const ws = findSheetByPartialName(workbook, "kế hoạch xe") ?? findSheetByPartialName(workbook, "ke hoach xe") ?? workbook.worksheets[0];
  if (!ws) return [];

  // Find header row (contains "stt" in first column)
  let headerRowNum = 1;
  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum <= 5) {
      const text = String(row.getCell(1).value ?? "").toLowerCase();
      if (text === "stt" || text.includes("stt")) headerRowNum = rowNum;
    }
  });

  const headerRow = ws.getRow(headerRowNum);
  const hmap = buildHeaderMap(headerRow);

  const STT = col(hmap, "stt");
  const NGAY = col(hmap, "ngày", "ngay", "ngày tháng");
  const SO_XE = col(hmap, "số xe", "so xe", "biển số xe");
  const RO_MOOC = col(hmap, "rơ moóc", "ro mooc", "số moóc");
  const KHACH_HANG = col(hmap, "khách hàng", "khach hang");
  const NHA_VAN_CHUYEN = col(hmap, "nhà vận chuyển", "nha van chuyen", "hãng xe");
  const SO_CONT_1 = col(hmap, "số cont", "số cont 1", "so cont 1", "cont 1");
  const LOAI_CONT_1 = col(hmap, "loại cont", "loại cont 1", "loai cont 1");
  const FLAG_20_1 = col(hmap, "20'", "20ft");
  const FLAG_40_1 = col(hmap, "40'", "40ft");
  const FLAG_45_1 = col(hmap, "45'", "45ft");
  const NOI_LAY_CONT = col(hmap, "nơi lấy cont", "noi lay cont", "lấy rỗng");
  const NOI_DONG_HANG = col(hmap, "nơi đóng hàng", "noi dong hang", "đóng hàng");
  const NOI_HA_CONT = col(hmap, "nơi hạ cont", "noi ha cont", "hạ rỗng");
  const SO_CONT_2 = col(hmap, "số cont 2", "so cont 2");
  const LOAI_CONT_2 = col(hmap, "loại cont 2", "loai cont 2");
  const TONG_CUOC = col(hmap, "tổng cước", "tong cuoc", "tổng tiền", "tổng chi phí");
  const GHI_CHU = col(hmap, "ghi chú", "ghi chu", "notes");

  const results: ParsedTripPlanRow[] = [];

  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum <= headerRowNum) return;

    const sttRaw = STT > 0 ? cellText(row, STT) : "";
    if (!sttRaw) return; // skip continuation/empty rows

    const tripDate = NGAY > 0 ? parseExcelDate(row.getCell(NGAY).value) ?? undefined : undefined;
    const vehiclePlate = cellText(row, SO_XE) || undefined;
    const customerName = cellText(row, KHACH_HANG) || undefined;
    const carrierName = cellText(row, NHA_VAN_CHUYEN) || undefined;

    const contNum1 = cellText(row, SO_CONT_1) || undefined;
    const contSize1Raw = cellText(row, LOAI_CONT_1);
    const flag20_1 = cellText(row, FLAG_20_1);
    const flag40_1 = cellText(row, FLAG_40_1);
    const flag45_1 = cellText(row, FLAG_45_1);
    const contSize1 = contNum1 ? normalizeContainerSize(contSize1Raw, flag20_1, flag40_1, flag45_1) ?? undefined : undefined;

    const contNum2 = SO_CONT_2 > 0 ? (cellText(row, SO_CONT_2) || undefined) : undefined;
    const contSize2Raw = LOAI_CONT_2 > 0 ? cellText(row, LOAI_CONT_2) : "";
    const contSize2 = contNum2 ? normalizeContainerSize(contSize2Raw, "", "", "") ?? undefined : undefined;

    const pickupLocation = cellText(row, NOI_LAY_CONT) || undefined;
    const loadUnloadLocation = cellText(row, NOI_DONG_HANG) || undefined;
    const dropoffLocation = cellText(row, NOI_HA_CONT) || undefined;
    const totalCost = cellNum(row, TONG_CUOC);
    const notes = cellText(row, GHI_CHU) || undefined;

    const tripNum = parseInt(sttRaw, 10);

    results.push({
      rowNum,
      type: "data",
      tripNumber: isNaN(tripNum) ? undefined : tripNum,
      tripDate,
      vehiclePlate,
      customerName,
      carrierName,
      serviceType: "SEA_EXPORT",
      outboundContainerNumber: contNum1,
      outboundContainerSize: contSize1,
      inboundContainerNumber: contNum2,
      inboundContainerSize: contSize2,
      pickupLocation,
      loadUnloadLocation,
      dropoffLocation,
      totalCost,
      notes,
    });
  });

  return results;
}
