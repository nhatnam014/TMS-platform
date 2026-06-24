## 1. Parser — kehoach-xe.parser.ts

- [x] 1.1 Add fixed-slot fields to `ParsedTripPlanRow`: `phiNangAmount?`, `shdNang?`, `phiHaAmount?`, `shdHa?`, `phiVeSinhAmount?`, `shdVeSinh?`, `phiCuocAmount?`, `veCongAmount?`, `shdVeCong?`, `chiPhiKhacAmount?`, `chiPhiTraiTuyenAmount?`, `cauDuongAmount?` (all `number | undefined`)
- [x] 1.2 Populate the new fields directly from `COL.PHI_NANG`/`COL.SHD_NANG`/etc. (existing `cellNum`/`cellText` helpers), removing these 8 cost types from the `COST_COLUMNS` loop that builds `costs: ParsedCostItem[]`
- [x] 1.3 Keep only "CHI PHÍ PHÁT SINH KHÁC" (`COL.CHI_PHI_PHAT_SINH`) in `COST_COLUMNS`/`costs[]` population
- [x] 1.4 Verify `documentSentDate` is still parsed from `COL.NGAY_GUI_CT` (already present — no change expected, just confirm)

## 2. Import service — import.service.ts

- [x] 2.1 Define `ImportChangedField { field: string; oldValue: unknown; newValue: unknown }` and `ImportChangedRecord { rowNum: number; identifier: string; tripPlanId: string; changes: ImportChangedField[] }` in `packages/shared/src/index.ts`, and add `changedRecords?: ImportChangedRecord[]` to `ImportResult`
- [x] 2.2 In `importTripPlans`'s UPDATE branch, before calling `tx.tripPlan.update`, fetch the existing `TripPlan` row's current values for all fields present in `tripPlanData` (core fields, 8 fixed-slot fields, `documentSentDate`, `tripNumber`)
- [x] 2.3 Add conditional spreads for the 8 fixed-slot fields and their `*Name` companions to the UPDATE data object (set name to the fixed Vietnamese label whenever the amount is present), following the `dto.xxx !== undefined` pattern used elsewhere
- [x] 2.4 In the UPDATE branch, include `tripNumber: row.tripNumber` via a conditional spread (`...(row.tripNumber !== undefined && { tripNumber: row.tripNumber })`) so STT updates `tripNumber`, but a blank STT cell does not null out an existing value
- [x] 2.5 In the UPDATE branch, add `documentSentDate` to the update data object (conditional spread, same pattern as `tripNumber`)
- [x] 2.6 After fetching the "before" values and building the "after" data object, diff them field-by-field; if any field differs, call `auditService.log({ action: "UPDATE", entityType: "TripPlan", entityId: row.id, beforeSnapshot, afterSnapshot }, tx)` and push a `changedRecords` entry (`rowNum`, an identifier built from vehicle plate + trip date or tripNumber, `tripPlanId`, the list of changed fields)
- [x] 2.7 In `importTripPlans`'s CREATE branch (`tx.tripPlan.create`), add the 8 fixed-slot fields + `*Name` companions, `documentSentDate`, and `tripNumber: row.tripNumber ?? null` to the create data object
- [x] 2.7b Change the CREATE branch's `tripNumber` to ignore `row.tripNumber` (the STT cell) entirely; instead compute `tripNumber = (max(TripPlan.tripNumber) ?? 0) + 1` inside the same transaction, before `tx.tripPlan.create`
- [x] 2.8 Confirm the "other costs" delete+recreate logic (`tx.tripPlanCost.deleteMany` + create from `row.costs`) is unchanged and now only ever receives the single "CHI PHÍ PHÁT SINH KHÁC" entry; this column stays out of the changed-record diff
- [x] 2.9 Return `changedRecords` in the final `ImportResult` (omit the key entirely, or return `[]`, when no rows changed — match existing `warnings`/`errors` array conventions)

## 3. Export builder — kehoach-xe.builder.ts

- [x] 3.1 Change the STT column value from `idx + 1` to `tp.tripNumber ?? (idx + 1)`

## 4. Trip plans default sort — trip-plan.service.ts

- [x] 4.1 In `findAll`, change `const sortBy = pagination.sortBy ?? "tripDate"` to `const sortBy = pagination.sortBy ?? "tripNumber"`
- [x] 4.2 In `findAll`, change `const sortOrder = pagination.sortOrder ?? "desc"` to `const sortOrder = pagination.sortOrder ?? "asc"`

## 4b. Auto-assign tripNumber on create — trip-plan.service.ts

- [x] 4b.1 In `create()`, inside the existing `$transaction`, before `tx.tripPlan.create`, compute `const maxResult = await tx.tripPlan.aggregate({ _max: { tripNumber: true } })` and `const tripNumber = (maxResult._max.tripNumber ?? 0) + 1`
- [x] 4b.2 Add `tripNumber` to the `data` object passed to `tx.tripPlan.create`

## 5. Import UI — import-export/page.tsx

- [x] 5.1 In `ImportResultDisplay`, render a new collapsible section (mirroring the existing warnings/errors sections) when `result.changedRecords` is non-empty: a toggle labeled with the count (e.g. "X bản ghi đã thay đổi (bấm để xem)"), expanding to a list of `{identifier}: {field} {oldValue} → {newValue}` lines per changed record
- [x] 5.2 Render nothing for this section when `changedRecords` is empty or undefined

## 6. Verification

- [x] 6.1 `cd apps/api && pnpm exec tsc --noEmit` — confirm no type errors introduced
- [x] 6.2 `cd apps/web && pnpm exec tsc --noEmit` — confirm no type errors introduced
- [ ] 6.3 Manually export "kế hoạch xe", edit PHÍ NÂNG/SHĐ NÂNG (and one other fixed-slot column) for an existing row, reimport, and confirm the trip plan's edit form now shows the updated value (not the old one)
- [ ] 6.4 Manually confirm exporting writes the real `tripNumber` as STT (not row position) for rows that have one, and reimporting without editing STT leaves `tripNumber` unchanged
- [ ] 6.5 Manually confirm editing STT in the exported file and reimporting updates the existing row's `tripNumber` to the new value
- [ ] 6.6 Manually confirm editing "NGÀY GỬI CT" in the exported file and reimporting updates `documentSentDate` on the trip plan
- [ ] 6.7 Manually confirm "CHI PHÍ PHÁT SINH KHÁC" still round-trips correctly (export shows sum, reimport replaces with a single TripPlanCost row) and no regression in this column
- [ ] 6.8 Manually confirm the trip plans list page now sorts by STT ascending by default (no UI changes needed, verify via API response order)
- [ ] 6.9 Manually confirm re-importing a file with one edited row shows exactly one entry in the import UI's changed-records section, with the correct field/old/new values, and that the Audit Log Viewer shows a matching entry for that TripPlan
- [ ] 6.10 Manually confirm re-importing an untouched exported file produces an empty/absent changed-records section and no new Audit Log entries
