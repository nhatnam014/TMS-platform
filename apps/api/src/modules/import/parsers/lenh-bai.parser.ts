import * as ExcelJS from "exceljs";

export interface ParsedYardMoveRow {
  rowNum: number;
  type: "data" | "skip";
  reason?: string;
  id?: string;
  date?: string;
  gps?: string;
  fullName?: string;
  truck?: string;
  mooc?: string;
  booking?: string;
  containerNumber?: string;
  notes?: string;
  daKeo?: string;
}

function cellText(row: ExcelJS.Row, colIdx: number): string {
  if (colIdx < 1) return "";
  const v = row.getCell(colIdx).value;
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function rowIsEmpty(row: ExcelJS.Row, cols: number[]): boolean {
  return cols.every((c) => cellText(row, c) === "");
}

// Strips Vietnamese diacritics (including "đ"/"Đ", which Unicode NFD doesn't decompose)
// so header-text matching tolerates accented vs. unaccented variants.
function stripDiacritics(s: string): string {
  return s.toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function buildHeaderMap(headerRow: ExcelJS.Row): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colIdx) => {
    const key = stripDiacritics(String(cell.value ?? ""));
    if (!key) return;
    if (map[key] === undefined) map[key] = colIdx;
  });
  return map;
}

const COLUMN_CANDIDATES: Record<string, string[]> = {
  STT: ["STT"],
  NGAY: ["NGÀY"],
  GPS: ["GPS"],
  FULL_NAME: ["FULL NAME"],
  TRUCK: ["TRUCK"],
  MOOC: ["MOOC"],
  BOOKING: ["BOOKING"],
  CONTAINER: ["CONTAINER"],
  DA_KEO: ["ĐÃ KÉO"],
  GHI_CHU: ["GHI CHÚ"],
  ID: ["ID"],
};

interface ResolvedColumns {
  col: Record<keyof typeof COLUMN_CANDIDATES, number>;
  missing: string[];
}

function resolveColumns(headerRow: ExcelJS.Row): ResolvedColumns {
  const hmap = buildHeaderMap(headerRow);
  const col: Record<string, number> = {};
  const missing: string[] = [];
  for (const [key, texts] of Object.entries(COLUMN_CANDIDATES)) {
    let idx = -1;
    for (const text of texts) {
      const found = hmap[stripDiacritics(text)];
      if (found !== undefined) {
        idx = found;
        break;
      }
    }
    col[key] = idx;
    if (idx === -1) missing.push(texts[0]);
  }
  return { col: col as ResolvedColumns["col"], missing };
}

export function parseLenhBai(
  workbook: ExcelJS.Workbook,
  warnings: string[] = [],
): ParsedYardMoveRow[] {
  const ws = workbook.worksheets[0];
  if (!ws) return [];

  // Find header row: first row with "stt" in cols 1–5, within the first 25 rows —
  // wide enough to cover a plain row-1 header as well as the branded row-9 header.
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

  const results: ParsedYardMoveRow[] = [];
  const dataCols = [
    COL.NGAY,
    COL.GPS,
    COL.FULL_NAME,
    COL.TRUCK,
    COL.MOOC,
    COL.BOOKING,
    COL.CONTAINER,
    COL.GHI_CHU,
    COL.DA_KEO,
  ].filter((c) => c >= 1);

  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum <= headerRowNum) return;
    if (rowIsEmpty(row, dataCols)) return;

    const date = cellText(row, COL.NGAY);
    if (!date) {
      results.push({ rowNum, type: "skip", reason: `Hàng ${rowNum}: thiếu ngày, bỏ qua` });
      return;
    }

    results.push({
      rowNum,
      type: "data",
      id: cellText(row, COL.ID) || undefined,
      date,
      gps: cellText(row, COL.GPS) || undefined,
      fullName: cellText(row, COL.FULL_NAME) || undefined,
      truck: cellText(row, COL.TRUCK) || undefined,
      mooc: cellText(row, COL.MOOC) || undefined,
      booking: cellText(row, COL.BOOKING) || undefined,
      containerNumber: cellText(row, COL.CONTAINER) || undefined,
      notes: cellText(row, COL.GHI_CHU) || undefined,
      daKeo: cellText(row, COL.DA_KEO) || undefined,
    });
  });

  return results;
}
