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
  "CHI PHÍ KHÁC/ PHÍ ĐỨT TEM",
  "CHI PHÍ TRÁI TUYẾN/ CHỈ ĐỊNH/ BP CAM",
  "CẦU ĐƯỜNG",
  "NGÀY GỬI CT",
  "CHI PHÍ PHÁT SINH KHÁC",
  "NỘI DUNG",
  "GHI CHÚ",
] as const;

const COL_WIDTHS = [
  6, 12, 14, 22, 12, 18, 10, 16, 16, 22, 22, 22, 12, 16, 12, 16, 14, 16, 12,
  12, 16, 20, 30, 14, 14, 24, 24, 24,
];

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

const HEADER_ROWS = 5;
const TITLE_ROW = 4;
const DATE_ROW = 5;
const TITLE_COL_START = 9;  // column I (1-based)
const TITLE_COL_END = 19;   // column S (1-based)

export async function buildKeHoachXe(
  tripPlans: any[],
  from?: string,
  to?: string,
): Promise<Buffer> {
  // Date fallback logic
  let headerFrom = from ? formatDate(new Date(from)) : "";
  let headerTo = to ? formatDate(new Date(to)) : "";

  if (!headerFrom && tripPlans.length > 0) {
    const timestamps = tripPlans
      .map((t) => new Date(t.tripDate).getTime())
      .filter((n) => !isNaN(n));
    if (timestamps.length > 0) {
      headerFrom = formatDate(new Date(Math.min(...timestamps)));
    }
  }
  if (!headerTo) {
    headerTo = formatDate(new Date());
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("kế hoạch xe");

  // ── Column widths ──────────────────────────────────────────────────────────
  HEADERS.forEach((_, i) => {
    ws.getColumn(i + 1).width = COL_WIDTHS[i];
  });

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
      br: { col: 5, row: 7 },
    } as any);
  }

  // Title: row 4, I4:S4
  ws.mergeCells(TITLE_ROW, TITLE_COL_START, TITLE_ROW, TITLE_COL_END);
  const titleCell = ws.getCell(TITLE_ROW, TITLE_COL_START);
  titleCell.value = "KẾ HOẠCH XE";
  titleCell.font = { bold: true, size: 18, color: { argb: "FF003399" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // Date range: row 5, I5:S5
  ws.mergeCells(DATE_ROW, TITLE_COL_START, DATE_ROW, TITLE_COL_END);
  const dateCell = ws.getCell(DATE_ROW, TITLE_COL_START);
  dateCell.value = `From: ${headerFrom}  To: ${headerTo}`;
  dateCell.font = { size: 11 };
  dateCell.alignment = { horizontal: "center", vertical: "middle" };

  // ── Column header row (row 6) ──────────────────────────────────────────────
  const headerRowObj = ws.addRow(HEADERS as unknown as any[]);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  headerRowObj.alignment = { horizontal: "center", wrapText: true };

  // ── Data rows ──────────────────────────────────────────────────────────────
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
      tp.vehiclePlate ?? "", // SỐ XE
      tp.customer?.name ?? "", // KHÁCH HÀNG
      serviceTypeLabel, // LOẠI HÌNH
      tp.carrier?.name ?? "", // ĐƠN VỊ
      sizeCode ?? "", // SIZE CONT
      tp.outboundContainerNumber ?? "", // CONT ĐI
      tp.inboundContainerNumber ?? "", // CONT VỀ
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
