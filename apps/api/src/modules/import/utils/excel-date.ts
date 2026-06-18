export function parseExcelDate(val: unknown): Date | null {
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "number" && val > 40000) {
    return new Date((val - 25569) * 86400000);
  }
  if (typeof val === "string") {
    const s = val.trim();
    // DD/MM/YYYY or DD-MM-YYYY (4-digit year)
    const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return isNaN(date.getTime()) ? null : date;
    }
    // DD/MM/YY or DD-MM-YY (2-digit year → 2000+)
    const dmyShortMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
    if (dmyShortMatch) {
      const [, d, m, y] = dmyShortMatch;
      const date = new Date(2000 + Number(y), Number(m) - 1, Number(d));
      return isNaN(date.getTime()) ? null : date;
    }
    // YYYY-MM-DD (ISO)
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return isNaN(date.getTime()) ? null : date;
    }
  }
  return null;
}
