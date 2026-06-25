## Why

The exported Excel files currently start directly with the column header row, providing no branding or context. Users need a professional header with the company logo, report title, and date range so the document is self-identifying when shared externally.

A first version of this header (4 rows, logo + title only, no date range for `quanly-xe`) already shipped for `kehoach-xe` and `quanly-xe`. The customer has since specified a more precise layout (logo block sized in rows/columns, a dedicated title row, a date/from-to row, both centered and merged) and asked for the same branding on the third export (`bao-duong-xe`, vehicle maintenance) which had none. This change **redesigns** the header layout for `quanly-xe` and `bao-duong-xe` to match the new spec, and adds the matching import-side tolerance so previously-exported files (old 4-row header, or no header at all) keep importing correctly alongside newly-exported ones.

`kehoach-xe`'s header redesign and its import parser changes are tracked separately in `fix-import-ke-hoach-xe-cost-fields`, since that change is already mid-flight on the same two files (`kehoach-xe.builder.ts`, `kehoach-xe.parser.ts`) — doing both redesigns there avoids two changes editing the same files in conflicting ways. This change's header layout decisions (row/column geometry, merge ranges, font rules) are the shared source of truth that the `kehoach-xe` work follows.

## What Changes

- Redesign the branded header block (currently 4 rows, logo+title only) to the customer's new layout, applied to **`quanly-xe`** and **`bao-duong-xe`** (every sheet, since `bao-duong-xe` exports one sheet per `loaiXe`):
  - Company logo image (`apps/img/LogisticCompany.png`) anchored to a 5-column × 7-row block (cols A–E, rows 1–7)
  - 2-column gap (cols F–G)
  - Header block spanning cols H–O (8 columns), rows 1–8, vertically aligned with the logo's height:
    - Title row (row 3): report title in hoa, bold, large font, merged H3:O3, center-aligned
    - Date row (row 5): "Ngày ... From: DD/MM/YYYY  To: DD/MM/YYYY" in normal font, merged H5:O5, center-aligned
  - Row 8: blank spacer row ("cách 1 dòng")
  - Row 9: column header row (was row 5); data starts row 10
- Add the date/from-to line to `quanly-xe` and `bao-duong-xe` (previously `quanly-xe` had title only, `bao-duong-xe` had no header at all). Neither export has a date-filter query parameter today, so `From`/`To` both render as the export's generation date (today) — documented as an explicit assumption, not a derived data range like `kehoach-xe`'s.
- Add the same branded header to **`bao-duong-xe.builder.ts`**, which currently has none — applied identically to every per-`loaiXe` sheet it generates.
- Bump the header-row detection window in `quanly-xe.parser.ts` (currently scans rows ≤ 10) and `baoduong-xe.parser.ts` (currently scans rows ≤ 5) to a shared constant covering at least row 9 with margin, so both **legacy files** (no header, column titles at row 1) and **newly-exported files** (header block, column titles at row 9) continue to import correctly without any "strict design" requirement — detection stays content-based (search for known header keywords), not position-based.

## Capabilities

### Modified Capabilities
- `excel-branded-header`: header layout redesigned from 4 rows (logo+title, optional date) to the new geometry (7-row logo block, 2-col gap, 8-col header block with separate title/date rows, 1 spacer row, column headers at row 9) — now describes `quanly-xe` and `bao-duong-xe` only; `kehoach-xe`'s instance of this layout is owned by `fix-import-ke-hoach-xe-cost-fields`
- `vehicle-excel-export`: header redesigned to new layout; adds a date row (previously had none)
- `vehicle-excel-import`: widen header-row detection scan window from 10 to 25 rows so files with or without the branded header both import correctly

### New Capabilities
- `vehicle-maintenance-excel-export`: adds the branded header block (previously had no header at all) to every per-`loaiXe` sheet
- `vehicle-maintenance-excel-import`: widen header-row detection scan window from 5 to 25 rows so files with or without the branded header both import correctly

## Impact

- `apps/api/src/modules/export/builders/quanly-xe.builder.ts` — header redesign
- `apps/api/src/modules/export/builders/baoduong-xe.builder.ts` — new header block, applied per sheet
- `apps/api/src/modules/import/parsers/quanly-xe.parser.ts` — widen header-row detection window
- `apps/api/src/modules/import/parsers/baoduong-xe.parser.ts` — widen header-row detection window
- `apps/img/LogisticCompany.png` — read at build time via `fs.readFileSync` (already wired up for the prior 4-row design; geometry changes only)
- No API contract changes (endpoint signatures unchanged)
- No frontend changes required
- Coordinates with `fix-import-ke-hoach-xe-cost-fields`, which applies the same layout geometry to `kehoach-xe.builder.ts`/`kehoach-xe.parser.ts`
