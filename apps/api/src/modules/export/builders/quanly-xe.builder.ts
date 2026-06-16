import * as ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

const HEADERS = [
  "STT",
  "HỌ VÀ TÊN",
  "SĐT",
  "SỐ XE",
  "LOẠI XE",
  "HẠN ĐĂNG KIỂM",
  "HẠN BẢO HIỂM",
  "HẠN CÀ VẸT",
  "SỐ MOOC",
  "HẠN ĐĂNG KIỂM MOOC",
  "HẠN BẢO HIỂM MOOC",
  "HẠN CÀ VẸT MOOC",
];

const COL_WIDTHS = [6, 24, 16, 14, 14, 16, 16, 16, 16, 20, 20, 20];

const LOGO_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "img",
  "LogisticCompany.png",
);

const HEADER_ROWS = 4;
const TITLE_START_COL = 7;

export async function buildQuanLyXe(records: any[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("quản lý xe");

  // ── Column widths ──────────────────────────────────────────────────────────
  HEADERS.forEach((_, i) => {
    ws.getColumn(i + 1).width = COL_WIDTHS[i];
  });

  // ── Header rows 1-4 ────────────────────────────────────────────────────────
  for (let r = 1; r <= HEADER_ROWS; r++) {
    ws.getRow(r).height = 30;
  }

  // Logo image
  let logoBuffer: Buffer | null = null;
  try {
    logoBuffer = fs.readFileSync(LOGO_PATH) as unknown as Buffer;
  } catch {
    // Logo file missing — skip image, still render title
  }

  if (logoBuffer) {
    const imageId = wb.addImage({ buffer: logoBuffer as any, extension: "png" });
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      br: { col: 6, row: 4 },
    } as any);
  }

  // Title: merge G1:lastCol x rows 1-2
  ws.mergeCells(1, TITLE_START_COL, 2, HEADERS.length);
  const titleCell = ws.getCell(1, TITLE_START_COL);
  titleCell.value = "QUẢN LÝ XE";
  titleCell.font = { bold: true, size: 18, color: { argb: "FF003399" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // Rows 3-4 are left empty (no date line for quản lý xe)

  // ── Column header row (row 5) ──────────────────────────────────────────────
  const headerRowObj = ws.addRow(HEADERS);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  headerRowObj.alignment = { horizontal: "center", wrapText: true };

  // ── Data rows ──────────────────────────────────────────────────────────────
  records.forEach((rec, idx) => {
    const firstMooc = rec.moocs?.[0] ?? null;

    ws.addRow([
      idx + 1,
      rec.tenTaiXe ?? "",
      rec.sdt ?? "",
      rec.bienSo ?? "",
      rec.loaiXe ?? "",
      formatDate(rec.hanDangKiem),
      formatDate(rec.hanBaoHiem),
      formatDate(rec.hanCaVet),
      firstMooc?.soMooc ?? "",
      formatDate(firstMooc?.hanDangKiem),
      formatDate(firstMooc?.hanBaoHiem),
      formatDate(firstMooc?.hanCaVet),
    ]);
  });

  // ── Borders on data rows ───────────────────────────────────────────────────
  ws.eachRow((row, rowNum) => {
    if (rowNum <= HEADER_ROWS) return;
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
