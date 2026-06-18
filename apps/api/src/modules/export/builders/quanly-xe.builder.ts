import * as ExcelJS from "exceljs";

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
  "GHI CHÚ",
  "ID",
];

const COL_WIDTHS = [6, 24, 16, 14, 14, 16, 16, 16, 16, 20, 20, 20, 30, 30];

export async function buildQuanLyXe(records: any[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("quản lý xe");

  HEADERS.forEach((_, i) => {
    ws.getColumn(i + 1).width = COL_WIDTHS[i];
  });

  // Header at row 1
  const headerRowObj = ws.addRow(HEADERS);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  headerRowObj.alignment = { horizontal: "center", wrapText: true };
  headerRowObj.height = 22;

  // Data rows from row 2
  records.forEach((rec, idx) => {
    const firstMooc = rec.moocs?.[0] ?? null;
    const row = ws.addRow([
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
      rec.ghiChu ?? "",
      rec.id,
    ]);
    // Style the ID cell to indicate it's system-managed
    const idCell = row.getCell(HEADERS.length);
    idCell.font = { color: { argb: "FF9CA3AF" }, size: 9 };

    // Additional moocs as continuation rows
    const extraMoocs = (rec.moocs ?? []).slice(1);
    for (const mooc of extraMoocs) {
      ws.addRow([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        mooc.soMooc ?? "",
        formatDate(mooc.hanDangKiem),
        formatDate(mooc.hanBaoHiem),
        formatDate(mooc.hanCaVet),
        "",
      ]);
    }

    void row;
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
