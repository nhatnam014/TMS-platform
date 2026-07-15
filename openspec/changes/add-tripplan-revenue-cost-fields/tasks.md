## 1. Database schema — packages/db/prisma/schema.prisma

- [x] 1.1 Add 7 new nullable columns to the `TripPlan` model, positioned near the existing 8 fixed cost slots: `luongAmount Decimal? @db.Decimal(15, 2) @map("luong_amount")`, `cuocAmount Decimal? @db.Decimal(15, 2) @map("cuoc_amount")`, `doanhThuAmount Decimal? @db.Decimal(15, 2) @map("doanh_thu_amount")`, `phuThuAmount Decimal? @db.Decimal(15, 2) @map("phu_thu_amount")`, `chiPhiAmount Decimal? @db.Decimal(15, 2) @map("chi_phi_amount")`, `tienDauAmount Decimal? @db.Decimal(15, 2) @map("tien_dau_amount")`, `neoXeAmount Decimal? @db.Decimal(15, 2) @map("neo_xe_amount")`
- [x] 1.2 Run `pnpm prisma migrate dev --name add_trip_plan_revenue_cost_fields` inside `packages/db`; confirm the generated SQL adds 7 nullable columns to `trip_plans` (additive, no data loss)
- [x] 1.3 Regenerate the Prisma client (`pnpm prisma generate` if not run automatically by `migrate dev`) and confirm `apps/api` type-checks against the 7 new fields

## 2. API — CreateTripPlanDto / UpdateTripPlanDto

- [x] 2.1 In `apps/api/src/modules/trip-plan/dto/create-trip-plan.dto.ts`, add 7 new optional fields after the existing fixed cost slot fields: `luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount`, each decorated `@ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive()`
- [x] 2.2 Mirror the same 7 fields in `apps/api/src/modules/trip-plan/dto/update-trip-plan.dto.ts` (check whether it extends `CreateTripPlanDto` via `PartialType` or duplicates fields — follow whichever pattern the file already uses)
- [x] 2.3 Add the 7 fields to the shared `CreateTripPlanDto`/`UpdateTripPlanDto` TypeScript interfaces in `packages/shared/src/index.ts` if they declare cost-slot fields explicitly (check how `phiCuocAmount` etc. are declared there)

## 3. API — trip-plan.service.ts

- [x] 3.1 In `create()` (~line 146), add the 7 new fields to the `data` object passed to `tx.tripPlan.create`, following the existing `phiCuocAmount`/`phiCuocName` pattern (~line 192-193) but amount-only: `luongAmount: dto.luongAmount ?? null`, and likewise for the other 6
- [x] 3.2 In `update()` (~line 261), add conditional-spread updates for the 7 new fields, following the existing `...(dto.phiCuocAmount !== undefined && { phiCuocAmount: dto.phiCuocAmount })` pattern (~line 306)
- [x] 3.3 Confirm `findAll`'s response mapping and `TRIP_PLAN_INCLUDE`/select shape (if any explicit field selection exists) doesn't need changes — Prisma's default `findMany` already returns all scalar columns, but double-check no explicit `select` clause would silently drop the 7 new fields

## 4. Excel export — kehoach-xe.builder.ts

- [x] 4.1 Insert 7 new headers into the `HEADERS` array, immediately after `"CẦU ĐƯỜNG"` and before `"NGÀY GỬI CT"`: `"LƯƠNG"`, `"CƯỚC"`, `"DOANH THU"`, `"PHỤ THU"`, `"CHI PHÍ"`, `"TIỀN DẦU"`, `"NEO XE"`
- [x] 4.2 Insert 7 matching width values into `COL_WIDTHS` at the same array position (pick reasonable widths, e.g. 14-16, consistent with neighboring amount columns)
- [x] 4.3 Insert 7 matching values into the `dataRow` array passed to `ws.addRow(...)`, at the same position, immediately after `tp.cauDuongAmount != null ? Number(tp.cauDuongAmount) : ""` and before `formatDate(tp.documentSentDate)`: `tp.luongAmount != null ? Number(tp.luongAmount) : ""`, and likewise for the other 6 (`cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount`)
- [x] 4.4 Verify the header block's `endCol`/merge-range logic (title/date merges at `mergeCells(3, 8, 3, endCol)` etc.) is unaffected — `endCol` is a fixed constant (15), not derived from `HEADERS.length`, so no change needed there

## 5. Excel import — kehoach-xe.parser.ts

- [x] 5.1 Add 7 new optional fields to `ParsedTripPlanRow`: `luongAmount?: number`, `cuocAmount?: number`, `doanhThuAmount?: number`, `phuThuAmount?: number`, `chiPhiAmount?: number`, `tienDauAmount?: number`, `neoXeAmount?: number`
- [x] 5.2 Add 7 new entries to `COLUMN_CANDIDATES`: `LUONG: { occurrence: 0, texts: ["LƯƠNG"] }`, `CUOC: { occurrence: 0, texts: ["CƯỚC"] }`, `DOANH_THU: { occurrence: 0, texts: ["DOANH THU"] }`, `PHU_THU: { occurrence: 0, texts: ["PHỤ THU"] }`, `CHI_PHI: { occurrence: 0, texts: ["CHI PHÍ"] }`, `TIEN_DAU: { occurrence: 0, texts: ["TIỀN DẦU"] }`, `NEO_XE: { occurrence: 0, texts: ["NEO XE"] }`
- [x] 5.3 In the row-building object returned by `parseKeHoachXe`, add `luongAmount: cellNum(row, COL.LUONG)`, and likewise for the other 6, using the same `cellNum()` helper already used for `phiCuocAmount` etc.
- [x] 5.4 Confirm `resolveColumns()`'s missing-column warning logic (`Không tìm thấy cột "<label>" trong file`) automatically covers the 7 new candidates with no additional code — verify by temporarily renaming one of the new headers in a test file and checking a warning is produced

## 6. Import service — import.service.ts (importTripPlans)

- [x] 6.1 In the CREATE branch's `tripPlanData` object, add the 7 new fields: `luongAmount: row.luongAmount ?? null`, and likewise for the other 6 (matching whatever pattern the existing 8 fixed-slot fields use in this branch)
- [x] 6.2 In the UPDATE branch's `tripPlanData` object, add conditional-spread entries for the 7 new fields: `...(row.luongAmount !== undefined && { luongAmount: row.luongAmount })`, and likewise for the other 6
- [x] 6.3 Confirm the "before" snapshot fetched for the changed-record diff (before the UPDATE branch's `tx.tripPlan.update` call) includes the 7 new fields — if the fetch uses an explicit `select`, add them; if it fetches the full row, no change needed
- [x] 6.4 Confirm the field-by-field diff loop picks up the 7 new fields automatically since it iterates over keys present in `tripPlanData` (no field-specific code needed) — verify with a manual test (see task 8.3)

## 7. Web — trip-plans/page.tsx: TripPlanRow type and list table

- [x] 7.1 Add 7 new fields to the `TripPlanRow` interface (~line 33): `luongAmount: number | null`, `cuocAmount: number | null`, `doanhThuAmount: number | null`, `phuThuAmount: number | null`, `chiPhiAmount: number | null`, `tienDauAmount: number | null`, `neoXeAmount: number | null`
- [x] 7.2 Add 7 new `<th>`/`<td>` column definitions to the list table, positioned immediately after the CẦU ĐƯỜNG column and before the NGÀY GỬI CT column, each rendering `fmt(trip.luongAmount)` (and the other 6) using the existing `fmt()` formatting helper, blank when null

## 8. Web — trip-plans/page.tsx: create/edit form cost section

- [x] 8.1 Add 7 new state fields to `CreateTripModal` (and the equivalent state/props in `EditTripModal`) for the new amount inputs — following whatever local-state pattern the component already uses for amount-only slots (check whether `phiCuocAmount` currently flows through the `slots` object with `hasShd: false`, and whether these 7 new fields need a separate lightweight state shape since they have no name/SHĐ, unlike `slots[key]`)
- [x] 8.2 Render 7 new cost cells in the "Chi phí chuyến" grid, immediately after the CẦU ĐƯỜNG `CostSlotInput`, each showing only a label (LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE) and a single formatted-amount text input — reuse the existing amount-input styling/formatting helpers (`fmtInput`/`stripNonDigits`) but do NOT reuse `CostSlotInput` as-is if it always renders a name input; add a lighter-weight amount-only cell (new small component or inline JSX) instead
- [x] 8.3 Wire the 7 new inputs into the POST body on create (`toNum(...)` conversion, matching the existing pattern for `phiCuocAmount`) and the PUT body on edit
- [x] 8.4 Ensure `EditTripModal` pre-fills the 7 new inputs from the trip plan's existing values when opened

## 9. Verification

- [x] 9.1 `cd apps/api && pnpm exec tsc --noEmit` — confirm no type errors introduced
- [x] 9.2 `cd apps/web && pnpm exec tsc --noEmit` — confirm no type errors introduced
- [ ] 9.3 Manually create a trip plan via the "Tạo chuyến" form, filling in all 7 new fields, and confirm the created row's edit form shows the same values
- [x] 9.4 Manually export "kế hoạch xe" and confirm the 7 new columns appear in the correct position (after CẦU ĐƯỜNG, before NGÀY GỬI CT) with the correct values, and NỘI DUNG/GHI CHÚ/ID are still the last 3 columns — verified via an automated smoke script (`buildKeHoachXe()` → load buffer back with ExcelJS): header order and cell values confirmed programmatically; not visually opened in Excel/LibreOffice
- [ ] 9.5 Manually edit one of the 7 new columns in the exported file, re-import, and confirm the trip plan's edit form and a fresh export both show the updated value — requires running dev servers + browser, not exercised this session
- [ ] 9.6 Manually confirm the import result's changed-records section (from `fix-import-ke-hoach-xe-cost-fields`) shows the correct field/old/new values for an edited new-field column, and the Audit Log Viewer shows a matching entry — requires running dev servers + browser, not exercised this session
- [x] 9.7 Manually confirm leaving one of the 7 new fields blank on create/import correctly stores `null`, and blank cells on re-import do not clear an existing value — verified via a direct Prisma smoke script: partial update (only `phuThuAmount`) left `luongAmount`/`neoXeAmount` untouched
- [ ] 9.8 Manually confirm the trip plans list page shows the 7 new columns via horizontal scroll, correctly positioned and formatted — requires running dev servers + browser, not exercised this session
- [x] 9.9 Manually rename one of the 7 new column headers in an exported file (e.g. "CHI PHÍ" → something else) and re-import, confirming a "Không tìm thấy cột" warning is produced and that field is left unset for the import, rather than silently misreading another column — verified via smoke script: renaming "CHI PHÍ" produced the expected warning, `chiPhiAmount` came back `undefined`, and neighboring `chiPhiKhacAmount`/`chiPhiTraiTuyenAmount` were unaffected
