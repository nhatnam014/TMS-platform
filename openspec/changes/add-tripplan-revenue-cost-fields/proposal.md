## Why

"Kế hoạch xe" (trip plans) currently has no way to record 7 financial figures the customer tracks per trip — Lương (driver salary), Cước (freight fare), Doanh Thu (revenue), Phụ Thu (surcharge), Chi Phí (cost), Tiền Dầu (fuel money), and Neo xe (vehicle demurrage/anchor fee). Users must track these outside the system, causing the exported Excel file to be incomplete for financial reconciliation.

## What Changes

- Add 7 new nullable `Decimal(15,2)` columns to `TripPlan`: `luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount` — amount-only (no companion name/SHĐ field, matching the shape of the existing `phiCuocAmount` slot). **Database migration required.**
- `CreateTripPlanDto`/`UpdateTripPlanDto` accept all 7 fields as optional positive numbers; `TripPlanService.create`/`update` persist them the same way other amount-only fixed-slot fields are persisted today.
- Web create/edit trip plan form (`trip-plans/page.tsx`): extend the existing "Chi phí chuyến" grid with 7 new amount-only input cells, appended immediately after the CẦU ĐƯỜNG cell, in this fixed order: LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE. These cells have no editable name/SHĐ input — only a formatted amount text input, matching the "amount-only" shape of `PHÍ CƯỢC`.
- Excel export (`kehoach-xe.builder.ts`): insert 7 new columns into `HEADERS`/`COL_WIDTHS`/the data row, positioned immediately after CẦU ĐƯỜNG and before NGÀY GỬI CT. NỘI DUNG, GHI CHÚ, and the trailing ID column remain the last columns in the file, unchanged.
- Excel import (`kehoach-xe.parser.ts`): add the 7 new fields to `ParsedTripPlanRow` and to the `COLUMN_CANDIDATES` header-text-matching table (same pattern already used for every other column in this parser), so the columns are located by header text rather than fixed position.
- `import.service.ts`'s `importTripPlans`: write the 7 new fields into both the CREATE and UPDATE data objects (conditional-spread pattern matching the other fixed-slot fields), and include them in the existing changed-record diff/audit-log logic so re-importing an edited file actually updates them (same guarantee the 8 existing fixed cost slots already have).
- Trip plans list view (`trip-plans/page.tsx` table + `TripPlanRow` type): add 7 new columns to the horizontal-scrolling list table, positioned to match the new Excel column order (after CẦU ĐƯỜNG, before NGÀY GỬI CT).

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `trip-plan-cost-form`: `TripPlan` gains 7 new amount-only cost/revenue columns (`luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount`); the create/edit form's cost section gains 7 new amount-only input cells appended after CẦU ĐƯỜNG.
- `trip-plan-excel-export`: 7 new columns added to the "kế hoạch xe" export, positioned after CẦU ĐƯỜNG and before NGÀY GỬI CT; NỘI DUNG/GHI CHÚ/ID remain last.
- `trip-plan-excel-import`: 7 new columns parsed via header-text matching and persisted on both create and update; included in the changed-record diff so edits round-trip through re-import.
- `trip-plan-crud`: the trip plans list table gains 7 new columns; `POST /trip-plans` accepts and `GET /trip-plans` returns the 7 new fields.

## Impact

- `packages/db/prisma/schema.prisma` (`TripPlan` model — 7 new nullable `Decimal(15,2)` columns; migration required)
- `apps/api/src/modules/trip-plan/dto/create-trip-plan.dto.ts`, `update-trip-plan.dto.ts`
- `apps/api/src/modules/trip-plan/trip-plan.service.ts` (`create`, `update`)
- `apps/api/src/modules/export/builders/kehoach-xe.builder.ts`
- `apps/api/src/modules/import/parsers/kehoach-xe.parser.ts`
- `apps/api/src/modules/import/import.service.ts` (`importTripPlans`)
- `apps/web/src/app/(authenticated)/trip-plans/page.tsx` (`TripPlanRow` type, create/edit form cost section, list table columns)
- **Database migration required**: add 7 new nullable `Decimal(15,2)` columns to `trip_plans`.
- Builds on top of the in-progress change `fix-import-ke-hoach-xe-cost-fields` (its code changes to `kehoach-xe.builder.ts`/`kehoach-xe.parser.ts`/`import.service.ts` are already in the working tree, only manual verification tasks remain) — this change extends that same header-text-matching / changed-record-diff machinery rather than reworking it.
