## Context

`quanly-xe.builder.ts` and `baoduong-xe.builder.ts` currently write a single header row followed immediately by data rows (`quanly-xe` already gained a 4-row logo+title header in the prior iteration of this change; `baoduong-xe` has no header at all). The customer has now specified a precise layout: a 5×7 logo block, a 2-column gap, an 8-column header block with a distinct title row and date row, a 1-row spacer, then the column-header row.

The company logo lives at `apps/img/LogisticCompany.png` (relative to the monorepo root). The API process runs from `apps/api/dist` in production, so the path must be resolved robustly (already solved by the existing `path.resolve(__dirname, ...)` + missing-file guard from the prior iteration — unchanged here).

ExcelJS (already a project dependency) supports embedded images via `workbook.addImage()` + `worksheet.addImage()` with cell-range anchoring, and merged cells via `worksheet.mergeCells()`.

On the import side, `quanly-xe.parser.ts` and `baoduong-xe.parser.ts` both locate the column-header row by scanning the first N rows for known keywords (`"stt"` for quanly-xe; `"ngày làm"`/`"số xe"`/`"biển số"` for baoduong-xe) rather than assuming a fixed row number — this detection already tolerates the column-header row moving (e.g. from row 1 to row 9), as long as the scan window is wide enough to reach it.

## Goals / Non-Goals

**Goals:**
- Replace the 4-row header in `quanly-xe.builder.ts` with the new 7-row-logo / 8-column-header layout; add the same layout to `baoduong-xe.builder.ts` (per sheet).
- Add a centered date/from-to row to both exports (previously: `quanly-xe` had title only, `baoduong-xe` had no header).
- Column headers land on row 9; data starts row 10. Both builders must be updated consistently.
- Widen the import parsers' header-detection scan window so files with the new header (column titles at row 9), the old 4-row header (row 5), or no header (row 1) all continue to parse correctly — no "must match this exact design" requirement.

**Non-Goals:**
- `kehoach-xe.builder.ts` / `kehoach-xe.parser.ts` — tracked in `fix-import-ke-hoach-xe-cost-fields` (same layout geometry, different change, to avoid two changes racing on the same files).
- Adding a real date-filter UI/query param to `quanly-xe` or `baoduong-xe` exports — `From`/`To` render as today's date for both (see Decision D7).
- Making company info or logo path configurable via env/DB.
- Changing any API endpoint signatures or query parameters.
- Frontend changes.
- Enforcing strict layout validation on import (rejecting files that don't match the branded design) — explicitly the opposite: maximize backward/forward tolerance (Decision D8).

## Decisions

### D1 — Header geometry: 5×7 logo block, 2-col gap, 8-col header block, 1 spacer row

```
Col:     1-5         6-7      8 ──────────────── 15
Row 1  ┌────────┐
Row 2  │        │
Row 3  │  LOGO  │  gap  ║   TITLE (merged H3:O3, center)        ║
Row 4  │ (5x7)  │       ║                                        ║
Row 5  │        │       ║   Ngày .. From: .. To: .. (merged H5:O5)║
Row 6  │        │       ║                                        ║
Row 7  └────────┘       ║                                        ║
Row 8  ── blank spacer row ──────────────────────────────────────
Row 9   column headers
Row 10+ data
```

Row heights for rows 1–8 are set so the 7-row logo block renders at a natural aspect ratio for the source PNG (logo image is anchored `tl: {col:0,row:0}` to `br: {col:5,row:7}`, i.e. A1:E7); row 8 uses the sheet's default height (spacer).

### D2 — Logo placement: cols A–E, rows 1–7

Anchored from A1 to E7 (5 columns wide, 7 rows tall) — wider/taller than the prior 4-row design's A1:F4 anchor, matching the customer's explicit column/row count. Uses `editAs: 'oneCell'` with `tl`/`br` cell references in ExcelJS, same API as the prior iteration.

### D3 — Title/date placement: cols H–O, title row 3, date row 5

- Title: `ws.mergeCells(3, 8, 3, 15)` (H3:O3), value = report title in hoa (e.g. `"QUẢN LÝ XE"`, `"BẢO DƯỠNG XE"`), bold, font size 18, color `#003399`, center-aligned both horizontally and vertically.
- Date: `ws.mergeCells(5, 8, 5, 15)` (H5:O5), value = `` `Ngày: ${exportDate}  From: ${from}  To: ${to}` ``, font size 11, center-aligned.
- Rows 1–2, 4, 6–8 in cols H–O are left blank — they exist only so the header block's total height (8 rows) matches the logo block's height (7 rows) plus the row-8 spacer, per the customer's "kéo dài tiếp 8 row" instruction.

### D4 — Logo path resolution (unchanged from prior iteration)

`path.resolve(__dirname, '..', '..', '..', '..', '..', 'img', 'LogisticCompany.png')`, with a missing-file guard: if the file doesn't exist, skip the image but still render title/date text.

### D5 — Column headers move to row 9; data to row 10

Both builders' existing `ws.addRow(HEADERS)` call (or equivalent) must land on row 9 — achieved by inserting/leaving the 8 header rows + 1 spacer row before it, same pattern as the prior iteration's row-5 shift, just 4 rows further down.

### D6 — `baoduong-xe.builder.ts` gets the header on every sheet

`baoduong-xe` exports one worksheet per `loaiXe`. The branded header (logo + title + date) is added identically to every sheet, not just the first — each sheet is a standalone artifact a user may print or share independently, so each needs its own identifying header. Title text can stay the generic `"BẢO DƯỠNG XE"` rather than embedding the `loaiXe` value, to match the other two exports' style (the sheet tab name already carries the `loaiXe` distinction).

### D7 — Date row content when there's no underlying date-range filter

Neither `quanly-xe` nor `baoduong-xe` exports take `from`/`to` query parameters (unlike `kehoach-xe`, which filters by `tripDate`). To keep the header format uniform across all three exports per the customer's "mọi export file" requirement, both render `From` = `To` = the export's generation date (today, server time), labeled as a generation date rather than a data range. This is an explicit assumption, not a derived filter — flagged here for the customer to confirm or correct; if a real date-range filter is later added to either export, this line should switch to reflect the actual filter range instead.

### D8 — Import tolerance: content-based detection, wider scan window, no strict-layout requirement

`quanly-xe.parser.ts:71` currently caps header-row detection at row ≤ 10; `baoduong-xe.parser.ts:88` caps it at row ≤ 5. Both detect the header row by searching cell text for known keywords (not by fixed row number), so widening the cap to e.g. **row ≤ 25** is sufficient to reach the new row-9 header position with margin for future tweaks, while still matching:
- legacy files exported before this change (no branded header, column titles at row 1)
- files exported under the prior 4-row design (column titles at row 5)
- newly-exported files under this design (column titles at row 9)
- hand-edited files where a user nudged rows by a row or two

No separate "strict mode" or design-version flag is introduced — a single content-based scan handles all cases, because the logo image (no cell text) and the header block's title/date cells (text that doesn't match the keywords being searched for) never produce a false match. This mirrors the same reasoning already applied to `kehoach-xe.parser.ts` in `fix-import-ke-hoach-xe-cost-fields` (Decision D-scan-range there) — kept as two separate edits only because they touch different files.

## Risks / Trade-offs

- **Logo file missing in production** → D4 guard ensures export still works; title/date render without image.
- **ExcelJS image API is column/row anchored, not pixel-perfect** → minor visual difference from the reference image is acceptable; composition matches.
- **`From`/`To` showing today's date twice (D7) may read oddly to the customer** since there's no real range to show for these two exports → flagged explicitly for confirmation; cheap to change to a different label (e.g. just "Ngày xuất: DD/MM/YYYY") if the customer prefers, since it's an isolated string in each builder.
- **Scan-window bump (D8) is a one-line constant change per parser** but must not be skipped — without it, `baoduong-xe.parser.ts` would silently fail to find any data row once its header moves past row 5.
