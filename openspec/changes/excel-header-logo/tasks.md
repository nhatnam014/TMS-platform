## 1. Update export.service.ts — pass dates to builder

- [x] 1.1 In `apps/api/src/modules/export/export.service.ts`: update `exportTripPlans(from?, to?)` to pass `from` and `to` as 2nd and 3rd arguments to `buildKeHoachXe(result.data, from, to)`

## 2. Update kehoach-xe.builder.ts — remove 20'/40'/45' columns

- [x] 2.1 In `HEADERS` array: remove `"20'"`, `"40'"`, `"45'"` entries (indices 9–11) — column count becomes 28
- [x] 2.2 In `COL_WIDTHS` array: remove the 3 width values corresponding to the removed columns (keep alignment with HEADERS)
- [x] 2.3 In the `ws.addRow([...])` block: remove the 3 `sizeToTick(...)` calls for 20', 40', 45'
- [x] 2.4 Delete the `sizeToTick` helper function (no longer referenced)

## 3. Update kehoach-xe.builder.ts — add branded header

- [x] 3.1 Update `buildKeHoachXe` signature to accept `from?: string, to?: string` as optional 2nd and 3rd parameters
- [x] 3.2 Add date fallback logic at the top of the function:
  - `headerFrom = from ?? (tripPlans.length > 0 ? formatDate(new Date(Math.min(...tripPlans.map(t => new Date(t.tripDate).getTime())))) : "")`
  - `headerTo = to ?? formatDate(new Date())`
- [x] 3.3 Read logo file using `fs.readFileSync` with path resolved via `path.resolve(__dirname, '..', '..', '..', '..', '..', 'img', 'LogisticCompany.png')` wrapped in a try/catch (skip if missing)
- [x] 3.4 If logo exists: add image to workbook with `wb.addImage()` and add to worksheet anchored from `{ col: 0, row: 0 }` to `{ col: 6, row: 4 }` (A1:F4) using `ws.addImage(imageId, { tl: { col: 0, row: 0 }, br: { col: 6, row: 4 } })`
- [x] 3.5 Set rows 1–4 height to 30 points: `ws.getRow(i).height = 30` for i in 1..4
- [x] 3.6 Merge title cells: `ws.mergeCells(1, 7, 2, HEADERS.length)` (G1 to last column, rows 1–2)
- [x] 3.7 Set title cell value and style: `ws.getCell(1, 7).value = "KẾ HOẠCH XE"`, font size 18, bold, color `FF003399`, alignment center
- [x] 3.8 Merge date cells: `ws.mergeCells(3, 7, 4, HEADERS.length)` (G3 to last column, rows 3–4)
- [x] 3.9 Set date cell value: `ws.getCell(3, 7).value = \`From: ${headerFrom}  To: ${headerTo}\``, font size 11, alignment center
- [x] 3.10 Shift `ws.addRow(HEADERS)` call so the header row lands on row 5 (it already does so naturally after 4 inserted rows — verify the row index is correct after manual row insertion if needed)

## 4. Update quanly-xe.builder.ts — add branded header

- [x] 4.1 Add `import * as fs from 'fs'` and `import * as path from 'path'` at the top of the file (if not already present)
- [x] 4.2 Read logo file using same path resolution and try/catch pattern as in kehoach-xe builder
- [x] 4.3 If logo exists: add image to workbook anchored from A1 to F4
- [x] 4.4 Set rows 1–4 height to 30 points
- [x] 4.5 Merge title cells: `ws.mergeCells(1, 7, 2, HEADERS.length)` (G1 to last column, rows 1–2)
- [x] 4.6 Set title cell value and style: `ws.getCell(1, 7).value = "QUẢN LÝ XE"`, font size 18, bold, color `FF003399`, alignment center
- [x] 4.7 Leave rows 3–4 in the title area empty (no date line for quản lý xe)

## 5. Verify

- [x] 5.1 Run `npx tsc --noEmit -p apps/api/tsconfig.json` — confirm no TypeScript errors
- [ ] 5.2 Manually download kế hoạch xe Excel: confirm no 20'/40'/45' columns, branded header appears in rows 1–4, column headers at row 5
- [ ] 5.3 Manually download kế hoạch xe with blank date filter: confirm header shows From = oldest trip date, To = today
- [ ] 5.4 Manually download kế hoạch xe with date filter set: confirm header shows the user-supplied dates
- [ ] 5.5 Manually download quản lý xe Excel: confirm branded header in rows 1–4, no date line, column headers at row 5
