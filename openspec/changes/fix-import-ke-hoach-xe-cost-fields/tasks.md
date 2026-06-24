## 1. Parser — kehoach-xe.parser.ts

- [x] 1.1 Add fixed-slot fields to `ParsedTripPlanRow`: `phiNangAmount?`, `shdNang?`, `phiHaAmount?`, `shdHa?`, `phiVeSinhAmount?`, `shdVeSinh?`, `phiCuocAmount?`, `veCongAmount?`, `shdVeCong?`, `chiPhiKhacAmount?`, `chiPhiTraiTuyenAmount?`, `cauDuongAmount?` (all `number | undefined`)
- [x] 1.2 Populate the new fields directly from `COL.PHI_NANG`/`COL.SHD_NANG`/etc. (existing `cellNum`/`cellText` helpers), removing these 8 cost types from the `COST_COLUMNS` loop that builds `costs: ParsedCostItem[]`
- [x] 1.3 Keep only "CHI PHÍ PHÁT SINH KHÁC" (`COL.CHI_PHI_PHAT_SINH`) in `COST_COLUMNS`/`costs[]` population
- [x] 1.4 Verify `documentSentDate` is still parsed from `COL.NGAY_GUI_CT` (already present — no change expected, just confirm)

## 2. Import service — import.service.ts (trip plans)

- [x] 2.1 Define `ImportChangedField { field: string; oldValue: unknown; newValue: unknown }` and `ImportChangedRecord { rowNum: number; identifier: string; tripPlanId: string; changes: ImportChangedField[] }` in `packages/shared/src/index.ts`, and add `changedRecords?: ImportChangedRecord[]` to `ImportResult`
- [x] 2.2 In `importTripPlans`'s UPDATE branch, before calling `tx.tripPlan.update`, fetch the existing `TripPlan` row's current values for all fields present in `tripPlanData` (core fields, 8 fixed-slot fields, `documentSentDate`, `tripNumber`)
- [x] 2.3 Add conditional spreads for the 8 fixed-slot fields and their `*Name` companions to the UPDATE data object (set name to the fixed Vietnamese label whenever the amount is present), following the `dto.xxx !== undefined` pattern used elsewhere
- [x] 2.4 In the UPDATE branch, include `tripNumber: row.tripNumber` via a conditional spread (`...(row.tripNumber !== undefined && { tripNumber: row.tripNumber })`) so STT updates `tripNumber`, but a blank STT cell does not null out an existing value — **kept as-is**, still correct under the revised design (Decision 3')
- [x] 2.5 In the UPDATE branch, add `documentSentDate` to the update data object (conditional spread, same pattern as `tripNumber`)
- [x] 2.6 After fetching the "before" values and building the "after" data object, diff them field-by-field; if any field differs, call `auditService.log({ action: "UPDATE", entityType: "TripPlan", entityId: row.id, beforeSnapshot, afterSnapshot }, tx)` and push a `changedRecords` entry (`rowNum`, an identifier built from vehicle plate + trip date or tripNumber, `tripPlanId`, the list of changed fields)
- [x] 2.7 In `importTripPlans`'s CREATE branch (`tx.tripPlan.create`), add the 8 fixed-slot fields + `*Name` companions, `documentSentDate`, and `tripNumber: row.tripNumber ?? null` to the create data object
- [x] 2.7b **REVERT**: the CREATE branch currently ignores `row.tripNumber` and computes `tripNumber = (max(TripPlan.tripNumber) ?? 0) + 1` (added by the now-superseded Decision 7). Remove the `tx.tripPlan.aggregate({ _max: { tripNumber: true } })` lookup and go back to writing `tripNumber: row.tripNumber ?? null` verbatim (same as task 2.7 originally specified) — STT is never auto-incremented (Decision 3')
- [x] 2.8 Confirm the "other costs" delete+recreate logic (`tx.tripPlanCost.deleteMany` + create from `row.costs`) is unchanged and now only ever receives the single "CHI PHÍ PHÁT SINH KHÁC" entry; this column stays out of the changed-record diff
- [x] 2.9 Return `changedRecords` in the final `ImportResult` (omit the key entirely, or return `[]`, when no rows changed — match existing `warnings`/`errors` array conventions)
- [x] 2.10 In the UPDATE branch, set `listSortedAt: new Date()` (or rely on the DB's `now()` default via a raw `updateMany`/explicit value — pick whichever fits the existing `tx.tripPlan.update` call) unconditionally, even when the field-diff finds no changes — every row touched by an import run should re-enter the "recent batch" ordering (Decision 5', 8)
- [x] 2.11 In the CREATE branch, set `listSortedAt: new Date()` on the create data object (or let the schema default apply — confirm Prisma's `@default(now())` fires on `create()` without an explicit value, and only set explicitly if relying on the default is insufficient for this code path)

## 3. Export builder — kehoach-xe.builder.ts

- [x] 3.1 Change the STT column value from `idx + 1` to `tp.tripNumber ?? (idx + 1)`

## 4. Trip plans default sort — trip-plan.service.ts

- [x] 4.1 **REVISE**: `findAll` currently has `const sortBy = pagination.sortBy ?? "tripNumber"` (from the now-superseded Decision 5) — change the default to `"listSortedAt"`
- [x] 4.2 **REVISE**: `findAll` currently has `const sortOrder = pagination.sortOrder ?? "asc"` — change the default to `"desc"`
- [x] 4.3 When the effective sort is the default (`listSortedAt`/no explicit `sortBy` from the caller), add `tripNumber asc` as a secondary `orderBy` clause (Prisma supports an array of `orderBy` objects) so rows from the same `listSortedAt` batch keep their Excel order; when the caller explicitly picks a different `sortBy`, do not add this secondary clause

## 4b. tripNumber on manual create — trip-plan.service.ts

- [x] 4b.1 **REVERT**: remove the `tx.tripPlan.aggregate({ _max: { tripNumber: true } })` auto-increment lookup added to `create()` by the now-superseded Decision 7
- [x] 4b.2 **REVERT**: remove `tripNumber` from the `data` object passed to `tx.tripPlan.create` in `create()` — manual creation via the UI form leaves `tripNumber` unset (`null`), since the form has no STT input
- [x] 4b.3 In `create()`, set `listSortedAt: new Date()` on the create data object (same reasoning as task 2.11 — a manually created trip should also appear at the top of the default-sorted list)

## 4c. Schema migration — listSortedAt

- [x] 4c.1 Add `listSortedAt DateTime @default(now()) @map("list_sorted_at")` to the `TripPlan` model in `packages/db/prisma/schema.prisma`
- [x] 4c.2 Run `pnpm prisma migrate dev --name add_trip_plan_list_sorted_at` (or equivalent project migration command) inside `packages/db`; confirm the generated SQL is `ALTER TABLE trip_plans ADD COLUMN list_sorted_at TIMESTAMP NOT NULL DEFAULT now()` (additive, backfills existing rows to current time, no data loss)
- [x] 4c.3 Regenerate the Prisma client (`pnpm prisma generate` if not run automatically by `migrate dev`) and confirm `apps/api` type-checks against the new field

## 5. Import UI — import-export/page.tsx

- [x] 5.1 In `ImportResultDisplay`, render a new collapsible section (mirroring the existing warnings/errors sections) when `result.changedRecords` is non-empty: a toggle labeled with the count (e.g. "X bản ghi đã thay đổi (bấm để xem)"), expanding to a list of `{identifier}: {field} {oldValue} → {newValue}` lines per changed record
- [x] 5.2 Render nothing for this section when `changedRecords` is empty or undefined

## 6. Trip plans list UI — trip-plans/page.tsx

- [x] 6.1 Change the "STT" column cell (currently `{trip.tripNumber ?? "—"}`, ~line 1887) to render the row's display position instead: compute from the existing pagination state, e.g. `(currentPage - 1) * pageSize + rowIndex + 1`, using whatever pagination variables the page already tracks for its `.map()` over the current page's rows
- [x] 6.2 Confirm no other part of the page reads `trip.tripNumber` for display purposes (search/filter inputs are out of scope — only the rendered STT cell changes); leave `tripNumber` in the `TripPlanRow` interface since it's still part of the API response shape

## 7. Unify id-not-found → CREATE fallback across all three import flows — import.service.ts

- [x] 7.1 `importVehicles` (quanly-xe, "record" row branch): the code already does `findUnique({ where: { id: row.id } })` before `update` — change so that when `existing` is `null`, skip the `update` call and instead run the same `create` logic used for `!row.id` rows (extract/reuse the create branch so both paths share it), and push a warning: `` `Hàng {row.rowNum}: ID "{row.id}" không tồn tại — đã tạo mới` ``
- [x] 7.2 `importTripPlans` (kehoach-xe, inside the `$transaction`): change `if (row.id)` handling so it first does `tx.tripPlan.findUnique({ where: { id: row.id } })`; if found, proceed with the existing UPDATE branch (using this same fetched row as `before`, no second fetch); if not found, fall through to the CREATE branch (treat as if `row.id` were absent) and push a warning: `` `Hàng {row.rowNum}: ID "{row.id}" không tồn tại — đã tạo mới` `` to the existing `errors`/`warnings` array (use `warnings`, not `errors`, since this is now expected/handled behavior)
- [x] 7.3 `importVehicleMaintenance` (baoduong-xe): currently on `!existing` it pushes a warning and `continue`s (skipping the row entirely, including its `kmRounds`). Change to fall through into the existing CREATE branch (the `else` block that builds `newRecord`) instead of `continue`, keeping a warning with the same "đã tạo mới" wording instead of "bỏ qua"
- [x] 7.4 Confirm in all three flows that the fallback CREATE path never reuses the stale `id` value from the Excel cell — the new record always gets Prisma's auto-generated `id` (`@default(cuid())`)

## 8. Verification

- [x] 8.1 `cd apps/api && pnpm exec tsc --noEmit` — confirm no type errors introduced
- [x] 8.2 `cd apps/web && pnpm exec tsc --noEmit` — confirm no type errors introduced
- [ ] 8.3 Manually export "kế hoạch xe", edit PHÍ NÂNG/SHĐ NÂNG (and one other fixed-slot column) for an existing row, reimport, and confirm the trip plan's edit form now shows the updated value (not the old one)
- [ ] 8.4 Manually confirm exporting writes the real `tripNumber` as STT (not row position) for rows that have one
- [ ] 8.5 Manually confirm editing "NGÀY GỬI CT" in the exported file and reimporting updates `documentSentDate` on the trip plan
- [ ] 8.6 Manually confirm "CHI PHÍ PHÁT SINH KHÁC" still round-trips correctly (export shows sum, reimport replaces with a single TripPlanCost row) and no regression in this column
- [ ] 8.7 Manually confirm re-importing a file with one edited row shows exactly one entry in the import UI's changed-records section, with the correct field/old/new values, and that the Audit Log Viewer shows a matching entry for that TripPlan
- [ ] 8.8 Manually confirm re-importing an untouched exported file still bumps those rows to the top of the default-sorted list (since `listSortedAt` updates unconditionally on import-touch) even though no Audit Log entry / changed-record entry is produced
- [ ] 8.9 Manually confirm the trip plans list defaults to: most-recently-imported (or created) batch first, and within that batch, rows ordered by their STT value ascending — import two different files (or the same file twice on different rows) and verify the most recent one's rows appear first as a contiguous group
- [ ] 8.10 Manually confirm editing a single field through the trip plan edit form (not import) does NOT move that row to the top of the default-sorted list
- [ ] 8.11 Manually confirm creating a new trip plan via the "Tạo chuyến" UI form puts it at the top of the default-sorted list, and its STT cell on the list page shows its display position (not a stored tripNumber, which is `null` for this row)
- [ ] 8.12 Manually confirm the trip plans list's "STT" column always shows a contiguous 1..N sequence based on display position across pages (e.g. page 2 starts at `pageSize + 1`), regardless of the underlying `tripNumber` values
- [ ] 8.13 Manually confirm importing "quản lý xe" (vehicle records) with a row whose `id` cell doesn't match any existing record creates a new record and shows a warning, instead of failing the row
- [ ] 8.14 Manually confirm importing "bảo dưỡng xe" (vehicle maintenance) with a row whose `id` cell doesn't match any existing record creates a new record (including its `kmRounds`) and shows a warning, instead of skipping the row
- [ ] 8.15 Manually confirm all three import flows still behave unchanged for rows with no `id` cell at all (always create) and rows with a valid, existing `id` (always update)
