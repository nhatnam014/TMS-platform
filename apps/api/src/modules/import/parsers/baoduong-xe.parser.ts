import * as ExcelJS from "exceljs";
import { parseExcelDate } from "../utils/excel-date";

export interface ParsedKmRound {
  roundNumber: number;
  kmCon: string;
}

export interface ParsedMaintenanceRow {
  rowNum: number;
  sheetName: string;
  id?: string;
  bienSo?: string;
  tenTaiXe?: string;
  sdt?: string;
  loaiXe?: string;
  donViSuaChua?: string;
  ngayLam?: Date;
  kmHienTai?: string;
  ghiChuBaoDuong?: string;
  kmRounds: ParsedKmRound[];
  /** All round numbers this file has a "KM CÒN ... LẦN n" column for (not just the ones with a value on this row) — used to tell "column not in this file" apart from "column present but cleared for this row". */
  knownRoundNumbers: number[];
}

function cellText(row: ExcelJS.Row, colIdx: number): string {
  if (colIdx <= 0) return "";
  const v = row.getCell(colIdx).value;
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cellKmCon(row: ExcelJS.Row, colIdx: number): string | undefined {
  if (colIdx <= 0) return undefined;
  const v = row.getCell(colIdx).value;
  if (v === null || v === undefined || v === "") return undefined;
  const raw = typeof v === "object" && "result" in v ? (v as ExcelJS.CellFormulaValue).result : v;
  const s = String(raw).trim();
  return s === "" ? undefined : s;
}

function buildHeaderMap(headerRow: ExcelJS.Row): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colIdx) => {
    const key = String(cell.value ?? "").trim().toLowerCase();
    if (key && !(key in map)) map[key] = colIdx;
  });
  return map;
}

function colIdx(hmap: Record<string, number>, ...candidates: string[]): number {
  for (const c of candidates) {
    const idx = hmap[c.toLowerCase()];
    if (idx !== undefined) return idx;
  }
  return -1;
}

// Strips Vietnamese diacritics (e.g. "Ầ" U+1EA6 → "A") so header matching tolerates
// any accented variant, instead of hand-listing every precomposed character.
function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Detect km round columns: match "KM CÒN ... LẦN {n}" (diacritics-tolerant)
function detectKmRoundCols(headerRow: ExcelJS.Row): Map<number, number> {
  // Returns Map<roundNumber, colIndex>
  const result = new Map<number, number>();
  const kmRoundPattern = /KM\s*CON.{0,20}LAN\s*(\d+)/i;
  headerRow.eachCell({ includeEmpty: false }, (cell, colIndex) => {
    const text = stripDiacritics(String(cell.value ?? "").trim());
    const match = text.match(kmRoundPattern);
    if (match) {
      const roundNum = parseInt(match[1], 10);
      if (roundNum > 0) result.set(roundNum, colIndex);
    }
  });
  return result;
}

export function parseBaoDuongXe(workbook: ExcelJS.Workbook): ParsedMaintenanceRow[] {
  const results: ParsedMaintenanceRow[] = [];

  for (const ws of workbook.worksheets) {
    // Find header row: first row with identifiable header keywords, within first 25 rows —
    // wide enough to cover both legacy files (row 1) and branded-header exports (row 9)
    let headerRowNum = 1;
    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (headerRowNum === 1 && rowNum <= 25) {
        let found = false;
        row.eachCell({ includeEmpty: false }, (cell) => {
          const txt = String(cell.value ?? "").toUpperCase().trim();
          if (
            txt.includes("NGÀY LÀM") || txt.includes("NGAY LAM") ||
            txt.includes("SỐ XE") || txt.includes("SO XE") ||
            txt.includes("BIỂN SỐ") || txt.includes("BIEN SO")
          ) {
            found = true;
          }
        });
        if (found) headerRowNum = rowNum;
      }
    });

    const headerRow = ws.getRow(headerRowNum);
    const hmap = buildHeaderMap(headerRow);

    // Column detection by header name
    const COL_BIEN_SO = colIdx(hmap, "số xe", "so xe", "biển số", "bien so", "theo xe");
    const COL_TAI_XE = colIdx(hmap, "tài xế", "tai xe", "họ tên", "ho ten", "tên tx", "ten tx", "họ và tên");
    const COL_SDT = colIdx(hmap, "phone", "sđt", "sdt", "điện thoại", "dien thoai", "số điện thoại");
    const COL_LOAI_XE = colIdx(hmap, "loại xe", "loai xe");
    const COL_DON_VI = colIdx(hmap, "đơn vị sửa chữa", "don vi sua chua", "đơn vị bảo dưỡng", "don vi bao duong");
    const COL_NGAY_LAM = colIdx(hmap, "ngày làm", "ngay lam");
    const COL_KM_HIEN_TAI = colIdx(hmap, "km hiện tại", "km hien tai");
    const COL_GHI_CHU = colIdx(hmap, "ghi chú", "ghi chu");

    // Detect km round columns
    const kmColMap = detectKmRoundCols(headerRow);
    const knownRoundNumbers = [...kmColMap.keys()];

    // ID column: last non-empty header column beyond km columns
    let lastCol = 0;
    headerRow.eachCell({ includeEmpty: false }, (_, c) => { if (c > lastCol) lastCol = c; });
    const maxKmCol = kmColMap.size > 0 ? Math.max(...kmColMap.values()) : 0;
    const COL_ID = lastCol > maxKmCol ? lastCol : 0;

    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (rowNum <= headerRowNum) return;

      // Require ngayLam or bienSo to be non-empty to skip header-like rows
      const ngayLam = COL_NGAY_LAM > 0
        ? parseExcelDate(row.getCell(COL_NGAY_LAM).value)
        : undefined;
      const bienSoRaw = COL_BIEN_SO > 0 ? cellText(row, COL_BIEN_SO) : "";

      if (!ngayLam && !bienSoRaw) return;

      const kmRounds: ParsedKmRound[] = [];
      for (const [roundNumber, colIndex] of kmColMap) {
        const val = cellKmCon(row, colIndex);
        if (val !== undefined) {
          kmRounds.push({ roundNumber, kmCon: val });
        }
      }

      const idVal = COL_ID > 0 ? cellText(row, COL_ID) || undefined : undefined;

      results.push({
        rowNum,
        sheetName: ws.name,
        id: idVal,
        bienSo: bienSoRaw || undefined,
        tenTaiXe: COL_TAI_XE > 0 ? cellText(row, COL_TAI_XE) || undefined : undefined,
        sdt: COL_SDT > 0 ? cellText(row, COL_SDT) || undefined : undefined,
        loaiXe: COL_LOAI_XE > 0 ? cellText(row, COL_LOAI_XE) || undefined : undefined,
        donViSuaChua: COL_DON_VI > 0 ? cellText(row, COL_DON_VI) || undefined : undefined,
        ngayLam: ngayLam ?? undefined,
        kmHienTai: COL_KM_HIEN_TAI > 0 ? cellText(row, COL_KM_HIEN_TAI) || undefined : undefined,
        ghiChuBaoDuong: COL_GHI_CHU > 0 ? cellText(row, COL_GHI_CHU) || undefined : undefined,
        kmRounds,
        knownRoundNumbers,
      });
    });
  }

  return results;
}
