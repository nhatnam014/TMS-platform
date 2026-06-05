export function parseExcelDate(val: unknown): Date | null {
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "number" && val > 40000) {
    return new Date((val - 25569) * 86400000);
  }
  if (typeof val === "string") {
    const s = val.trim();
    // DD/MM/YYYY
    const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      const [, d, m, y] = match;
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return isNaN(date.getTime()) ? null : date;
    }
  }
  return null;
}
