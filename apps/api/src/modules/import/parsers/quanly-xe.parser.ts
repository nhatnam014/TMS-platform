import * as ExcelJS from "exceljs";
import { parseExcelDate } from "../utils/excel-date";
import { parseNoteLines } from "../utils/note-lines";

export interface ParsedVehicleRecordRow {
  rowNum: number;
  type: "record" | "mooc_continuation";
  reason?: string;
  id?: string;
  /** Whether this file has a "SỐ MOOC" column at all — used to tell "file doesn't track moocs" apart from "file lists zero moocs for this vehicle" (only set on "record" rows). */
  hasMoocColumn?: boolean;
  // VehicleRecord fields
  tenTaiXe?: string;
  sdt?: string;
  loaiXe?: string;
  bienSo?: string;
  hanDangKiem?: Date | null;
  hanBaoHiem?: Date | null;
  hanCaVet?: Date | null;
  ghiChuLines?: string[];
  // VehicleRecordMooc fields (first mooc on same row, or continuation)
  soMooc?: string;
  moocHanDangKiem?: Date | null;
  moocHanBaoHiem?: Date | null;
  moocHanCaVet?: Date | null;
}

function cellText(row: ExcelJS.Row, colIdx: number): string {
  const v = row.getCell(colIdx).value;
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function findSheetByPartialName(
  workbook: ExcelJS.Workbook,
  partial: string,
): ExcelJS.Worksheet | undefined {
  const lower = partial.normalize("NFC").toLowerCase();
  return workbook.worksheets.find((ws) => ws.name.normalize("NFC").toLowerCase().includes(lower));
}

// First-occurrence wins: prevents mooc columns (duplicate names) from overwriting vehicle columns.
function buildHeaderMap(headerRow: ExcelJS.Row): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colIdx) => {
    const key = String(cell.value ?? "")
      .trim()
      .toLowerCase();
    if (key && !(key in map)) map[key] = colIdx;
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

export function parseQuanLyXe(workbook: ExcelJS.Workbook): ParsedVehicleRecordRow[] {
  const ws =
    findSheetByPartialName(workbook, "quản lý xe") ??
    findSheetByPartialName(workbook, "quan ly xe") ??
    workbook.worksheets[0];
  if (!ws) return [];

  // Find header row (first row with STT in col 1, within first 25 rows —
  // wide enough to cover both legacy files (row 1) and branded-header exports (row 9)
  let headerRowNum = 1;
  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (headerRowNum === 1 && rowNum <= 25) {
      const text = String(row.getCell(1).value ?? "").toLowerCase();
      if (text === "stt" || text.includes("stt")) headerRowNum = rowNum;
    }
  });

  const headerRow = ws.getRow(headerRowNum);
  const hmap = buildHeaderMap(headerRow);

  const ID_COL = col(hmap, "id");
  const STT = col(hmap, "stt");
  const HO_TEN = col(hmap, "tên tx", "ten tx", "họ và tên", "ho va ten", "tên tài xế", "họ tên");
  const DIEN_THOAI = col(hmap, "điện thoại", "dien thoai", "sdt", "sĐt", "số điện thoại");
  const SO_XE = col(hmap, "theo xe", "số xe", "so xe", "biển số", "bien so");
  const LOAI_XE = col(hmap, "loại xe", "loai xe");
  const HAN_DK = col(hmap, "hạn đăng kiểm", "han dang kiem", "đăng kiểm xe");
  const HAN_BH = col(
    hmap,
    "hạn bảo hiểm",
    "han bao hiem",
    "hạn bảo hiểm xe",
    "han bao hiem xe",
    "bảo hiểm xe",
  );
  const HAN_CV = col(hmap, "hạn cà vẹt", "han ca vet", "cà vẹt xe", "ca vet xe");
  const SO_MOOC = col(hmap, "số mooc", "số moóc", "so mooc", "rơ moóc", "ro mooc");

  // Mooc date and note columns resolved by position relative to SỐ MOOC to avoid
  // collision with identically-named vehicle columns (e.g. "HẠN ĐĂNG KIỂM" appears twice).
  const HAN_DK_MOOC = SO_MOOC > 0 ? SO_MOOC + 1 : -1;
  const HAN_BH_MOOC = SO_MOOC > 0 ? SO_MOOC + 2 : -1;
  const HAN_CV_MOOC = SO_MOOC > 0 ? SO_MOOC + 3 : -1;
  const GHI_CHU = SO_MOOC > 0 ? SO_MOOC + 4 : -1;

  const results: ParsedVehicleRecordRow[] = [];
  // Track previous STT number to detect merged-cell continuation rows.
  // When Excel template uses merged cells, ExcelJS reads the same STT value
  // for all rows in the merge — causing mooc rows to look like new vehicle rows.
  let prevSttNum: number | null = null;

  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum <= headerRowNum) return;

    // Skip entirely empty rows
    const rowValues = row.values as (ExcelJS.CellValue | undefined)[];
    if (rowValues.every((v) => v === null || v === undefined || v === "")) return;

    const sttRaw = STT > 0 ? cellText(row, STT) : "";
    const soMoocRaw = SO_MOOC > 0 ? cellText(row, SO_MOOC) : "";
    // Real mooc plates always contain a digit (e.g. "50RM03596"). Placeholder/status
    // text some templates put in this column instead (e.g. "DỌN BÃI") never does —
    // treat those as "no mooc on this row" rather than importing the text as a plate.
    const soMooc = soMoocRaw && /\d/.test(soMoocRaw) ? soMoocRaw : "";

    const hanDangKiem = HAN_DK > 0 ? parseExcelDate(row.getCell(HAN_DK).value) : null;
    const hanBaoHiem = HAN_BH > 0 ? parseExcelDate(row.getCell(HAN_BH).value) : null;
    const hanCaVet = HAN_CV > 0 ? parseExcelDate(row.getCell(HAN_CV).value) : null;
    const moocHanDangKiem = soMooc && HAN_DK_MOOC > 0 ? parseExcelDate(row.getCell(HAN_DK_MOOC).value) : null;
    const moocHanBaoHiem = soMooc && HAN_BH_MOOC > 0 ? parseExcelDate(row.getCell(HAN_BH_MOOC).value) : null;
    const moocHanCaVet = soMooc && HAN_CV_MOOC > 0 ? parseExcelDate(row.getCell(HAN_CV_MOOC).value) : null;

    const tenTaiXe = HO_TEN > 0 ? cellText(row, HO_TEN) : "";
    const sdt = DIEN_THOAI > 0 ? cellText(row, DIEN_THOAI) : "";
    const loaiXe = LOAI_XE > 0 ? cellText(row, LOAI_XE) : "";
    const bienSo = SO_XE > 0 ? cellText(row, SO_XE) : "";
    const hasVehicleIdentity = !!(tenTaiXe || sdt || loaiXe || bienSo);

    const sttNum = sttRaw ? parseInt(sttRaw, 10) : NaN;
    // A mooc continuation row is either:
    //   (a) empty STT with a mooc number,
    //   (b) same STT as previous vehicle (merged cell in user's template), or
    //   (c) STT present (even incremented) but no vehicle-identifying fields at all —
    //       some templates number these "orphan" mooc-only rows sequentially too.
    const isSameStt = !isNaN(sttNum) && sttNum === prevSttNum;
    const isContinuation = (!sttRaw || isSameStt || !hasVehicleIdentity) && !!soMooc;

    if (isContinuation) {
      results.push({
        rowNum,
        type: "mooc_continuation",
        soMooc,
        moocHanDangKiem,
        moocHanBaoHiem,
        moocHanCaVet,
      });
      return;
    }

    if (!sttRaw) return; // empty structural row with no mooc, skip silently

    // New STT → VehicleRecord
    prevSttNum = isNaN(sttNum) ? null : sttNum;
    const idVal = ID_COL > 0 ? cellText(row, ID_COL) || undefined : undefined;
    results.push({
      rowNum,
      type: "record",
      id: idVal,
      hasMoocColumn: SO_MOOC > 0,
      tenTaiXe: tenTaiXe || undefined,
      sdt: sdt || undefined,
      loaiXe: loaiXe || undefined,
      bienSo: bienSo || undefined,
      hanDangKiem,
      hanBaoHiem,
      hanCaVet,
      ghiChuLines: GHI_CHU > 0 ? parseNoteLines(cellText(row, GHI_CHU)) : undefined,
      soMooc: soMooc || undefined,
      moocHanDangKiem,
      moocHanBaoHiem,
      moocHanCaVet,
    });
  });

  return results;
}
