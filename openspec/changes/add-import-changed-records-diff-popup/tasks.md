## 1. Shared diff helper and types — import.service.ts, packages/shared

- [x] 1.1 Rename `diffTripPlanFields` to `diffFields(before: Record<string, unknown>, after: Record<string, unknown>): ImportChangedField[]` in `apps/api/src/modules/import/import.service.ts`; update its single call site in `importTripPlans`
- [x] 1.2 In `packages/shared/src/index.ts`, rename `ImportChangedRecord.tripPlanId` to `entityId`; update the one call site in `import.service.ts` that sets it (`importTripPlans`)
- [x] 1.3 Rebuild `packages/shared` (`pnpm run build` via tsup) so `apps/api`/`apps/web` see the renamed field
- [x] 1.4 Search `apps/web` for any reference to `tripPlanId` on a `changedRecords`/`ImportChangedRecord` value and update to `entityId` if found

## 2. Vehicle records (quản lý xe) diffing — import.service.ts

- [x] 2.1 In `importVehicles`'s update branch (row.id present), before `this.prisma.vehicleRecord.update`, fetch the existing `VehicleRecord` via `findUnique({ where: { id: row.id } })`
- [x] 2.2 After fetching, call `diffFields` comparing the existing record's `tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, `hanCaVet`, `ghiChu` against the incoming `vehicleData` object
- [x] 2.3 Change `upsertMooc`'s return type from `Promise<void>` to `Promise<ImportChangedField[]>`: when an existing mooc is found, diff its `hanDangKiem`/`hanBaoHiem`/`hanCaVet` against the incoming `dates` object (using `diffFields`, then remapping each resulting field name to `mooc[<soMooc>].<field>`) before writing the update; return `[]` when creating a new mooc
- [x] 2.4 Update both `upsertMooc` call sites (record-update branch and `mooc_continuation` branch) to capture the returned diff array and merge it into the current row's pending changes list
- [x] 2.5 After the scalar diff (2.2) and mooc diff (2.3/2.4) are both available for a row, if the combined changes list is non-empty: write an Audit Log entry (`action: "UPDATE"`, `entityType: "VehicleRecord"`, `entityId: row.id`, `beforeSnapshot`/`afterSnapshot` built from the combined changes) and push one entry to a `changedRecords: ImportChangedRecord[]` array (`rowNum`, identifier from `bienSo`/`tenTaiXe`, `entityId: row.id`, `changes`)
- [x] 2.6 Do not diff or audit-log newly-created VehicleRecord or VehicleRecordMooc rows (create branch and the mooc creation paths)
- [x] 2.7 Add `changedRecords?: ImportChangedRecord[]` to `importVehicles`'s returned `ImportResult` (present only when non-empty, matching the convention used by `importTripPlans`)

## 3. Vehicle maintenance (bảo dưỡng xe) diffing — import.service.ts

- [x] 3.1 In `importVehicleMaintenance`'s update branch (row.id present), the existing record is already fetched via `findUnique` before `vehicleRecord.update` — use that fetched value to call `diffFields` against the conditional update-data object (`bienSo`, `tenTaiXe`, `sdt`, `loaiXe`, `donViSuaChua`, `ngayLam`, `kmHienTai`, `ghiChuBaoDuong`), accounting for the `!== undefined` conditional-spread pattern (only diff fields actually present in the update data)
- [x] 3.2 Before each `this.prisma.vehicleMaintenanceKmRound.upsert` call in the km-rounds loop, add a `findUnique({ where: { vehicleRecordId_roundNumber: { vehicleRecordId, roundNumber: kmRound.roundNumber } } })`; if found, diff its `kmCon` against `kmRound.kmCon` and, if different, record a change with field name `kmRounds[Lần <roundNumber>].kmCon`
- [x] 3.3 Skip the km-round diff entirely when no existing row is found (new round — not included in changedRecords)
- [x] 3.4 After processing the scalar diff (3.1) and all km-round diffs (3.2) for a row, if the combined changes list is non-empty: write an Audit Log entry (`action: "UPDATE"`, `entityType: "VehicleRecord"`, `entityId: vehicleRecordId`, `beforeSnapshot`/`afterSnapshot` from the combined changes) and push one entry to a `changedRecords: ImportChangedRecord[]` array (`rowNum`, identifier from `bienSo`, `entityId: vehicleRecordId`, `changes`)
- [x] 3.5 Do not diff or audit-log newly-created VehicleRecord rows (create branch) or newly-created km-rounds
- [x] 3.6 Add `changedRecords?: ImportChangedRecord[]` to `importVehicleMaintenance`'s returned `ImportResult` (present only when non-empty)

## 4. Import UI popup — import-export/page.tsx

- [x] 4.1 Add a new `ChangedRecordsPopup` component modeled visually on the existing `LoaiXeExportPopup` (fixed-position overlay, centered card, header with × close button, scrollable body)
- [x] 4.2 Body renders a `<table>`: header row "Bản ghi" / "Thay đổi"; one `<tr>` per `changedRecords` entry; the "Thay đổi" cell lists each change as `field: oldValue → newValue` on its own line (handle `null`/`undefined` values the same way the current `<details>` rendering does, e.g. "—")
- [x] 4.3 In `ImportResultDisplay`, replace the existing changed-records `<details>` block with a clickable summary line (local `showPopup` state) that opens `ChangedRecordsPopup` when `result.changedRecords` is non-empty; render nothing when empty/absent
- [x] 4.4 Verify the same `ImportResultDisplay`/`ChangedRecordsPopup` rendering is reused unmodified by all three `UploadSection` instances (vehicles, trip-plans, vehicle-maintenance) — no per-flow special-casing needed since they all go through the same component
- [x] 4.5 Keep the warnings/errors `<details>` sections exactly as they are today — no changes

## 5. Cross-change coordination

- [x] 5.1 If `fix-import-ke-hoach-xe-cost-fields` has been archived to `openspec/specs/trip-plan-excel-import/spec.md` by the time this change is implemented, update that capability's "Import UI displays changed records after upload" scenario to describe the popup instead of the collapsible `<details>` list (so the archived spec matches the now-shared UI behavior). If it has not yet been archived, leave a note for whoever archives it next.

## 6. Verification

- [x] 6.1 `cd apps/api && pnpm exec tsc --noEmit` — confirm no type errors introduced
- [x] 6.2 `cd apps/web && pnpm exec tsc --noEmit` — confirm no type errors introduced
- [ ] 6.3 Manually export "quản lý xe", edit a vehicle field (e.g. `hanDangKiem`) and a mooc field for an existing row, reimport with `?confirm=true`, and confirm the popup shows both changes under one record entry with correct old/new values
- [ ] 6.4 Manually confirm reimporting an unmodified "quản lý xe" file produces no changed-records summary line
- [ ] 6.5 Manually export "bảo dưỡng xe", edit `kmHienTai` and one "KM CÒN DƯỠNG LẦN N" value for an existing row, reimport, and confirm the popup shows both changes under one record entry
- [ ] 6.6 Manually confirm reimporting an unmodified "bảo dưỡng xe" file produces no changed-records summary line
- [ ] 6.7 Manually confirm the kế hoạch xe import flow's changed-records summary line still opens the same popup (no regression from the shared-component change)
- [ ] 6.8 Manually confirm the Audit Log Viewer shows one entry per changed vehicle/maintenance record (not one per mooc/km-round) with the merged before/after snapshots
