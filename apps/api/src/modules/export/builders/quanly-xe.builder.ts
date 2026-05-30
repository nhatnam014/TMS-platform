import * as ExcelJS from "exceljs";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

export async function buildQuanLyXe(vehicles: any[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("quản lý xe");

  const headers = [
    "STT",
    "HỌ VÀ TÊN",
    "NGÀY SINH",
    "ĐỊA CHỈ",
    "SỐ XE",
    "LOẠI XE",
    "HẠN ĐĂNG KIỂM",
    "HẠN PHÙ HIỆU",
    "HẠN BẢO HIỂM XE",
    "SỐ MOOC",
    "HẠN ĐĂNG KIỂM MOOC",
    "HẠN BẢO HIỂM MOOC",
  ];

  const colWidths = [6, 24, 14, 28, 14, 14, 16, 16, 18, 16, 20, 20];

  ws.addRow(headers);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };

  headers.forEach((_, i) => {
    ws.getColumn(i + 1).width = colWidths[i];
  });

  vehicles.forEach((v, idx) => {
    const driver = v.driver;
    const trailerLink = v.trailers?.[0];
    const trailer = trailerLink?.trailer;

    ws.addRow([
      idx + 1,
      driver?.fullName ?? "",
      "",                             // NGÀY SINH — not in schema
      "",                             // ĐỊA CHỈ — not in schema
      v.licensePlate,
      v.vehicleType,
      formatDate(v.inspectionExpiry),
      "",                             // HẠN PHÙ HIỆU — not in schema
      formatDate(v.insuranceExpiry),
      trailer?.trailerNumber ?? "",
      formatDate(trailer?.inspectionExpiry),
      formatDate(trailer?.insuranceExpiry),
    ]);
  });

  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
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
