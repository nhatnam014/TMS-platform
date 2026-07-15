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

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function buildHeaders(colCount: number): string[] {
  const base = [
    "TT",
    "SỐ XE",
    "Tài xế",
    "PHONE",
    "NGÀY LÀM",
    "LOẠI XE",
    "ĐƠN VỊ SỬA CHỮA",
    "KM HIỆN TẠI",
  ];
  for (let i = 1; i <= colCount; i++) {
    base.push(`KM CÒN DƯỠNG LẦN ${i}`);
  }
  base.push("GHI CHÚ");
  base.push("ID");
  return base;
}

function addBrandedHeader(ws: ExcelJS.Worksheet, imageId: number | undefined) {
  // Header block is a fixed 8 columns wide (H–O), independent of how many data
  // columns the table has — it does not stretch to match the table's width.
  const endCol = 15;

  for (let r = 1; r <= 8; r++) {
    ws.getRow(r).height = 20;
  }

  if (imageId !== undefined) {
    ws.addImage(imageId, "A1:E7");
  }

  const today = formatDate(new Date());

  ws.mergeCells(3, 8, 3, endCol);
  const titleCell = ws.getCell(3, 8);
  titleCell.value = "BẢO DƯỠNG XE";
  titleCell.font = { bold: true, size: 18, color: { argb: "FF003399" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells(5, 8, 5, endCol);
  const dateCell = ws.getCell(5, 8);
  dateCell.value = `Ngày: ${today}  From: ${today}  To: ${today}`;
  dateCell.font = { size: 11 };
  dateCell.alignment = { horizontal: "center", vertical: "middle" };
}

function addSheet(wb: ExcelJS.Workbook, sheetName: string, records: any[], imageId: number | undefined) {
  // Compute maxRound for this group
  let maxRound = 0;
  for (const rec of records) {
    for (const r of (rec.kmRounds ?? [])) {
      if (r.roundNumber > maxRound) maxRound = r.roundNumber;
    }
  }
  const colCount = Math.max(4, maxRound);
  const headers = buildHeaders(colCount);

  const ws = wb.addWorksheet(sheetName);

  // Column widths: base 7 cols + KM HIỆN TẠI + km cols + GHI CHÚ + ID
  const baseWidths = [6, 14, 22, 14, 14, 18, 22, 16];
  const kmWidths = Array(colCount).fill(16);
  const colWidths = [...baseWidths, ...kmWidths, 28, 30];
  colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  addBrandedHeader(ws, imageId);

  // Column header row at row 9 (rows 1–8 are the branded header block)
  const headerRow = ws.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  headerRow.alignment = { horizontal: "center", wrapText: true };
  headerRow.height = 22;

  records.forEach((rec, idx) => {
    // Build km cell values from kmRounds array (roundNumber → kmCon)
    const kmMap: Record<number, string> = {};
    if (rec.kmRounds) {
      for (const r of rec.kmRounds) {
        kmMap[r.roundNumber] = toStr(r.kmCon);
      }
    }

    const kmValues: string[] = [];
    for (let i = 1; i <= colCount; i++) {
      kmValues.push(kmMap[i] ?? "");
    }

    const row = ws.addRow([
      idx + 1,
      rec.bienSo ?? "",
      rec.tenTaiXe ?? "",
      rec.sdt ?? "",
      formatDate(rec.ngayLam),
      rec.loaiXe ?? "",
      rec.donViSuaChua ?? "",
      toStr(rec.kmHienTai),
      ...kmValues,
      (rec.maintenanceNotes ?? []).map((n: any) => n.content).join("\n"),
      rec.id,
    ]);

    // ID cell grey
    row.getCell(headers.length).font = { color: { argb: "FF9CA3AF" }, size: 9 };
  });

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
}

export async function buildBaoDuongXe(records: any[], selectedLoaiXe: string[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  let imageId: number | undefined;
  try {
    const logoPath = path.resolve(__dirname, "..", "..", "..", "..", "..", "img", "LogisticCompany.png");
    if (fs.existsSync(logoPath)) {
      imageId = wb.addImage({ filename: logoPath, extension: "png" });
    }
  } catch {
    // Logo is optional branding — skip silently if missing/unreadable
  }

  if (selectedLoaiXe.length === 0) {
    // Group by loaiXe
    const groupMap = new Map<string, any[]>();
    for (const rec of records) {
      const key = rec.loaiXe ?? "(Khác)";
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(rec);
    }
    if (groupMap.size === 0) {
      wb.addWorksheet("bảo dưỡng xe");
    } else {
      for (const [loaiXe, recs] of groupMap) {
        addSheet(wb, loaiXe, recs, imageId);
      }
    }
  } else {
    for (const loaiXe of selectedLoaiXe) {
      const recs = records.filter((r) => r.loaiXe === loaiXe);
      addSheet(wb, loaiXe, recs, imageId);
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
