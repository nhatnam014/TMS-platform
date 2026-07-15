## Why

"Kế hoạch xe" (trip plans) currently has no way to record 7 financial figures the customer tracks per trip — Lương (driver salary), Cước (freight fare), Doanh Thu (revenue), Phụ Thu (surcharge), Chi Phí (cost), Tiền Dầu (fuel money), and Neo xe (vehicle demurrage/anchor fee). Users must track these outside the system, causing the exported Excel file to be incomplete for financial reconciliation.

These 7 fields were added earlier the same day as amount-only inputs. Two follow-up explorations the same day (2026-07-15) revised that: (1) the customer wants to select-or-type a fee name for each of the 7 fields, same as the 8 pre-existing fixed cost slots; (2) the customer then further asked for an invoice-number (SHĐ) field on all 7 as well, matching the 4 existing slots that carry SHĐ; and (3) the customer separately asked for the trip's status ("Trạng thái") to be added to the Excel export/import file, which today has no status column at all (only the web list page shows it). This proposal folds all three into one revision.

## What Changes

- Add 7 new nullable `Decimal(15,2)` columns to `TripPlan`: `luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount`. **(Already implemented/migrated.)**
- Add 7 new nullable `String` name columns to `TripPlan`: `luongName`, `cuocName`, `doanhThuName`, `phuThuName`, `chiPhiName`, `tienDauName`, `neoXeName` — editable name companion for each Amount field, selectable-or-typeable via `Combobox` + `CostTemplate`, matching the 8 existing slots' name behavior.
- Add 7 new nullable `String` invoice-number columns to `TripPlan`: `shdLuong`, `shdCuoc`, `shdDoanhThu`, `shdPhuThu`, `shdChiPhi`, `shdTienDau`, `shdNeoXe` — matching the naming convention and shape of the existing `shdNang`/`shdHa`/`shdVeSinh`/`shdVeCong` columns. **Database migration required (14 new `String` columns total).**
- `CreateTripPlanDto`/`UpdateTripPlanDto` accept all 7 `*Amount` fields (already implemented), all 7 `*Name` fields, and all 7 `shd*` fields as optional strings; `TripPlanService.create`/`update` persist them the same way the existing fixed-slot name/amount/SHĐ triples are persisted today.
- Web create/edit trip plan form (`trip-plans/page.tsx`): extend the existing "Chi phí chuyến" grid with 7 new input cells, appended immediately after the CẦU ĐƯỜNG cell, in this fixed order: LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE. Each cell renders the same `CostSlotInput` component the 8 existing slots use (`Combobox` for the name, an amount input, and an SHĐ input), with `hasShd={true}`. This replaces the amount-only `ExtraCostInput` cell used today.
- Excel export (`kehoach-xe.builder.ts`): the 7 `*Amount` columns (already implemented) each gain an adjacent "SHĐ &lt;FIELD&gt;" column (e.g. "SHĐ LƯƠNG"), matching how `phiNangAmount`/`shdNang` are laid out as an adjacent pair. `*Name` is still **not** exported (unchanged from the prior revision — same as the 8 existing slots). A new "TRẠNG THÁI" column is inserted immediately after "KHÁCH HÀNG", rendering the trip's status as its Vietnamese label (e.g. "Kế hoạch", "Hoàn thành").
- Excel import (`kehoach-xe.parser.ts` / `import.service.ts`): parses the 7 new SHĐ columns via header-text matching (same mechanism as every other column) and persists them on create/update, included in the changed-record diff. Parses "TRẠNG THÁI" by reverse-mapping the Vietnamese label back to the `TripStatus` enum; unrecognized text produces a per-row warning and leaves status untouched. Status is applied on the UPDATE branch only (re-import), not on CREATE — matching the existing rule that new trip plans always start `PLANNED` (`CreateTripPlanDto` has no `status` field; only `UpdateTripPlanDto` does).
- Trip plans list view (`trip-plans/page.tsx` table + `TripPlanRow` type): the 7 new `*Amount` columns each gain an adjacent SHĐ column, matching the existing 4-slot list pattern. The existing "Trạng thái" list column is unchanged (already present, unaffected by this revision — only the Excel file gains a status column). `*Name` is still not shown in the list.
- New shared constant (`packages/shared/src/index.ts`): a `TRIP_STATUS_LABELS` map (`TripStatus` → Vietnamese label) and its reverse lookup, used by both the export builder and the import parser so the Vietnamese label is defined once, not duplicated per file. (The web page's existing local `STATUS_LABELS` constant is left as-is — out of scope to refactor.)
- Trip plans list page (`trip-plans/page.tsx`): the "Trạng thái" column's previously read-only badge is now an interactive `<select>` (same color styling), letting users change a trip's status directly from the list via the existing `PATCH /trip-plans/:id/status` endpoint, with an optimistic update that reverts on failure. No backend change — this endpoint/service method already existed, unused by any UI until now.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `trip-plan-cost-form`: `TripPlan` gains 7 new cost/revenue column triples (`luongName`+`luongAmount`+`shdLuong`, and likewise for `cuoc`, `doanhThu`, `phuThu`, `chiPhi`, `tienDau`, `neoXe`); the create/edit form's cost section gains 7 new `CostSlotInput` cells (select-or-type name + amount + SHĐ) appended after CẦU ĐƯỜNG.
- `trip-plan-excel-export`: 7 `*Amount` columns (already present) each gain an adjacent SHĐ column; a new TRẠNG THÁI column is added after KHÁCH HÀNG. `*Name` remains unexported.
- `trip-plan-excel-import`: the 7 new SHĐ columns and the new TRẠNG THÁI column are parsed via header-text matching; SHĐ is included in the changed-record diff on create/update, status only on update.
- `trip-plan-crud`: the trip plans list table gains 7 new SHĐ columns (amount columns already added); `POST /trip-plans` accepts and `GET /trip-plans` returns the 7 `*Amount`, 7 `*Name`, and 7 `shd*` fields.

## Impact

- `packages/db/prisma/schema.prisma` (`TripPlan` model — 7 `Decimal(15,2)` columns already migrated; 14 new nullable `String` columns — 7 `*Name` + 7 `shd*` — to add; new migration required)
- `apps/api/src/modules/trip-plan/dto/create-trip-plan.dto.ts`, `update-trip-plan.dto.ts` (add 7 `*Name` + 7 `shd*` optional string fields)
- `apps/api/src/modules/trip-plan/trip-plan.service.ts` (`create`, `update` — persist the 7 `*Name` and 7 `shd*` fields)
- `packages/shared/src/index.ts` (shared DTO/TripPlan TS interfaces gain the 7 `*Name` + 7 `shd*` fields; new `TRIP_STATUS_LABELS` map + reverse lookup)
- `apps/web/src/app/(authenticated)/trip-plans/page.tsx` (`TripPlanRow` type gains 7 `*Name` + 7 `shd*` fields; swap the 7 `ExtraCostInput` cells for `CostSlotInput` with `hasShd={true}`; wire `*Name`/`shd*` into create/edit submit payloads and edit-form pre-fill; list table gains 7 SHĐ columns)
- `apps/api/src/modules/export/builders/kehoach-xe.builder.ts` (7 new SHĐ columns; new TRẠNG THÁI column after KHÁCH HÀNG; `HEADERS`/`COL_WIDTHS`/data-row updated)
- `apps/api/src/modules/import/parsers/kehoach-xe.parser.ts` (7 new SHĐ candidates + fields; new TRẠNG THÁI candidate + reverse-label parsing + per-row warning for unrecognized status text)
- `apps/api/src/modules/import/import.service.ts` (`importTripPlans` — persist 7 `shd*` fields on create/update; persist `status` on update only)
- **Database migration required**: add 14 new nullable `String` columns to `trip_plans` (`luong_name`, `cuoc_name`, `doanh_thu_name`, `phu_thu_name`, `chi_phi_name`, `tien_dau_name`, `neo_xe_name`, `shd_luong`, `shd_cuoc`, `shd_doanh_thu`, `shd_phu_thu`, `shd_chi_phi`, `shd_tien_dau`, `shd_neo_xe`).
- Builds on top of the already-implemented `*Amount` half of this same change (committed `7edb4af`, code-complete) — this revision adds the `*Name`/`shd*`/status pieces on top rather than reworking the `*Amount` machinery.
