import * as ExcelJS from "exceljs";
import { parseExcelDate } from "../utils/excel-date";

export interface ParsedCostItem {
  costName: string;
  amount: number;
  invoiceNumber?: string;
}

export interface ParsedTripPlanRow {
  rowNum: number;
  type: "data" | "skip";
  reason?: string;
  tripNumber?: number;
  tripDate?: Date;
  vehiclePlate?: string;
  customerName?: string;
  carrierName?: string;
  serviceTypeCode?: string;
  containerSizeCode?: string;
  outboundContainerNumber?: string;
  inboundContainerNumber?: string;
  pickupLocationName?: string;
  loadUnloadLocationName?: string;
  dropoffLocationName?: string;
  documentSentDate?: Date;
  description?: string;
  notes?: string;
  costs: ParsedCostItem[];
}

function cellText(row: ExcelJS.Row, colIdx: number): string {
  if (colIdx < 1) return "";
  const v = row.getCell(colIdx).value;
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cellNum(row: ExcelJS.Row, colIdx: number): number | undefined {
  if (colIdx < 1) return undefined;
  const v = row.getCell(colIdx).value;
  if (v === null || v === undefined) return undefined;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) || n === 0 ? undefined : n;
}

function findSheetByPartialName(
  workbook: ExcelJS.Workbook,
  partial: string,
): ExcelJS.Worksheet | undefined {
  const lower = partial.toLowerCase();
  return workbook.worksheets.find((ws) => ws.name.toLowerCase().includes(lower));
}

// Normalize "SEA - EX" → "SEA-EX", "NEO - IM" → "NEO-IM", etc.
function normalizeServiceTypeCode(raw: string): string {
  return raw.replace(/\s+/g, " ").toUpperCase().trim().replace(" - ", "-");
}

// Column indices matching the exported "kế hoạch xe" file (1-based, 28 columns)
const COL = {
  STT: 1,
  NGAY: 2,
  SO_XE: 3,
  KHACH_HANG: 4,
  LOAI_HINH: 5,
  DON_VI: 6,
  SIZE_CONT: 7,
  CONT_DI: 8,
  CONT_VE: 9,
  DIEM_LAY: 10,
  DIEM_DONG_RUT: 11,
  DIEM_HA: 12,
  PHI_NANG: 13,
  SHD_NANG: 14,
  PHI_HA: 15,
  SHD_HA: 16,
  PHI_VE_SINH: 17,
  SHD_VE_SINH: 18,
  PHI_CUOC: 19,
  VE_CONG: 20,
  SHD_CONG: 21,
  CHI_PHI_DUT_TEM: 22,
  CHI_PHI_TRAI_TUYEN: 23,
  CAU_DUONG: 24,
  NGAY_GUI_CT: 25,
  CHI_PHI_PHAT_SINH: 26,
  NOI_DUNG: 27,
  GHI_CHU: 28,
} as const;

const COST_COLUMNS: Array<{ nameCol: string; amountCol: number; shdCol?: number }> = [
  { nameCol: "PHÍ NÂNG", amountCol: COL.PHI_NANG, shdCol: COL.SHD_NANG },
  { nameCol: "PHÍ HẠ", amountCol: COL.PHI_HA, shdCol: COL.SHD_HA },
  { nameCol: "PHÍ VỆ SINH", amountCol: COL.PHI_VE_SINH, shdCol: COL.SHD_VE_SINH },
  { nameCol: "PHÍ CƯỢC", amountCol: COL.PHI_CUOC },
  { nameCol: "VÉ CỔNG", amountCol: COL.VE_CONG, shdCol: COL.SHD_CONG },
  { nameCol: "PHÍ ĐỨT TEM", amountCol: COL.CHI_PHI_DUT_TEM },
  { nameCol: "CHI PHÍ TRÁI TUYẾN", amountCol: COL.CHI_PHI_TRAI_TUYEN },
  { nameCol: "CẦU ĐƯỜNG", amountCol: COL.CAU_DUONG },
  { nameCol: "CHI PHÍ PHÁT SINH KHÁC", amountCol: COL.CHI_PHI_PHAT_SINH },
];

export function parseKeHoachXe(
  workbook: ExcelJS.Workbook,
  warnings: string[] = [],
): ParsedTripPlanRow[] {
  const ws =
    findSheetByPartialName(workbook, "kế hoạch xe") ??
    findSheetByPartialName(workbook, "ke hoach xe") ??
    workbook.worksheets[0];
  if (!ws) return [];

  let headerRowNum = 1;
  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum > 15) return;
    for (let c = 1; c <= 5; c++) {
      const val = String(row.getCell(c).value ?? "")
        .toLowerCase()
        .trim();
      if (val === "stt") {
        headerRowNum = rowNum;
        return;
      }
    }
  });

  const results: ParsedTripPlanRow[] = [];

  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum <= headerRowNum) return;

    const sttRaw = cellText(row, COL.STT);
    const tripDate = parseExcelDate(row.getCell(COL.NGAY).value) ?? undefined;
    if (!tripDate) return;

    const vehiclePlate = cellText(row, COL.SO_XE) || undefined;
    if (!vehiclePlate) {
      results.push({ rowNum, type: "skip", reason: `Hàng ${rowNum}: thiếu số xe`, costs: [] });
      return;
    }

    const loaiHinh = cellText(row, COL.LOAI_HINH);
    const serviceTypeCode = loaiHinh ? normalizeServiceTypeCode(loaiHinh) : undefined;

    const sizeCont = cellText(row, COL.SIZE_CONT);
    const containerSizeCode = sizeCont ? sizeCont.toUpperCase().trim() : undefined;

    const costs: ParsedCostItem[] = [];
    for (const cc of COST_COLUMNS) {
      const amount = cellNum(row, cc.amountCol);
      if (amount !== undefined && amount > 0) {
        const invoiceNumber = cc.shdCol ? cellText(row, cc.shdCol) || undefined : undefined;
        costs.push({ costName: cc.nameCol, amount, invoiceNumber });
      }
    }

    const tripNum = sttRaw ? parseInt(sttRaw, 10) : undefined;

    results.push({
      rowNum,
      type: "data",
      tripNumber: tripNum && !isNaN(tripNum) ? tripNum : undefined,
      tripDate,
      vehiclePlate,
      customerName: cellText(row, COL.KHACH_HANG) || undefined,
      carrierName: cellText(row, COL.DON_VI) || undefined,
      serviceTypeCode,
      containerSizeCode,
      outboundContainerNumber: cellText(row, COL.CONT_DI) || undefined,
      inboundContainerNumber: cellText(row, COL.CONT_VE) || undefined,
      pickupLocationName: cellText(row, COL.DIEM_LAY) || undefined,
      loadUnloadLocationName: cellText(row, COL.DIEM_DONG_RUT) || undefined,
      dropoffLocationName: cellText(row, COL.DIEM_HA) || undefined,
      documentSentDate: parseExcelDate(row.getCell(COL.NGAY_GUI_CT).value) ?? undefined,
      description: cellText(row, COL.NOI_DUNG) || undefined,
      notes: cellText(row, COL.GHI_CHU) || undefined,
      costs,
    });
  });

  return results;
}
