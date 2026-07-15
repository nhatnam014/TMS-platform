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
  id?: string;
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
  phiNangAmount?: number;
  shdNang?: string;
  phiHaAmount?: number;
  shdHa?: string;
  phiVeSinhAmount?: number;
  shdVeSinh?: string;
  phiCuocAmount?: number;
  veCongAmount?: number;
  shdVeCong?: string;
  chiPhiKhacAmount?: number;
  chiPhiTraiTuyenAmount?: number;
  cauDuongAmount?: number;
  luongAmount?: number;
  cuocAmount?: number;
  doanhThuAmount?: number;
  phuThuAmount?: number;
  chiPhiAmount?: number;
  tienDauAmount?: number;
  neoXeAmount?: number;
  costs: ParsedCostItem[];
}

function cellText(row: ExcelJS.Row, colIdx: number): string {
  if (colIdx < 1) return "";
  const v = row.getCell(colIdx).value;
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cellDate(row: ExcelJS.Row, colIdx: number): Date | undefined {
  if (colIdx < 1) return undefined;
  return parseExcelDate(row.getCell(colIdx).value) ?? undefined;
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

// Strips Vietnamese diacritics (including "đ"/"Đ", which Unicode NFD doesn't decompose)
// so header-text matching tolerates accented vs. unaccented variants.
function stripDiacritics(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// Maps a stripped header text to every column index it appears at (left to right) —
// an array, not a single index, because this template reuses the bare header "SHĐ"
// for two different columns (SHĐ for PHÍ VỆ SINH's invoice, and SHĐ for VÉ CỔNG's).
function buildHeaderMap(headerRow: ExcelJS.Row): Record<string, number[]> {
  const map: Record<string, number[]> = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colIdx) => {
    const key = stripDiacritics(String(cell.value ?? ""));
    if (!key) return;
    (map[key] ??= []).push(colIdx);
  });
  return map;
}

// `occurrence` picks the nth (0-based) column with this header text, for the
// handful of columns that share a literal header string in this template.
function colIdx(
  hmap: Record<string, number[]>,
  occurrence: number,
  ...candidates: string[]
): number {
  for (const c of candidates) {
    const arr = hmap[stripDiacritics(c)];
    if (arr && arr[occurrence] !== undefined) return arr[occurrence];
  }
  return -1;
}

interface ResolvedColumns {
  col: Record<keyof typeof COLUMN_CANDIDATES, number>;
  missing: string[];
}

// Primary header text for each field, exactly as written in kehoach-xe.builder.ts's
// HEADERS array — stripDiacritics() makes matching tolerant of accent/case differences,
// so one canonical candidate per column is enough.
const COLUMN_CANDIDATES: Record<string, { occurrence: number; texts: string[] }> = {
  STT: { occurrence: 0, texts: ["STT"] },
  NGAY: { occurrence: 0, texts: ["NGÀY"] },
  SO_XE: { occurrence: 0, texts: ["SỐ XE"] },
  KHACH_HANG: { occurrence: 0, texts: ["KHÁCH HÀNG"] },
  LOAI_HINH: { occurrence: 0, texts: ["LOẠI HÌNH"] },
  DON_VI: { occurrence: 0, texts: ["ĐƠN VỊ"] },
  SIZE_CONT: { occurrence: 0, texts: ["SIZE CONT"] },
  CONT_DI: { occurrence: 0, texts: ["CONT ĐI"] },
  CONT_VE: { occurrence: 0, texts: ["CONT VỀ"] },
  DIEM_LAY: { occurrence: 0, texts: ["Điểm Lấy (R/H)"] },
  DIEM_DONG_RUT: { occurrence: 0, texts: ["Điểm (Đóng/Rút)"] },
  DIEM_HA: { occurrence: 0, texts: ["Điểm hạ (R/H)"] },
  PHI_NANG: { occurrence: 0, texts: ["PHÍ NÂNG"] },
  SHD_NANG: { occurrence: 0, texts: ["SHĐ NÂNG"] },
  PHI_HA: { occurrence: 0, texts: ["PHÍ HẠ"] },
  SHD_HA: { occurrence: 0, texts: ["SHĐ HẠ"] },
  PHI_VE_SINH: { occurrence: 0, texts: ["PHÍ VỆ SINH"] },
  SHD_VE_SINH: { occurrence: 0, texts: ["SHĐ"] },
  PHI_CUOC: { occurrence: 0, texts: ["PHÍ CƯỢC"] },
  VE_CONG: { occurrence: 0, texts: ["VÉ CỔNG"] },
  SHD_CONG: { occurrence: 1, texts: ["SHĐ"] },
  CHI_PHI_DUT_TEM: { occurrence: 0, texts: ["CHÍ PHÍ KHÁC/ PHÍ ĐỨT TEM", "CHI PHÍ KHÁC/ PHÍ ĐỨT TEM"] },
  CHI_PHI_TRAI_TUYEN: { occurrence: 0, texts: ["CHI PHÍ TRÁI TUYẾN/ CHỈ ĐỊNH/ BP CAM"] },
  CAU_DUONG: { occurrence: 0, texts: ["CẦU ĐƯỜNG"] },
  LUONG: { occurrence: 0, texts: ["LƯƠNG"] },
  CUOC: { occurrence: 0, texts: ["CƯỚC"] },
  DOANH_THU: { occurrence: 0, texts: ["DOANH THU"] },
  PHU_THU: { occurrence: 0, texts: ["PHỤ THU"] },
  CHI_PHI: { occurrence: 0, texts: ["CHI PHÍ"] },
  TIEN_DAU: { occurrence: 0, texts: ["TIỀN DẦU"] },
  NEO_XE: { occurrence: 0, texts: ["NEO XE"] },
  NGAY_GUI_CT: { occurrence: 0, texts: ["NGÀY GỬI CT"] },
  CHI_PHI_PHAT_SINH: { occurrence: 0, texts: ["CHI PHÍ PHÁT SINH KHÁC"] },
  NOI_DUNG: { occurrence: 0, texts: ["NỘI DUNG"] },
  GHI_CHU: { occurrence: 0, texts: ["GHI CHÚ"] },
  ID: { occurrence: 0, texts: ["ID"] },
};

function resolveColumns(headerRow: ExcelJS.Row): ResolvedColumns {
  const hmap = buildHeaderMap(headerRow);
  const col: Record<string, number> = {};
  const missing: string[] = [];
  for (const [key, { occurrence, texts }] of Object.entries(COLUMN_CANDIDATES)) {
    const idx = colIdx(hmap, occurrence, ...texts);
    col[key] = idx;
    if (idx === -1) missing.push(texts[0]);
  }
  return { col: col as ResolvedColumns["col"], missing };
}

const COST_COLUMNS_KEY = { nameCol: "CHI PHÍ PHÁT SINH KHÁC", colKey: "CHI_PHI_PHAT_SINH" as const };

export function parseKeHoachXe(
  workbook: ExcelJS.Workbook,
  warnings: string[] = [],
): ParsedTripPlanRow[] {
  const ws =
    findSheetByPartialName(workbook, "kế hoạch xe") ??
    findSheetByPartialName(workbook, "ke hoach xe") ??
    workbook.worksheets[0];
  if (!ws) return [];

  // Find header row: first row with "stt" in cols 1–5, within the first 25 rows —
  // wide enough to cover legacy files (row 1), the prior 4-row header design (row 5),
  // and the current 8-row branded header design (row 9).
  let headerRowNum = 1;
  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum > 25) return;
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

  const headerRow = ws.getRow(headerRowNum);
  const { col: COL, missing } = resolveColumns(headerRow);
  for (const label of missing) {
    warnings.push(`Không tìm thấy cột "${label}" trong file`);
  }

  const results: ParsedTripPlanRow[] = [];

  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum <= headerRowNum) return;

    const sttRaw = cellText(row, COL.STT);
    const tripDate = cellDate(row, COL.NGAY);
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
    const otherCostAmount = cellNum(row, COL.CHI_PHI_PHAT_SINH);
    if (otherCostAmount !== undefined && otherCostAmount > 0) {
      costs.push({ costName: COST_COLUMNS_KEY.nameCol, amount: otherCostAmount });
    }

    const tripNum = sttRaw ? parseInt(sttRaw, 10) : undefined;

    const idVal = cellText(row, COL.ID) || undefined;
    results.push({
      rowNum,
      type: "data",
      id: idVal,
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
      documentSentDate: cellDate(row, COL.NGAY_GUI_CT),
      description: cellText(row, COL.NOI_DUNG) || undefined,
      notes: cellText(row, COL.GHI_CHU) || undefined,
      phiNangAmount: cellNum(row, COL.PHI_NANG),
      shdNang: cellText(row, COL.SHD_NANG) || undefined,
      phiHaAmount: cellNum(row, COL.PHI_HA),
      shdHa: cellText(row, COL.SHD_HA) || undefined,
      phiVeSinhAmount: cellNum(row, COL.PHI_VE_SINH),
      shdVeSinh: cellText(row, COL.SHD_VE_SINH) || undefined,
      phiCuocAmount: cellNum(row, COL.PHI_CUOC),
      veCongAmount: cellNum(row, COL.VE_CONG),
      shdVeCong: cellText(row, COL.SHD_CONG) || undefined,
      chiPhiKhacAmount: cellNum(row, COL.CHI_PHI_DUT_TEM),
      chiPhiTraiTuyenAmount: cellNum(row, COL.CHI_PHI_TRAI_TUYEN),
      cauDuongAmount: cellNum(row, COL.CAU_DUONG),
      luongAmount: cellNum(row, COL.LUONG),
      cuocAmount: cellNum(row, COL.CUOC),
      doanhThuAmount: cellNum(row, COL.DOANH_THU),
      phuThuAmount: cellNum(row, COL.PHU_THU),
      chiPhiAmount: cellNum(row, COL.CHI_PHI),
      tienDauAmount: cellNum(row, COL.TIEN_DAU),
      neoXeAmount: cellNum(row, COL.NEO_XE),
      costs,
    });
  });

  return results;
}
