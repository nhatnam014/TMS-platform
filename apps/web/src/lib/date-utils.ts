function parseDate(d: string | Date | null | undefined): Date | null {
  if (d == null || d === "") return null;
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function formatDate(d: string | Date | null | undefined): string {
  const date = parseDate(d);
  if (!date) return "—";
  return date.toLocaleDateString("vi-VN");
}

export function formatDateTime(d: string | Date | null | undefined): string {
  const date = parseDate(d);
  if (!date) return "—";
  return date.toLocaleString("vi-VN");
}

export function toDateInput(d: string | Date | null | undefined): string {
  const date = parseDate(d);
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}
