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
  kmRounds: ParsedKmRound[];
}

function cellText(row: ExcelJS.Row, colIdx: number): string {
  if (colIdx <= 0) return "";
  const v = row.getCell(colIdx).value;
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cellNum(row: ExcelJS.Row, colIdx: number): string | undefined {
  if (colIdx <= 0) return undefined;
  const v = row.getCell(colIdx).value;
  if (v === null || v === undefined || v === "") return undefined;
  const raw = typeof v === "object" && "result" in v ? (v as ExcelJS.CellFormulaValue).result : v;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/,/g, ""));
  return isNaN(n) ? undefined : String(n);
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

// Detect km round columns: match "KM CÒN ... LẦN {n}" (diacritics-tolerant)
function detectKmRoundCols(headerRow: ExcelJS.Row): Map<number, number> {
  // Returns Map<roundNumber, colIndex>
  const result = new Map<number, number>();
  const kmRoundPattern = /KM\s*C[OÒ]N.{0,20}L[AÀ]N\s*(\d+)/i;
  headerRow.eachCell({ includeEmpty: false }, (cell, colIndex) => {
    const text = String(cell.value ?? "").trim();
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
    // Find header row: first row with identifiable header keywords, within first 5 rows
    let headerRowNum = 1;
    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (headerRowNum === 1 && rowNum <= 5) {
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

    // Detect km round columns
    const kmColMap = detectKmRoundCols(headerRow);

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
        const val = cellNum(row, colIndex);
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
        kmRounds,
      });
    });
  }

  return results;
}
