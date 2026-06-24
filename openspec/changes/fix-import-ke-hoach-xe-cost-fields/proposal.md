## Why

A customer reported that editing the fixed cost columns (PHÍ NÂNG, PHÍ HẠ, PHÍ VỆ SINH, PHÍ CƯỢC, VÉ CỔNG, CHI PHÍ KHÁC/PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN, CẦU ĐƯỜNG) in an Excel file exported from the system, then re-importing that file against existing trip plans (rows with an ID), does not actually update the displayed/exported values.

Root cause: `TripPlanService` (used by the web UI's create/update forms) and the export builder (`kehoach-xe.builder.ts`) both read/write these 8 cost columns as dedicated scalar fields directly on `TripPlan` (`phiNangAmount`, `shdNang`, `phiHaAmount`, `shdHa`, `phiVeSinhAmount`, `shdVeSinh`, `phiCuocAmount`, `veCongAmount`, `shdVeCong`, `chiPhiKhacAmount`, `chiPhiTraiTuyenAmount`, `cauDuongAmount`) — this became the canonical model after `trip-plan-refactor`. However, the import path (`import.service.ts` + `kehoach-xe.parser.ts`) still follows the pre-refactor model: it routes all of these columns into generic `TripPlanCost` rows (deleting and recreating them), never touching the dedicated `TripPlan` columns. As a result, imported edits to these columns are silently discarded from the perspective of the UI and any subsequent export.

While investigating, two related defects in the same import path were found:
- The "STT" column is re-imported into `TripPlan.tripNumber`, but on export STT is just the row's position in the sheet (`idx + 1`), not the real `tripNumber` value. Re-importing any exported file silently corrupts `tripNumber` on every existing row.
- The "NGÀY GỬI CT" column is parsed into `documentSentDate` by the parser but `import.service.ts` never includes it when creating or updating a `TripPlan`, so this field can never be set via import.

All three defects live in the same `importTripPlans` flow and are being fixed together to avoid re-touching this code path multiple times.

Additionally, several follow-up requirements were raised for the same area. The STT/`tripNumber` design went through two revisions during exploration — see `design.md` Decisions 3'/5'/7'/8/9 for the full history; only the **current (final)** behavior is summarized below:

- The import flow surfaces which existing records were actually changed by an import: each updated `TripPlan` row gets its own Audit Log entry (with before/after snapshots), and the import API response includes a summary of changed records so the import UI can display it immediately after upload.
- `tripNumber` is **not** a global auto-incrementing sequence. It stores the raw STT value from the Excel file verbatim on both create and update via import, with no uniqueness/ordering guarantee across different files. The "STT" column shown in the trip plans UI list is computed from the row's position in the rendered (paginated) list — a frontend-only value, decoupled from the stored `tripNumber`.
- Default sort for the trip plans list is "most recently imported/created batch first, original Excel row order within a batch": a new `TripPlan.listSortedAt` timestamp column is set on every create (UI form or import) and on every row touched by an import run (regardless of whether any field actually changed), but is **not** touched by a plain UI edit (the edit form's `update()`). Default sort: `listSortedAt desc, tripNumber asc`.
- All three Excel import flows (`importVehicles` for "quản lý xe", `importTripPlans` for "kế hoạch xe", `importVehicleMaintenance` for "bảo dưỡng xe") now handle a row whose `id` cell doesn't match any existing record the same way: ignore the stale `id`, CREATE a new record (fresh auto-generated `id`, same as a row with no `id` cell), and add a warning noting the fallback (`ID "{id}" không tồn tại — đã tạo mới`). Previously `importVehicles`/`importTripPlans` errored on that row and `importVehicleMaintenance` silently skipped it.

## What Changes

- Update `importTripPlans` (`apps/api/src/modules/import/import.service.ts`) to write the 8 fixed cost columns directly onto the matching `TripPlan` scalar fields (`phiNangAmount`/`shdNang`/etc.) for both the create and update branches, instead of creating generic `TripPlanCost` rows for them.
- Keep "CHI PHÍ PHÁT SINH KHÁC" routed through `TripPlanCost` (via the existing delete+recreate `otherCosts` pattern) — this column is correctly modeled as ad-hoc/aggregatable cost entries and matches current export/UI behavior.
- Update `kehoach-xe.parser.ts`'s `ParsedTripPlanRow` so the 8 fixed cost columns are exposed as direct fields (amount + name + invoice number where applicable) rather than generic `ParsedCostItem` entries.
- Write the imported "STT" value into `TripPlan.tripNumber` verbatim on **both create and update** — no auto-increment, no "ignore STT on create" rule. STT/`tripNumber` is purely a same-import-batch ordering hint now (see `listSortedAt` below), not a global sequence.
- Add `TripPlan.listSortedAt` (`DateTime`, default `now()`, migration required): set to `now()` on every create (`trip-plan.service.ts create()` and `import.service.ts`'s create branch) and on every row touched by `importTripPlans`'s update branch (unconditionally, even when no field changed) — but **not** touched by the UI edit form's `update()`.
- Update `kehoach-xe.builder.ts` (export) so the "STT" column writes `tp.tripNumber` (falling back to the row's position only when `tripNumber` is `null`), instead of always writing the row's position.
- Add `documentSentDate` to the create/update data objects in `importTripPlans` so the "NGÀY GỬI CT" column round-trips correctly.
- Change the default sort for `GET /trip-plans` from `tripDate desc` to `listSortedAt desc, tripNumber asc` (`trip-plan.service.ts findAll`); the trip plans list page picks this up automatically since it doesn't currently send an explicit `sortBy`.
- Update the trip plans list page (`trip-plans/page.tsx`) so the "STT" column renders the row's display position (computed from pagination offset + index) instead of `trip.tripNumber` directly from the API.
- Before updating an existing `TripPlan` during import, read its current field values, diff them against the incoming row, and: (a) write an individual Audit Log entry (`action: "UPDATE"`, `entityType: "TripPlan"`, `entityId`, `beforeSnapshot`, `afterSnapshot`) only when at least one field actually changed, and (b) include a `changedRecords` summary (row number, identifying info, list of changed fields with old/new values) in the `ImportResult` returned to the client.
- Extend the shared `ImportResult` type (`packages/shared/src/index.ts`) with an optional `changedRecords` array, and update the import UI (`apps/web/src/app/(authenticated)/import-export/page.tsx`'s `ImportResultDisplay`) to render this list when present.
- Unify "id cell present but not found in DB" handling across all three import flows (`importVehicles`, `importTripPlans`, `importVehicleMaintenance`): fall back to CREATE (fresh auto-generated `id`) with a warning, instead of erroring (`importVehicles`/`importTripPlans` today) or silently skipping (`importVehicleMaintenance` today).
- **BREAKING** (data semantics only, no API shape change for existing fields): re-importing a previously exported "kế hoạch xe" file against existing trip plans will now actually update the 8 fixed cost fields, where previously they silently didn't update. The trip plans list's default sort and the meaning of `tripNumber` also change as described above. Any external scripts or saved files relying on the old (no-op for costs) behavior, or assuming `id`-not-found rows error/skip, will see a behavior change.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `trip-plan-excel-import`: cost column mapping for the 8 fixed cost slots changes from "create generic TripPlanCost rows" to "write to dedicated TripPlan scalar fields"; STT is written verbatim into `tripNumber` on both create and update (no auto-increment); `documentSentDate` is now persisted; updates to existing rows are diffed and reported via `changedRecords` + per-record Audit Log entries; a row whose `id` isn't found falls back to CREATE with a warning instead of erroring.
- `trip-plan-excel-export`: STT column now writes the real `tripNumber` (falling back to row position when null) instead of always writing row position.
- `trip-plan-crud`: default sort order for `GET /trip-plans` changes from `tripDate desc` to `listSortedAt desc, tripNumber asc`; creating a trip plan via `POST /trip-plans` now sets `listSortedAt = now()`.
- `vehicle-record-excel-import` (quanly-xe): a row whose `id` isn't found falls back to CREATE with a warning instead of erroring.
- `vehicle-maintenance-excel-import` (baoduong-xe): a row whose `id` isn't found falls back to CREATE with a warning instead of being silently skipped.

## Impact

- `apps/api/src/modules/import/import.service.ts` (`importTripPlans`, `importVehicles`, `importVehicleMaintenance` — id-not-found fallback in all three; `listSortedAt`/`tripNumber` handling in `importTripPlans`)
- `apps/api/src/modules/import/parsers/kehoach-xe.parser.ts` (`ParsedTripPlanRow`, column mapping)
- `apps/api/src/modules/export/builders/kehoach-xe.builder.ts` (STT column source)
- `apps/api/src/modules/trip-plan/trip-plan.service.ts` (`findAll` default sort, `create()` sets `listSortedAt`)
- `packages/shared/src/index.ts` (`ImportResult.changedRecords`)
- `apps/web/src/app/(authenticated)/import-export/page.tsx` (`ImportResultDisplay` renders changed records)
- `apps/web/src/app/(authenticated)/trip-plans/page.tsx` (STT column renders computed display position instead of `tripNumber`)
- **Database migration required**: add `TripPlan.listSortedAt` (`DateTime`, default `now()`). The dedicated cost columns already exist from `trip-plan-refactor`; `tripNumber` keeps its existing nullable shape.
- Note: `openspec/specs/trip-plan-excel-export/spec.md` also still documents the pre-refactor "read from TripPlanCost" model for cost columns even though the actual export code already reads from the fixed-slot fields. This is a pre-existing documentation drift, out of scope for this change, but worth a follow-up doc-only correction.
