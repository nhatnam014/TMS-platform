// Splits a "GHI CHÚ" cell's raw text into one note per non-empty trimmed line —
// shared by every parser that reads a multi-note column (quanly-xe, baoduong-xe, lenh-bai).
export function parseNoteLines(cellValue: string): string[] {
  return cellValue
    .split(/\r\n|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
