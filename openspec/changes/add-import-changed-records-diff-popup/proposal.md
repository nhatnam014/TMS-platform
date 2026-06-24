## Why

The "kế hoạch xe" (trip plan) Excel import already reports which existing records were changed by a re-import (field-level diff, audit log per record, `changedRecords` in the API response, shown via a collapsible list in the import UI). The other two Excel import flows — "quản lý xe" (vehicle records, `importVehicles`) and "bảo dưỡng xe" (vehicle maintenance, `importVehicleMaintenance`) — only return aggregate `imported`/`updated` counts with no detail on which fields actually changed, and write only a single aggregate audit log entry for the whole import run instead of one per changed record. Admins re-importing edited vehicle or maintenance sheets currently have no way to see what was actually updated.

Additionally, both of those flows have nested child data not yet covered by the existing `trip-plan-excel-import` diff pattern (which deliberately excludes the trip plan's own nested "other costs"): vehicle records have a `moocs` (rơ-moóc) sub-list with their own expiry dates, and vehicle maintenance records have a `kmRounds` (KM CÒN DƯỠNG LẦN N) sub-list. These need their own field-level diff so a changed mooc expiry date or a changed maintenance-round KM value is visible too.

Finally, now that three import flows will report detailed changed-field data, the current collapsible `<details>` list (designed for kế hoạch xe's import UI) doesn't scale well to a denser, multi-field, multi-record list — a popup table is needed for readability across all three flows.

## What Changes

- Generalize the diff helper currently named `diffTripPlanFields` (in `apps/api/src/modules/import/import.service.ts`) into a generic `diffFields(before, after)` usable by all three import flows; rename `ImportChangedRecord.tripPlanId` to a generic `entityId` in `packages/shared/src/index.ts`.
- Add field-level diffing + per-record Audit Log entries + `changedRecords` reporting to `importVehicles` (`apps/api/src/modules/import/import.service.ts`):
  - Diff the 8 scalar `VehicleRecord` fields (`tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, `hanCaVet`, `ghiChu`) before/after `vehicleRecord.update`.
  - Diff each mooc's 3 expiry fields before/after `upsertMooc`, reported as `mooc[<soMooc>].hanDangKiem` / `.hanBaoHiem` / `.hanCaVet`, merged into the same `changedRecords` entry as the parent vehicle record (not a separate entry).
  - Only newly-created vehicle records or moocs are excluded from diffing (matches the existing "new record is not included in changedRecords" rule from trip-plan import).
- Add the same diffing + audit + reporting to `importVehicleMaintenance`:
  - Diff the 8 scalar `VehicleRecord` fields used by that flow (`bienSo`, `tenTaiXe`, `sdt`, `loaiXe`, `donViSuaChua`, `ngayLam`, `kmHienTai`, `ghiChuBaoDuong`).
  - Diff each km round's `kmCon` before/after `vehicleMaintenanceKmRound.upsert`, reported as `kmRounds[Lần <roundNumber>].kmCon`, merged into the same `changedRecords` entry as the parent vehicle record.
- Replace the collapsible `<details>` changed-records section in `apps/web/src/app/(authenticated)/import-export/page.tsx`'s `ImportResultDisplay` with a clickable summary line that opens a modal popup containing a table: one row per changed record (identifier + a compact list of `field: old → new` lines in a single cell). This popup component is shared across all three `UploadSection` instances (trip-plans, vehicles, vehicle-maintenance) since they all render through the same `ImportResultDisplay`. Warnings/errors keep their existing `<details>` presentation — unchanged.
- **BREAKING** (internal type only, no runtime/API behavior change): `ImportChangedRecord.tripPlanId` is renamed to `entityId`; any code referencing the old field name must be updated (currently only `import.service.ts` and `import-export/page.tsx`, both updated as part of this change).

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `vehicle-excel-import`: `importVehicles` now diffs changed fields (including mooc sub-records) on update, writes a per-record Audit Log entry when something actually changed, returns `changedRecords` in the response, and the import UI shows those changes via a popup table.
- `vehicle-maintenance-excel-import`: `importVehicleMaintenance` now diffs changed fields (including km-round sub-records) on update, writes a per-record Audit Log entry when something actually changed, returns `changedRecords` in the response, and the import UI shows those changes via a popup table. (Note: this capability does not yet exist as an archived spec — it is still mid-flight in the in-progress `vehicle-maintenance` change. This change documents its own delta directly; when `vehicle-maintenance` archives, the two deltas should be reconciled into one capability spec.)
- `trip-plan-excel-import`: no spec delta in this change. Its backend diffing logic is unchanged, and its `changedRecords` capability is itself still mid-flight in the in-progress `fix-import-ke-hoach-xe-cost-fields` change (not yet archived). The popup UI work is implemented once in the shared `ImportResultDisplay` component (see Impact) and automatically covers the trip-plan import flow too — `fix-import-ke-hoach-xe-cost-fields`'s own spec delta (which currently describes a collapsible list) should be updated to describe the popup when that change is finalized; tracked as a task in this change.

## Impact

- `apps/api/src/modules/import/import.service.ts` (`importVehicles`, `importVehicleMaintenance`, shared `diffFields` helper, `upsertMooc`)
- `packages/shared/src/index.ts` (`ImportChangedRecord.entityId` rename)
- `apps/web/src/app/(authenticated)/import-export/page.tsx` (`ImportResultDisplay`, new changed-records popup component)
- No database schema changes
- No change to `importTripPlans`'s diffing logic itself, only the shared helper's name and the shared UI's presentation
