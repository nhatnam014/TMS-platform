import * as ExcelJS from "exceljs";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

function sizeToTick(containerSize: string | null | undefined, prefix: string): string {
  if (!containerSize) return "";
  return containerSize.startsWith(prefix) ? "X" : "";
}

function findCost(
  costs: any[],
  name: string,
): { amount: number | null; invoiceNumber: string | null } {
  const match = costs?.find((c: any) => c.costName === name);
  return {
    amount: match ? Number(match.amount) || null : null,
    invoiceNumber: match?.invoiceNumber ?? null,
  };
}

const COST_NAMES = [
  "PHÍ NÂNG",
  "PHÍ HẠ",
  "PHÍ VỆ SINH",
  "PHÍ CƯỢC",
  "VÉ CỔNG",
  "PHÍ ĐỨT TEM",
  "CHI PHÍ TRÁI TUYẾN",
  "CẦU ĐƯỜNG",
  "CHI PHÍ PHÁT SINH KHÁC",
] as const;

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

const SERVICE_TYPE_MAP: Record<string, string> = {
  SEA_EXPORT: "SEA - EX",
  SEA_IMPORT: "SEA - IM",
  NEO_EXPORT: "NEO - EX",
  NEO_IMPORT: "NEO - IM",
};

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
    const costs: any[] = tp.costs ?? [];
    const cs = tp.containerSize ?? "";

    const nang = findCost(costs, "PHÍ NÂNG");
    const ha = findCost(costs, "PHÍ HẠ");
    const veSinh = findCost(costs, "PHÍ VỆ SINH");
    const cuoc = findCost(costs, "PHÍ CƯỢC");
    const veCong = findCost(costs, "VÉ CỔNG");
    const dutTem = findCost(costs, "PHÍ ĐỨT TEM");
    const traiTuyen = findCost(costs, "CHI PHÍ TRÁI TUYẾN");
    const cauDuong = findCost(costs, "CẦU ĐƯỜNG");
    const phatSinh = findCost(costs, "CHI PHÍ PHÁT SINH KHÁC");

    ws.addRow([
      idx + 1, // STT
      formatDate(tp.tripDate), // NGÀY
      tp.vehicle?.licensePlate ?? "", // SỐ XE
      tp.customer?.name ?? "", // KHÁCH HÀNG
      SERVICE_TYPE_MAP[tp.serviceType] ?? tp.serviceType ?? "", // LOẠI HÌNH
      tp.carrier?.name ?? "", // ĐƠN VỊ
      cs, // SIZE CONT
      tp.outboundContainerNumber ?? "", // CONT ĐI
      tp.inboundContainerNumber ?? "", // CONT VỀ
      sizeToTick(cs, "20"), // 20'
      sizeToTick(cs, "40"), // 40'
      sizeToTick(cs, "45"), // 45'
      tp.pickupLocation?.name ?? "", // Điểm Lấy
      tp.loadUnloadLocation?.name ?? "", // Điểm Đóng/Rút
      tp.dropoffLocation?.name ?? "", // Điểm Hạ
      nang.amount ?? "", // PHÍ NÂNG
      nang.invoiceNumber ?? "", // SHĐ NÂNG
      ha.amount ?? "", // PHÍ HẠ
      ha.invoiceNumber ?? "", // SHĐ HẠ
      veSinh.amount ?? "", // PHÍ VỆ SINH
      veSinh.invoiceNumber ?? "", // SHĐ
      cuoc.amount ?? "", // PHÍ CƯỢC
      veCong.amount ?? "", // VÉ CỔNG
      veCong.invoiceNumber ?? "", // SHĐ
      dutTem.amount ?? "", // CHI PHÍ ĐỨT TEM
      traiTuyen.amount ?? "", // CHI PHÍ TRÁI TUYẾN
      cauDuong.amount ?? "", // CẦU ĐƯỜNG
      formatDate(tp.documentSentDate), // NGÀY GỬI CT
      phatSinh.amount ?? "", // CHI PHÍ PHÁT SINH KHÁC
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
