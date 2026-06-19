import * as ExcelJS from "exceljs";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "object" && v !== null && "toNumber" in v
    ? (v as { toNumber(): number }).toNumber()
    : Number(v);
  return isNaN(n) ? null : n;
}

const HEADERS = [
  "TT",
  "SỐ XE",
  "Tài xế",
  "phone",
  "NGÀY LÀM",
  "ĐƠN VỊ SỬA CHỮA / LOẠI XE",
  "ĐƠN VỊ SỬA CHỮA",
  "SỐ KM BẢO DƯỠNG",
  "KÌ BẢO DƯỠNG TIẾP THEO",
  "SỐ KM HIỆN TẠI",
  "KM ĐÃ CHẠY",
  "KM CÒN",
  "ID",
];

const COL_WIDTHS = [6, 14, 22, 14, 14, 28, 24, 20, 24, 20, 14, 14, 30];

function addSheet(wb: ExcelJS.Workbook, sheetName: string, records: any[]) {
  const ws = wb.addWorksheet(sheetName);

  HEADERS.forEach((_, i) => {
    ws.getColumn(i + 1).width = COL_WIDTHS[i];
  });

  const headerRow = ws.addRow(HEADERS);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  headerRow.alignment = { horizontal: "center", wrapText: true };
  headerRow.height = 22;

  records.forEach((rec, idx) => {
    const soKmBaoDuong = toNum(rec.soKmBaoDuong);
    const kiBaoDuongTiepTheo = toNum(rec.kiBaoDuongTiepTheo);
    const soKmHienTai = toNum(rec.soKmHienTai);
    const kmDaChay = soKmBaoDuong !== null && soKmHienTai !== null
      ? soKmHienTai - soKmBaoDuong
      : null;
    const kmCon = kiBaoDuongTiepTheo !== null && soKmHienTai !== null
      ? kiBaoDuongTiepTheo - soKmHienTai
      : null;

    const row = ws.addRow([
      idx + 1,
      rec.bienSo ?? "",
      rec.tenTaiXe ?? "",
      rec.sdt ?? "",
      formatDate(rec.ngayLam),
      rec.loaiXe ?? "",
      rec.donViSuaChua ?? "",
      soKmBaoDuong ?? "",
      kiBaoDuongTiepTheo ?? "",
      soKmHienTai ?? "",
      kmDaChay ?? "",
      kmCon ?? "",
      rec.id,
    ]);

    // ID cell grey
    row.getCell(HEADERS.length).font = { color: { argb: "FF9CA3AF" }, size: 9 };
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

export async function buildBaoDuongXe(records: any[], units: string[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  if (units.length === 0) {
    // Export all — group by loaiXe
    const unitSet = new Map<string, any[]>();
    for (const rec of records) {
      const key = rec.loaiXe ?? "(Khác)";
      if (!unitSet.has(key)) unitSet.set(key, []);
      unitSet.get(key)!.push(rec);
    }
    if (unitSet.size === 0) {
      wb.addWorksheet("bảo dưỡng xe");
    } else {
      for (const [unit, recs] of unitSet) {
        addSheet(wb, unit, recs);
      }
    }
  } else {
    for (const unit of units) {
      const recs = records.filter((r) => r.loaiXe === unit);
      addSheet(wb, unit, recs);
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
