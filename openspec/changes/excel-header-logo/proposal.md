## Why

The exported Excel files currently start directly with the column header row, providing no branding or context. Users need a professional header with the company logo, report title, and date range so the document is self-identifying when shared externally.

## What Changes

- Remove columns `20'`, `40'`, `45'` from the kế hoạch xe Excel export (those tick-mark columns are unused in practice)
- Add a 4-row branded header section to **both** Excel exports (`kehoach-xe` and `quanly-xe`) containing:
  - Company logo image (`apps/img/LogisticCompany.png`) spanning the left columns
  - Report title ("KẾ HOẠCH XE" or "QUẢN LÝ XE") in large bold blue text spanning the right columns
  - Date range line ("From: DD/MM/YYYY  To: DD/MM/YYYY") below the title — only for kế hoạch xe
- For kế hoạch xe date logic:
  - If `from` is provided by the user → use it; if blank → derive from `MIN(tripDate)` across the exported result set
  - If `to` is provided by the user → use it; if blank → use today's date
- Data rows shift down by 4 rows to accommodate the header
- `buildKeHoachXe()` builder signature gains optional `from?: string, to?: string` parameters
- `export.service.ts` passes `from` and `to` through to the builder

## Capabilities

### New Capabilities
- `excel-branded-header`: Embed company logo image + report title + date range as a 4-row header block in Excel exports using ExcelJS image API

### Modified Capabilities
- `trip-plan-excel-export`: Remove 20'/40'/45' columns; add branded header with date range
- `vehicle-excel-export`: Add branded header (logo + title, no date range)

## Impact

- `apps/api/src/modules/export/builders/kehoach-xe.builder.ts` — primary changes (header + column removal)
- `apps/api/src/modules/export/builders/quanly-xe.builder.ts` — header addition only
- `apps/api/src/modules/export/export.service.ts` — pass `from`/`to` to builder
- `apps/img/LogisticCompany.png` — read at build time via `fs.readFileSync`
- No API contract changes (endpoint signatures unchanged)
- No frontend changes required
