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
  "NGÀY",
  "SỐ XE",
  "KHÁCH HÀNG",
  "LOẠI HÌNH",
  "ĐƠN VỊ",
  "SIZE CONT",
  "CONT ĐI",
  "CONT VỀ",
  "Điểm Lấy (R/H)",
  "Điểm (Đóng/Rút)",
  "Điểm hạ (R/H)",
  "PHÍ NÂNG",
  "SHĐ NÂNG",
  "PHÍ HẠ",
  "SHĐ HẠ",
  "PHÍ VỆ SINH",
  "SHĐ",
  "PHÍ CƯỢC",
  "VÉ CỔNG",
  "SHĐ",
  "CHÍ PHÍ KHÁC/ PHÍ ĐỨT TEM",
  "CHI PHÍ TRÁI TUYẾN/ CHỈ ĐỊNH/ BP CAM",
  "CẦU ĐƯỜNG",
  "NGÀY GỬI CT",
  "CHI PHÍ PHÁT SINH KHÁC",
  "NỘI DUNG",
  "GHI CHÚ",
  "ID",
] as const;

const COL_WIDTHS = [
  6, 12, 14, 22, 12, 18, 10, 16, 16, 22, 22, 22, 12, 16, 12, 16, 14, 16, 12, 12, 16, 20, 30, 14, 14,
  24, 24, 24, 30,
];

const ID_COL = HEADERS.length; // last column = ID

export async function buildKeHoachXe(
  tripPlans: any[],
  from?: string,
  to?: string,
): Promise<Buffer> {
  void from;
  void to;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("kế hoạch xe");

  HEADERS.forEach((_, i) => {
    ws.getColumn(i + 1).width = COL_WIDTHS[i];
  });

  // Header at row 1 — lock the ID header cell
  const headerRowObj = ws.addRow(HEADERS as unknown as any[]);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  headerRowObj.alignment = { horizontal: "center", wrapText: true };
  headerRowObj.height = 22;
  headerRowObj.eachCell({ includeEmpty: true }, (cell) => {
    cell.protection = { locked: false };
  });
  headerRowObj.getCell(ID_COL).protection = { locked: true };

  // Data rows from row 2
  tripPlans.forEach((tp, idx) => {
    const sizeCode = tp.containerSize?.code ?? null;
    const serviceTypeLabel = tp.serviceType?.code ?? "";
    const otherCostsTotal = (tp.costs ?? []).reduce(
      (sum: number, c: any) => sum + Number(c.amount || 0),
      0,
    );

    const dataRow = ws.addRow([
      idx + 1,
      formatDate(tp.tripDate),
      tp.vehiclePlate ?? "",
      tp.customer?.name ?? "",
      serviceTypeLabel,
      tp.carrier?.name ?? "",
      sizeCode ?? "",
      tp.outboundContainerNumber ?? "",
      tp.inboundContainerNumber ?? "",
      tp.pickupLocationName ?? "",
      tp.loadUnloadLocationName ?? "",
      tp.dropoffLocationName ?? "",
      tp.phiNangAmount != null ? Number(tp.phiNangAmount) : "",
      tp.shdNang ?? "",
      tp.phiHaAmount != null ? Number(tp.phiHaAmount) : "",
      tp.shdHa ?? "",
      tp.phiVeSinhAmount != null ? Number(tp.phiVeSinhAmount) : "",
      tp.shdVeSinh ?? "",
      tp.phiCuocAmount != null ? Number(tp.phiCuocAmount) : "",
      tp.veCongAmount != null ? Number(tp.veCongAmount) : "",
      tp.shdVeCong ?? "",
      tp.chiPhiKhacAmount != null ? Number(tp.chiPhiKhacAmount) : "",
      tp.chiPhiTraiTuyenAmount != null ? Number(tp.chiPhiTraiTuyenAmount) : "",
      tp.cauDuongAmount != null ? Number(tp.cauDuongAmount) : "",
      formatDate(tp.documentSentDate),
      otherCostsTotal > 0 ? otherCostsTotal : "",
      tp.description ?? "",
      tp.notes ?? "",
      tp.id,
    ]);
    // Unlock all cells, then lock only the ID cell
    dataRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.protection = { locked: false };
    });
    const idCell = dataRow.getCell(ID_COL);
    idCell.protection = { locked: true };
    idCell.font = { color: { argb: "FF9CA3AF" }, size: 9 };
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

  // Protect sheet: locked cells (ID col) become read-only; everything else stays editable
  await ws.protect("", {
    selectLockedCells: true,
    selectUnlockedCells: true,
    sort: true,
    autoFilter: true,
    insertRows: true,
    deleteRows: true,
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
