import * as ExcelJS from "exceljs";
import { parseExcelDate } from "../utils/excel-date";

export interface ParsedMaintenanceRow {
  rowNum: number;
  sheetName: string;
  id?: string;
  bienSo?: string;
  tenTaiXe?: string;
  sdt?: string;
  loaiXe?: string;        // col 6 — ĐƠN VỊ SỬA CHỮA / LOẠI XE (defaults to sheet name)
  donViSuaChua?: string;  // col 7 — ĐƠN VỊ SỬA CHỮA
  ngayLam?: Date;
  soKmBaoDuong?: string;
  kiBaoDuongTiepTheo?: string;
  soKmHienTai?: string;
}

function cellText(row: ExcelJS.Row, colIdx: number): string {
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

// Build header-name → column-index map from the header row (first occurrence wins).
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

export function parseBaoDuongXe(workbook: ExcelJS.Workbook): ParsedMaintenanceRow[] {
  const results: ParsedMaintenanceRow[] = [];

  for (const ws of workbook.worksheets) {
    const sheetLoaiXe = ws.name.trim();

    // Find header row: first row with "SỐ XE" or "NGÀY LÀM" in any cell, within first 5 rows
    let headerRowNum = 1;
    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (headerRowNum === 1 && rowNum <= 5) {
        let found = false;
        row.eachCell({ includeEmpty: false }, (cell) => {
          const txt = String(cell.value ?? "").toUpperCase().trim();
          if (txt.includes("NGÀY LÀM") || txt.includes("NGAY LAM") || txt.includes("SỐ XE")) {
            found = true;
          }
        });
        if (found) headerRowNum = rowNum;
      }
    });

    // Build column map from header row for flexible column detection.
    // Fixed columns (1-7) are positional; km columns vary between sheets that have
    // an extra "NỘI DUNG SỬA CHỮA / ĐVT / SL" block before the km columns.
    const headerRow = ws.getRow(headerRowNum);
    const hmap = buildHeaderMap(headerRow);

    const KM_BD = colIdx(hmap, "số km bảo dưỡng", "so km bao duong");
    const KI_BD = colIdx(hmap, "kì bảo dưỡng tiếp theo", "ki bao duong tiep theo", "kỳ bảo dưỡng tiếp theo");
    const KM_HT = colIdx(hmap, "số km hiện tại", "so km hien tai");

    // Fall back to positional cols 8/9/10 if headers not detected
    const KM_BD_COL = KM_BD > 0 ? KM_BD : 8;
    const KI_BD_COL = KI_BD > 0 ? KI_BD : 9;
    const KM_HT_COL = KM_HT > 0 ? KM_HT : 10;

    // Last non-empty column in header → ID column (if beyond the km block)
    let lastCol = 0;
    headerRow.eachCell({ includeEmpty: false }, (_, c) => { if (c > lastCol) lastCol = c; });
    const ID_COL = lastCol > KM_HT_COL ? lastCol : 0;

    // Tracking merged-cell bienSo/tenTaiXe/sdt, and duplicate row deduplication.
    // Each maintenance event can span multiple identical rows in the customer's template
    // (one row per maintenance item). We deduplicate by (bienSo, ngayLam, soKmBaoDuong)
    // so each service visit produces exactly one record.
    let prevBienSo: string | undefined;
    let prevTenTaiXe: string | undefined;
    let prevSdt: string | undefined;
    let prevDedupKey = "";

    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (rowNum <= headerRowNum) return;

      // Check for date in col 5 — skip rows without it
      const ngayLam = parseExcelDate(row.getCell(5).value);
      if (!ngayLam) return;

      // Read bienSo early — needed for dedup key and merged-cell inheritance
      const rawBienSo = cellText(row, 2);
      const bienSoForKey = rawBienSo || prevBienSo || "";

      // Deduplicate consecutive rows that represent the same service event
      const soKmForKey = row.getCell(KM_BD_COL).value;
      const dedupKey = bienSoForKey + "|" + ngayLam.getTime() + "|" + String(soKmForKey ?? "");
      if (dedupKey === prevDedupKey) return;
      prevDedupKey = dedupKey;

      // Read remaining merged-cell fields
      const rawTenTaiXe = cellText(row, 3);
      const rawSdt = cellText(row, 4);

      const bienSo = rawBienSo || prevBienSo;
      const tenTaiXe = rawTenTaiXe || prevTenTaiXe;
      const sdt = rawSdt || prevSdt;

      if (rawBienSo) prevBienSo = rawBienSo;
      if (rawTenTaiXe) prevTenTaiXe = rawTenTaiXe;
      if (rawSdt) prevSdt = rawSdt;

      // col 6 overrides loaiXe if non-empty, otherwise use sheet name
      const col6 = cellText(row, 6);
      const loaiXe = col6 || sheetLoaiXe || undefined;

      const donViSuaChua = cellText(row, 7) || undefined;
      const soKmBaoDuong = cellNum(row, KM_BD_COL);
      const kiBaoDuongTiepTheo = cellNum(row, KI_BD_COL);
      const soKmHienTai = cellNum(row, KM_HT_COL);

      const idVal = ID_COL > 0 ? cellText(row, ID_COL) || undefined : undefined;

      results.push({
        rowNum,
        sheetName: ws.name,
        id: idVal,
        bienSo: bienSo || undefined,
        tenTaiXe: tenTaiXe || undefined,
        sdt: sdt || undefined,
        loaiXe,
        donViSuaChua,
        ngayLam,
        soKmBaoDuong,
        kiBaoDuongTiepTheo,
        soKmHienTai,
      });
    });
  }

  return results;
}
