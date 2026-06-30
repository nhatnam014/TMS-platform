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

function addBrandedHeader(ws: ExcelJS.Worksheet, wb: ExcelJS.Workbook, title: string) {
  // Header block is a fixed 8 columns wide (H–O), independent of how many data
  // columns the table has — it does not stretch to match the table's width.
  const endCol = 15;

  for (let r = 1; r <= 8; r++) {
    ws.getRow(r).height = 20;
  }

  try {
    const logoPath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "..",
      "img",
      "LogisticCompany.png",
    );
    if (fs.existsSync(logoPath)) {
      const imageId = wb.addImage({ filename: logoPath, extension: "png" });
      ws.addImage(imageId, "A1:E7");
    }
  } catch {
    // Logo is optional branding — skip silently if missing/unreadable
  }

  const today = formatDate(new Date());

  ws.mergeCells(3, 8, 3, endCol);
  const titleCell = ws.getCell(3, 8);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 18, color: { argb: "FF003399" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells(5, 8, 5, endCol);
  const dateCell = ws.getCell(5, 8);
  dateCell.value = `Ngày xuất: ${today}`;
  dateCell.font = { size: 11 };
  dateCell.alignment = { horizontal: "center", vertical: "middle" };
}

const HEADERS = [
  "STT",
  "NGÀY",
  "GPS",
  "FULL NAME",
  "TRUCK",
  "MOOC",
  "BOOKING",
  "CONTAINER",
  "ĐÃ KÉO",
  "GHI CHÚ",
  "ID",
];

const COL_WIDTHS = [6, 12, 10, 24, 14, 14, 18, 16, 30, 14, 30];

export async function buildLenhBai(records: any[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("lệnh bãi");

  HEADERS.forEach((_, i) => {
    ws.getColumn(i + 1).width = COL_WIDTHS[i];
  });

  addBrandedHeader(ws, wb, "LỆNH BÃI");

  // Column header row at row 9 (rows 1–8 are the branded header block)
  const headerRowObj = ws.addRow(HEADERS);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  headerRowObj.alignment = { horizontal: "center", wrapText: true };
  headerRowObj.height = 22;

  // Data rows from row 10
  records.forEach((rec, idx) => {
    const row = ws.addRow([
      idx + 1,
      rec.date ?? "",
      rec.gps ?? "",
      rec.fullName ?? "",
      rec.truck ?? "",
      rec.mooc ?? "",
      rec.booking ?? "",
      rec.containerNumber ?? "",
      rec.notes ?? "",
      rec.daKeo ?? "",
      rec.id,
    ]);
    // Style the ID cell to indicate it's system-managed
    row.getCell(HEADERS.length).font = { color: { argb: "FF9CA3AF" }, size: 9 };
  });

  // Borders on all rows
  ws.eachRow((row) => {
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
