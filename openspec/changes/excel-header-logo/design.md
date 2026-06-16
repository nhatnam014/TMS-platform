## Context

Both Excel builders (`kehoach-xe.builder.ts`, `quanly-xe.builder.ts`) currently write a single header row followed immediately by data rows. The exports are functional but unbranded — when shared externally they carry no company identity.

The company logo lives at `apps/img/LogisticCompany.png` (relative to the monorepo root). The API process runs from `apps/api/dist` in production, so the path must be resolved robustly.

ExcelJS (already a project dependency) supports embedded images via `workbook.addImage()` + `worksheet.addImage()` with pixel/cell-range anchoring.

## Goals / Non-Goals

**Goals:**
- Insert a 4-row header block above data in both builders
- Embed `LogisticCompany.png` in the left block of the header
- Display report title ("KẾ HOẠCH XE" / "QUẢN LÝ XE") in large bold blue text on the right
- Display date range ("From: DD/MM/YYYY  To: DD/MM/YYYY") below the title in kehoach-xe only
- Remove unused 20'/40'/45' tick columns from kehoach-xe
- Auto-compute `from` as `MIN(tripDate)` from result data when the caller passes no `from`; auto-compute `to` as today when no `to` is passed

**Non-Goals:**
- Adding date filter UI to the quanly-xe export (no date range shown there)
- Making company info or logo path configurable via env/DB
- Changing any API endpoint signatures or query parameters
- Frontend changes

## Decisions

### D1 — Header height: 4 rows

From the reference image, the header spans approximately 4 rows. Row heights are set to ~25 pt each (default is ~15 pt) to match the visual. Data column headers move to row 5, data starts at row 6.

### D2 — Logo placement: cols A–F, rows 1–4

The logo image is anchored from cell A1 to F4 (6 columns wide, 4 rows tall). This mirrors the image layout where the logo occupies roughly the left third of the sheet. Exact pixel sizing uses `editAs: 'oneCell'` anchor with `tl`/`br` cell references in ExcelJS.

### D3 — Title placement: cols G–end, rows 1–2; dates rows 3–4

The title cell (merged G1 to last column, row 2) is center-aligned, font size 18, bold, color `#003399` (dark blue matching the image).  
The date line is merged G3 to last column, row 4, font size 11, center-aligned.

### D4 — Logo path resolution

Use `path.resolve(__dirname, '..', '..', '..', '..', '..', 'img', 'LogisticCompany.png')` inside the builder. At runtime the compiled builder sits at `apps/api/dist/modules/export/builders/`, so 5 `..` steps reach `apps/`, then `img/LogisticCompany.png`. Add a guard: if the file does not exist, skip the image (header still renders title + dates).

### D5 — Date fallback logic (kehoach-xe only)

`buildKeHoachXe(tripPlans, from?, to?)`:
- `headerFrom = from ?? (tripPlans.length ? formatDate(min(tripPlans.map(t => t.tripDate))) : "")`
- `headerTo   = to   ?? formatDate(new Date())`

No extra DB query needed — `tripPlans` array is already in memory.

### D6 — Column removal (kehoach-xe)

Remove indices 9, 10, 11 from `HEADERS` array (`"20'"`, `"40'"`, `"45'"`), the corresponding widths from `COL_WIDTHS`, and the three `sizeToTick()` calls in the row builder. Total column count: 31 → 28. The `sizeToTick` helper can be deleted if unused elsewhere.

## Risks / Trade-offs

- **Logo file missing in production** → D4 guard ensures export still works; title/dates render without image.
- **ExcelJS image API is column/row anchored, not pixel-perfect** → Minor visual difference from the reference image is acceptable; the overall composition matches.
- **Row height on header rows** → ExcelJS `row.height` property is set in points; value of 30 per row gives ~4cm total header height, close to the reference.
