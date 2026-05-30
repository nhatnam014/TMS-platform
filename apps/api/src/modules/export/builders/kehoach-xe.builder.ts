import * as ExcelJS from "exceljs";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

export async function buildKeHoachXe(tripPlans: any[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("kế hoạch xe");

  const headers = [
    "STT",
    "NGÀY",
    "SỐ XE",
    "RƠ MOÓC",
    "KHÁCH HÀNG",
    "NHÀ VẬN CHUYỂN",
    // CONT 1
    "SỐ CONT 1",
    "LOẠI CONT 1",
    "ĐÓNG/RÚT",
    "NƠI LẤY CONT",
    "NƠI ĐÓNG HÀNG",
    "NƠI ĐỂ CONT",
    "NƠI HẠ CONT",
    // CONT 2
    "SỐ CONT 2",
    "LOẠI CONT 2",
    "ĐÓNG/RÚT 2",
    "NƠI LẤY CONT 2",
    "NƠI ĐÓNG HÀNG 2",
    "NƠI ĐỂ CONT 2",
    "NƠI HẠ CONT 2",
    // Summary
    "TỔNG CƯỚC",
    "GHI CHÚ",
  ];

  const colWidths = [6, 12, 14, 14, 24, 24, 18, 12, 10, 22, 22, 22, 22, 18, 12, 10, 22, 22, 22, 22, 14, 24];

  ws.addRow(headers);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };

  headers.forEach((_, i) => {
    ws.getColumn(i + 1).width = colWidths[i];
  });

  tripPlans.forEach((tp, idx) => {
    const outbound = tp.outboundContainer;
    const inbound = tp.inboundContainer;
    const totalCost = (tp.costs ?? []).reduce((sum: number, c: any) => sum + Number(c.amount), 0);
    const dongRut = tp.serviceType === "SEA_EXPORT" || tp.serviceType === "NEO_EXPORT" ? "ĐÓNG" : "RÚT";

    ws.addRow([
      idx + 1,
      formatDate(tp.tripDate),
      tp.vehicle?.licensePlate ?? "",
      "",                             // RƠ MOÓC — not in TripPlan schema
      tp.customer?.name ?? "",
      tp.carrier?.name ?? "",
      // CONT 1
      outbound?.containerNumber ?? "",
      outbound?.sizeType ?? "",
      dongRut,
      tp.pickupLocation?.name ?? "",
      tp.loadUnloadLocation?.name ?? "",
      "",                             // NƠI ĐỂ CONT — no dedicated field
      tp.dropoffLocation?.name ?? "",
      // CONT 2
      inbound?.containerNumber ?? "",
      inbound?.sizeType ?? "",
      "",                             // ĐÓNG/RÚT 2 — no dedicated field
      "",                             // NƠI LẤY CONT 2 — no dedicated field
      "",                             // NƠI ĐÓNG HÀNG 2 — no dedicated field
      "",                             // NƠI ĐỂ CONT 2 — no dedicated field
      "",                             // NƠI HẠ CONT 2 — no dedicated field
      totalCost || "",
      tp.notes ?? "",
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
