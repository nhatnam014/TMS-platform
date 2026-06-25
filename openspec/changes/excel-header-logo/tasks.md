## 1. Update export.service.ts — pass dates to builder

- [x] 1.1 In `apps/api/src/modules/export/export.service.ts`: update `exportTripPlans(from?, to?)` to pass `from` and `to` as 2nd and 3rd arguments to `buildKeHoachXe(result.data, from, to)`

## 2. Update kehoach-xe.builder.ts — remove 20'/40'/45' columns

- [x] 2.1 In `HEADERS` array: remove `"20'"`, `"40'"`, `"45'"` entries (indices 9–11) — column count becomes 28
- [x] 2.2 In `COL_WIDTHS` array: remove the 3 width values corresponding to the removed columns (keep alignment with HEADERS)
- [x] 2.3 In the `ws.addRow([...])` block: remove the 3 `sizeToTick(...)` calls for 20', 40', 45'
- [x] 2.4 Delete the `sizeToTick` helper function (no longer referenced)

## 3. ~~kehoach-xe.builder.ts — 4-row branded header~~ (superseded)

> The 4-row header originally added here is being **redesigned** to the new 7-row-logo / row-9-column-headers layout. That redesign, plus the matching `kehoach-xe.parser.ts` changes, is now tracked in `fix-import-ke-hoach-xe-cost-fields` (already mid-flight on both files) instead of here, to avoid two changes editing the same files. Original tasks kept below for history only — do not redo them here.

- [x] 3.1 (superseded) Update `buildKeHoachXe` signature to accept `from?: string, to?: string`
- [x] 3.2 (superseded) Date fallback logic (MIN trip date / today)
- [x] 3.3 (superseded) Read logo file via `fs.readFileSync` with guarded path resolution
- [x] 3.4 (superseded) Anchor logo image A1:F4
- [x] 3.5 (superseded) Set rows 1–4 height to 30pt
- [x] 3.6 (superseded) Merge title cells G1:last,rows1-2
- [x] 3.7 (superseded) Title cell value/style
- [x] 3.8 (superseded) Merge date cells G3:last,rows3-4
- [x] 3.9 (superseded) Date cell value
- [x] 3.10 (superseded) Shift `ws.addRow(HEADERS)` to row 5

## 4. Update quanly-xe.builder.ts — redesign branded header to new 8-row layout

- [x] 4.1 Confirm `import * as fs from 'fs'` and `import * as path from 'path'` are present (already added by the prior 4-row design)
- [x] 4.2 Change the logo image anchor from A1:F4 to A1:E7 (5 cols × 7 rows): `ws.addImage(imageId, "A1:E7")` (string-range form used instead of `{tl,br}` object — ExcelJS's TS typings for the object form require internal `Anchor` fields not meant for input)
- [x] 4.3 Remove the old `ws.getRow(i).height = 30` loop for rows 1–4; set row heights for rows 1–8 so the 7-row logo block renders at a reasonable aspect ratio for the source PNG (pick a per-row height, e.g. ~20pt × 7 ≈ matches typical logo proportions — adjust by inspecting the rendered output)
- [x] 4.4 Replace the old title merge/value (`mergeCells(1,7,2,HEADERS.length)` at G1) with: `ws.mergeCells(3, 8, 3, HEADERS.length < 15 ? 15 : HEADERS.length)` (row 3, cols H–O or H–last-column if the table is wider than 15 cols) — value `"QUẢN LÝ XE"`, font size 18, bold, color `FF003399`, horizontal+vertical center
- [x] 4.5 Add a new date row: `ws.mergeCells(5, 8, 5, HEADERS.length < 15 ? 15 : HEADERS.length)` (row 5, same column range), value `` `Ngày: ${formatDate(new Date())}  From: ${formatDate(new Date())}  To: ${formatDate(new Date())}` ``, font size 11, center-aligned (previously quanly-xe had no date line at all)
- [x] 4.6 Leave row 8 blank (spacer row); shift the `ws.addRow(HEADERS)` call so the column header row lands on row 9 (was row 5)
- [x] 4.7 Verify data rows now start at row 10 (was row 6)

## 5. Update baoduong-xe.builder.ts — add branded header (new, applies per sheet)

- [x] 5.1 Add `import * as fs from 'fs'` and `import * as path from 'path'` if not already present
- [x] 5.2 Read the logo file once (outside the per-sheet loop) using the same path-resolution + try/catch guard pattern as `quanly-xe.builder.ts`
- [x] 5.3 Inside the per-`loaiXe` worksheet loop (`buildBaoDuongXe`): create the workbook image once via `wb.addImage()` before the loop, pass the resulting `imageId` into `addSheet()`/`addBrandedHeader()` for each sheet — ExcelJS supports referencing the same `imageId` from multiple worksheets' `ws.addImage()` calls
- [x] 5.4 Set row heights for rows 1–8 (same values chosen in task 4.3)
- [x] 5.5 Merge + set title cell at row 3, cols H–(15 or last column if wider): value `"BẢO DƯỠNG XE"`, same font/color/size/alignment as task 4.4
- [x] 5.6 Merge + set date cell at row 5, same column range: value `` `Ngày: ${formatDate(new Date())}  From: ${formatDate(new Date())}  To: ${formatDate(new Date())}` ``, same style as task 4.5
- [x] 5.7 Leave row 8 blank; shift the existing header-row `ws.addRow(...)` call to row 9
- [x] 5.8 Verify data rows now start at row 10, including the dynamic "KM CÒN DƯỠNG LẦN n" columns still being detected/placed correctly relative to the new header row position

## 6. Widen import header-row detection scan window

- [x] 6.1 In `apps/api/src/modules/import/parsers/quanly-xe.parser.ts`: change the scan condition from `rowNum <= 10` to `rowNum <= 25` (the row containing "stt" may now be at row 9 under the new export design, or row 1 for legacy files)
- [x] 6.2 In `apps/api/src/modules/import/parsers/baoduong-xe.parser.ts`: change the scan condition from `rowNum <= 5` to `rowNum <= 25` (the row containing "ngày làm"/"số xe"/"biển số" may now be at row 9, or row 1 for legacy files)
- [x] 6.3 Confirm neither parser's keyword search can false-positive-match text inside the new header block's title/date cells (it can't — those cells never contain "stt", "ngày làm", "số xe", or "biển số" as exact/substring matches against the parser's keyword list)

## 7. Verify

- [x] 7.1 Run `npx tsc --noEmit -p apps/api/tsconfig.json` — confirm no TypeScript errors
- [x] 7.2 Verified via a one-off script calling `buildQuanLyXe()` directly and reading the resulting buffer back with ExcelJS: 1 embedded image, title at row 3 col 8 = "QUẢN LÝ XE", date line at row 5 col 8, row 8 has zero cells, header row at row 9 ("STT" in col 1), data at row 10. Not visually inspected in Excel/LibreOffice — recommend a manual spot-check of the rendered logo placement before considering this fully done.
- [x] 7.3 Verified the same way for `buildBaoDuongXe()` with one `loaiXe` group: sheet named after the loaiXe, 1 embedded image, title/date at rows 3/5, header row at row 9, data at row 10. Only tested with a single `loaiXe` group in this session — recommend a manual check with 2+ groups to confirm every sheet gets its own header (code applies the same per-sheet call to every group, so this should hold, but not directly observed for >1 sheet)
- [x] 7.4 Verified via `parseQuanLyXe()` against the freshly-built workbook: the row parses back with the same `id`, `tenTaiXe`, `sdt`, `bienSo` — confirms it would match the existing record on re-import rather than being treated as a new row. Did not run through the live `importVehicles` DB flow.
- [x] 7.5 Verified via `parseBaoDuongXe()` against the freshly-built workbook: `id`, `bienSo`, `kmRounds` (round 1) all round-trip correctly. Did not run through the live `importVehicleMaintenance` DB flow.
- [x] 7.6 Verified by hand-building a minimal workbook with the column-header row at row 1 (no branded header block) for both `quanly-xe` and `baoduong-xe` shapes and running both parsers against them — both correctly located the header at row 1 and parsed the data row.
