import * as ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import { TRIP_STATUS_LABELS } from "@tms/shared";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

function addBrandedHeader(
  ws: ExcelJS.Worksheet,
  wb: ExcelJS.Workbook,
  headerFrom: string,
  headerTo: string,
) {
  // Header block is a fixed 8 columns wide (H–O), independent of how many data
  // columns the table has — it does not stretch to match the table's width.
  const endCol = 15;

  for (let r = 1; r <= 8; r++) {
    ws.getRow(r).height = 20;
  }

  try {
    const logoPath = path.resolve(__dirname, "..", "..", "..", "..", "..", "img", "LogisticCompany.png");
    if (fs.existsSync(logoPath)) {
      const imageId = wb.addImage({ filename: logoPath, extension: "png" });
      ws.addImage(imageId, "A1:E7");
    }
  } catch {
    // Logo is optional branding — skip silently if missing/unreadable
  }

  ws.mergeCells(3, 8, 3, endCol);
  const titleCell = ws.getCell(3, 8);
  titleCell.value = "KẾ HOẠCH XE";
  titleCell.font = { bold: true, size: 18, color: { argb: "FF003399" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells(5, 8, 5, endCol);
  const dateCell = ws.getCell(5, 8);
  dateCell.value = `From: ${headerFrom}  To: ${headerTo}`;
  dateCell.font = { size: 11 };
  dateCell.alignment = { horizontal: "center", vertical: "middle" };
}

const HEADERS = [
  "STT",
  "NGÀY",
  "SỐ XE",
  "KHÁCH HÀNG",
  "TRẠNG THÁI",
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
  "LƯƠNG",
  "SHĐ LƯƠNG",
  "CƯỚC",
  "SHĐ CƯỚC",
  "DOANH THU",
  "SHĐ DOANH THU",
  "PHỤ THU",
  "SHĐ PHỤ THU",
  "CHI PHÍ",
  "SHĐ CHI PHÍ",
  "TIỀN DẦU",
  "SHĐ TIỀN DẦU",
  "NEO XE",
  "SHĐ NEO XE",
  "NGÀY GỬI CT",
  "CHI PHÍ PHÁT SINH KHÁC",
  "NỘI DUNG",
  "GHI CHÚ",
  "ID",
] as const;

const COL_WIDTHS = [
  6, 12, 14, 22, 14, 12, 18, 10, 16, 16, 22, 22, 22, 12, 16, 12, 16, 14, 16, 12, 12, 16, 20, 30, 14,
  14, 16, 14, 16, 14, 16, 14, 16, 14, 16, 14, 16, 14, 16,
  14, 24, 24, 24, 30,
];

export async function buildKeHoachXe(
  tripPlans: any[],
  from?: string,
  to?: string,
): Promise<Buffer> {
  const headerFrom =
    from ??
    (tripPlans.length > 0
      ? formatDate(new Date(Math.min(...tripPlans.map((t) => new Date(t.tripDate).getTime()))))
      : "");
  const headerTo = to ?? formatDate(new Date());

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("kế hoạch xe");

  HEADERS.forEach((_, i) => {
    ws.getColumn(i + 1).width = COL_WIDTHS[i];
  });

  addBrandedHeader(ws, wb, headerFrom, headerTo);

  // Column header row at row 9 (rows 1–8 are the branded header block)
  const headerRowObj = ws.addRow(HEADERS as unknown as any[]);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  headerRowObj.alignment = { horizontal: "center", wrapText: true };
  headerRowObj.height = 22;

  // Data rows from row 10
  tripPlans.forEach((tp, idx) => {
    const sizeCode = tp.containerSize?.code ?? null;
    const serviceTypeLabel = tp.serviceType?.code ?? "";
    const otherCostsTotal = (tp.costs ?? []).reduce(
      (sum: number, c: any) => sum + Number(c.amount || 0),
      0,
    );

    const dataRow = ws.addRow([
      tp.tripNumber ?? idx + 1,
      formatDate(tp.tripDate),
      tp.vehiclePlate ?? "",
      tp.customer?.name ?? "",
      TRIP_STATUS_LABELS[tp.status as keyof typeof TRIP_STATUS_LABELS] ?? "",
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
      tp.luongAmount != null ? Number(tp.luongAmount) : "",
      tp.shdLuong ?? "",
      tp.cuocAmount != null ? Number(tp.cuocAmount) : "",
      tp.shdCuoc ?? "",
      tp.doanhThuAmount != null ? Number(tp.doanhThuAmount) : "",
      tp.shdDoanhThu ?? "",
      tp.phuThuAmount != null ? Number(tp.phuThuAmount) : "",
      tp.shdPhuThu ?? "",
      tp.chiPhiAmount != null ? Number(tp.chiPhiAmount) : "",
      tp.shdChiPhi ?? "",
      tp.tienDauAmount != null ? Number(tp.tienDauAmount) : "",
      tp.shdTienDau ?? "",
      tp.neoXeAmount != null ? Number(tp.neoXeAmount) : "",
      tp.shdNeoXe ?? "",
      formatDate(tp.documentSentDate),
      otherCostsTotal > 0 ? otherCostsTotal : "",
      tp.description ?? "",
      tp.notes ?? "",
      tp.id,
    ]);
    const idCell = dataRow.getCell(HEADERS.length);
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

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
