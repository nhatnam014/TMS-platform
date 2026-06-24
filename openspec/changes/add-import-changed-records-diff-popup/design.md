## Context

`apps/api/src/modules/import/import.service.ts` has three Excel import entry points: `importVehicles` (quản lý xe), `importTripPlans` (kế hoạch xe), `importVehicleMaintenance` (bảo dưỡng xe). Only `importTripPlans` currently does field-level diffing (see `diffTripPlanFields` at line ~19 and its usage at line ~282-306): before each `tx.tripPlan.update`, it fetches the existing row, diffs it against the incoming update data, and — only if something actually changed — writes a per-record Audit Log entry and appends to an in-memory `changedRecords: ImportChangedRecord[]` array returned as part of `ImportResult` (`packages/shared/src/index.ts`).

`importVehicles` and `importVehicleMaintenance` both support row-level create/update (matched by an `id` column from a previous export), but neither diffs anything — they just count `imported`/`updated` and write one aggregate audit log line per import run (e.g. `"Excel import: ${imported} tạo mới, ${updated} cập nhật, ${errors.length} lỗi"`).

Both flows also have nested per-row child data that isn't part of the parent record's own scalar fields:
- `importVehicles`: each row can carry one `soMooc` (rơ-moóc) with its own `hanDangKiem`/`hanBaoHiem`/`hanCaVet`, written via a private `upsertMooc(vehicleRecordId, soMooc, dates)` helper (find-by-`(vehicleRecordId, soMooc)`-then-update-or-create; no DB unique constraint on that pair, but that's a pre-existing schema gap, out of scope here).
- `importVehicleMaintenance`: each row can carry multiple `kmRounds: { roundNumber, kmCon }[]` (one per "KM CÒN DƯỠNG LẦN N" column), written via `tx`-less `vehicleMaintenanceKmRound.upsert` keyed on the real DB unique constraint `(vehicleRecordId, roundNumber)`.

The import UI (`apps/web/src/app/(authenticated)/import-export/page.tsx`) renders all three flows through one shared `ImportResultDisplay` component. Today only the trip-plan response ever populates `changedRecords`, shown as a collapsible `<details>` list (label, then a nested `<ul>` of `field: old → new` lines). The page already has a precedent for a true popup modal — `LoaiXeExportPopup` (fixed-position overlay, centered white card, header with × close button, scrollable body, footer action row) — which this change's new changed-records popup should visually match.

## Goals / Non-Goals

**Goals:**
- `importVehicles` and `importVehicleMaintenance` report per-record field changes the same way `importTripPlans` does: per-record Audit Log entry (only when something changed) + `changedRecords` in the response.
- Mooc-level and km-round-level changes are visible too, merged into their parent record's single `changedRecords` entry (not as separate top-level entries).
- The changed-records UI becomes a popup table, shared by all three import flows, replacing the collapsible list — readable even with many records/fields.
- Reuse the existing diff logic rather than triplicating it.

**Non-Goals:**
- Not adding a DB unique constraint on `(vehicleRecordId, soMooc)` — pre-existing gap, unrelated to diffing.
- Not changing `importTripPlans`'s own diff behavior or its "other costs" exclusion — only renaming the shared helper/type field it uses.
- Not wrapping `importVehicles`/`importVehicleMaintenance` in a `$transaction` per row if they aren't already — diffing only needs a `findUnique`/`findFirst` read before the existing write, no new transactional guarantee is being added beyond what each flow already has (or doesn't have) today.
- Not diffing warnings/errors presentation — those keep their existing `<details>` rendering, untouched.
- Not adding a generic "view audit history" page — the popup only shows what changed in *this* import run, sourced from the response, not from querying the Audit Log.

## Decisions

**1. Generalize `diffTripPlanFields` into `diffFields(before, after): ImportChangedField[]`, used identically by all three flows.**
The current implementation already has no TripPlan-specific logic (it just iterates `Object.keys(after)` and compares normalized values) — only the name is misleading. Rename in place, update the one call site in `importTripPlans`, add new call sites in `importVehicles`/`importVehicleMaintenance`.

**2. Rename `ImportChangedRecord.tripPlanId` → `entityId` in `packages/shared/src/index.ts`.**
The field is already entity-agnostic in spirit (it's just "the DB id of the thing that changed"); the literal name leaks the trip-plan-only origin. Two call sites to update: `import.service.ts` (sets it) and `import-export/page.tsx` (doesn't currently read it directly, only `tripPlanId` isn't rendered in the UI today — confirm during implementation and update if any reference exists).

**3. Mooc diffs and km-round diffs are computed as extra `ImportChangedField` entries with bracket-qualified field names, appended to the same record's `changes` array — not separate `changedRecords` entries.**
Format: `mooc[<soMooc>].hanDangKiem` / `.hanBaoHiem` / `.hanCaVet` for vehicle records; `kmRounds[Lần <roundNumber>].kmCon` for maintenance records. Rationale: a changed mooc or km-round is conceptually still "this vehicle record changed" from the admin's point of view — one row in the popup per Excel row being reviewed, not a fan-out into untraceable child rows. Alternative considered: separate `changedRecords` entries per mooc/km-round (e.g. `entityType: "VehicleRecordMooc"`). Rejected — `ImportChangedRecord` has no `entityType` field today and adding one is unnecessary complexity for a UI that already groups by the Excel row's identifier.

**4. Diffing happens immediately before each existing write, fetching only the fields being written (not the whole row blindly).**
For `importVehicles`: `findUnique({ where: { id: row.id } })` before `vehicleRecord.update`, diff against the existing `vehicleData` object (8 fields) — mirrors `importTripPlans`'s pattern exactly. For mooc: inside `upsertMooc`, when `existing` is found (the update branch), diff `existing`'s 3 date fields against the incoming `dates` object before writing; return the diff (or `null`) to the caller so it can be merged into that row's `changedRecords` entry. `upsertMooc`'s signature changes from `Promise<void>` to `Promise<ImportChangedField[]>` (always returns an array, empty when nothing changed or when creating new).
For `importVehicleMaintenance`: `findUnique` before `vehicleRecord.update` (8 fields, same conditional-spread pattern already in place). For km rounds: before each `vehicleMaintenanceKmRound.upsert`, do a `findUnique({ where: { vehicleRecordId_roundNumber: {...} } })`; if found, diff its `kmCon` against the incoming value.

**5. A changed record's audit log entry's `beforeSnapshot`/`afterSnapshot` include both scalar and nested (mooc/km-round) changes, keyed by the same bracket-qualified field names used in `changedRecords`.**
Keeps a single audit entry per record per import run (not one per mooc/round), consistent with decision 3.

**6. New popup component `ChangedRecordsPopup` replaces the changed-records `<details>` block inside `ImportResultDisplay`, used identically for all three `UploadSection` call sites.**
Visually modeled on the existing `LoaiXeExportPopup` (fixed overlay, centered card, header with × close, scrollable body). Body is a `<table>`: header row `Bản ghi | Thay đổi`; one `<tr>` per `changedRecords` entry; the "Thay đổi" cell renders each `change` as its own line (`field: oldValue → newValue`) via a `<div>`/`<br>` list inside the cell, not a nested table — keeps row height proportional to how much actually changed per record. The trigger becomes a clickable line (not `<details>`/`<summary>`) styled consistently with the other summary lines (e.g. background `#eff6ff`, text `#1d4ed8`) that sets `showPopup = true` in local state; warnings/errors keep their own `<details>` untouched.

## Risks / Trade-offs

- **[Risk]** `upsertMooc`'s signature change (`void` → `Promise<ImportChangedField[]>`) touches both its call sites in `importVehicles` (record branch and `mooc_continuation` branch). → **Mitigation**: both call sites already exist in a `for` loop with per-row try/catch; the caller just needs to merge the returned array into the current row's pending changes list before it's flushed into `changedRecords`. Small, mechanical change.
- **[Risk]** `importVehicleMaintenance` currently iterates `row.kmRounds` and calls `prisma.vehicleMaintenanceKmRound.upsert` directly (not through a helper) — adding a diff read before each upsert doubles the DB round-trips for that loop (one extra `findUnique` per round per row). → **Mitigation**: acceptable; maintenance sheets have a small, bounded number of rounds per vehicle (not a high-row-count hot path), and the existing trip-plan flow already does an equivalent extra read per row.
- **[Trade-off]** Bracket-qualified field names (`mooc[51C-12345].hanDangKiem`) are less machine-parseable than flat field names, but this data is only ever rendered to a human in the popup or stored as an audit snapshot key — no code currently parses `ImportChangedField.field` programmatically, so this is safe.
- **[Risk]** Mooc matching by `findFirst({ vehicleRecordId, soMooc })` with no unique constraint means if two mooc rows somehow share the same `soMooc` for one vehicle, the diff (and the update) would target whichever one `findFirst` returns first — a pre-existing data-integrity gap, not introduced by this change, and out of scope to fix here.

## Migration Plan

No DB migration needed — no schema changes. Deploy is a backend + frontend code change (`import.service.ts`, `packages/shared/src/index.ts`, `import-export/page.tsx`). Rebuild `packages/shared` (tsup) before type-checking `apps/api`/`apps/web`, same as the prior `fix-import-ke-hoach-xe-cost-fields` change. No rollback concerns beyond a standard commit revert.
