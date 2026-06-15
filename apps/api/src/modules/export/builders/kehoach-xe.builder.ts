import * as ExcelJS from "exceljs";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

function sizeToTick(containerSizeCode: string | null | undefined, prefix: string): string {
  if (!containerSizeCode) return "";
  return containerSizeCode.startsWith(prefix) ? "X" : "";
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
  "20'",
  "40'",
  "45'",
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
  "CHI PHÍ KHÁC/ PHÍ ĐỨT TEM",
  "CHI PHÍ TRÁI TUYẾN/ CHỈ ĐỊNH/ BP CAM",
  "CẦU ĐƯỜNG",
  "NGÀY GỬI CT",
  "CHI PHÍ PHÁT SINH KHÁC",
  "NỘI DUNG",
  "GHI CHÚ",
] as const;

const COL_WIDTHS = [
  6, 12, 14, 22, 12, 18, 10, 16, 16, 5, 5, 5, 22, 22, 22, 12, 16, 12, 16, 14, 16, 12, 12, 16, 20,
  30, 14, 14, 24, 24, 24,
];

export async function buildKeHoachXe(tripPlans: any[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("kế hoạch xe");

  ws.addRow(HEADERS as unknown as any[]);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  headerRow.alignment = { horizontal: "center", wrapText: true };

  HEADERS.forEach((_, i) => {
    ws.getColumn(i + 1).width = COL_WIDTHS[i];
  });

  tripPlans.forEach((tp, idx) => {
    const sizeCode = tp.containerSize?.code ?? null;
    const serviceTypeLabel = tp.serviceType?.code ?? "";
    const otherCostsTotal = (tp.costs ?? []).reduce(
      (sum: number, c: any) => sum + Number(c.amount || 0),
      0,
    );

    ws.addRow([
      idx + 1, // STT
      formatDate(tp.tripDate), // NGÀY
      tp.vehicle?.licensePlate ?? "", // SỐ XE
      tp.customer?.name ?? "", // KHÁCH HÀNG
      serviceTypeLabel, // LOẠI HÌNH
      tp.carrier?.name ?? "", // ĐƠN VỊ
      sizeCode ?? "", // SIZE CONT
      tp.outboundContainerNumber ?? "", // CONT ĐI
      tp.inboundContainerNumber ?? "", // CONT VỀ
      sizeToTick(sizeCode, "20"), // 20'
      sizeToTick(sizeCode, "40"), // 40'
      sizeToTick(sizeCode, "45"), // 45'
      tp.pickupLocationName ?? "", // Điểm Lấy
      tp.loadUnloadLocationName ?? "", // Điểm Đóng/Rút
      tp.dropoffLocationName ?? "", // Điểm Hạ
      tp.phiNangAmount != null ? Number(tp.phiNangAmount) : "", // PHÍ NÂNG
      tp.shdNang ?? "", // SHĐ NÂNG
      tp.phiHaAmount != null ? Number(tp.phiHaAmount) : "", // PHÍ HẠ
      tp.shdHa ?? "", // SHĐ HẠ
      tp.phiVeSinhAmount != null ? Number(tp.phiVeSinhAmount) : "", // PHÍ VỆ SINH
      tp.shdVeSinh ?? "", // SHĐ
      tp.phiCuocAmount != null ? Number(tp.phiCuocAmount) : "", // PHÍ CƯỢC
      tp.veCongAmount != null ? Number(tp.veCongAmount) : "", // VÉ CỔNG
      tp.shdVeCong ?? "", // SHĐ
      tp.chiPhiKhacAmount != null ? Number(tp.chiPhiKhacAmount) : "", // CHÍ PHÍ ĐỨT TEM
      tp.chiPhiTraiTuyenAmount != null ? Number(tp.chiPhiTraiTuyenAmount) : "", // CHI PHÍ TRÁI TUYẾN
      tp.cauDuongAmount != null ? Number(tp.cauDuongAmount) : "", // CẦU ĐƯỜNG
      formatDate(tp.documentSentDate), // NGÀY GỬI CT
      otherCostsTotal > 0 ? otherCostsTotal : "", // CHI PHÍ PHÁT SINH KHÁC
      tp.description ?? "", // NỘI DUNG
      tp.notes ?? "", // GHI CHÚ
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
