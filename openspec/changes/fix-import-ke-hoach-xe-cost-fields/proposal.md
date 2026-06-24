## Why

A customer reported that editing the fixed cost columns (PHÍ NÂNG, PHÍ HẠ, PHÍ VỆ SINH, PHÍ CƯỢC, VÉ CỔNG, CHI PHÍ KHÁC/PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN, CẦU ĐƯỜNG) in an Excel file exported from the system, then re-importing that file against existing trip plans (rows with an ID), does not actually update the displayed/exported values.

Root cause: `TripPlanService` (used by the web UI's create/update forms) and the export builder (`kehoach-xe.builder.ts`) both read/write these 8 cost columns as dedicated scalar fields directly on `TripPlan` (`phiNangAmount`, `shdNang`, `phiHaAmount`, `shdHa`, `phiVeSinhAmount`, `shdVeSinh`, `phiCuocAmount`, `veCongAmount`, `shdVeCong`, `chiPhiKhacAmount`, `chiPhiTraiTuyenAmount`, `cauDuongAmount`) — this became the canonical model after `trip-plan-refactor`. However, the import path (`import.service.ts` + `kehoach-xe.parser.ts`) still follows the pre-refactor model: it routes all of these columns into generic `TripPlanCost` rows (deleting and recreating them), never touching the dedicated `TripPlan` columns. As a result, imported edits to these columns are silently discarded from the perspective of the UI and any subsequent export.

While investigating, two related defects in the same import path were found:
- The "STT" column is re-imported into `TripPlan.tripNumber`, but on export STT is just the row's position in the sheet (`idx + 1`), not the real `tripNumber` value. Re-importing any exported file silently corrupts `tripNumber` on every existing row.
- The "NGÀY GỬI CT" column is parsed into `documentSentDate` by the parser but `import.service.ts` never includes it when creating or updating a `TripPlan`, so this field can never be set via import.

All three defects live in the same `importTripPlans` flow and are being fixed together to avoid re-touching this code path multiple times.

Additionally, three follow-up requirements were raised for the same area:
- The Excel "STT" column and `TripPlan.tripNumber` must stay consistent in both directions: export must write the real `tripNumber` (not the row's position in the sheet), and import must write `tripNumber` from STT on both create and update — so a round-trip (export → edit STT → re-import) reliably updates the ordering.
- The trip plans list page should default-sort by STT (`tripNumber`, ascending) instead of trip date, since STT is now the authoritative ordering field.
- The import flow should surface which existing records were actually changed by an import: each updated `TripPlan` row gets its own Audit Log entry (with before/after snapshots), and the import API response includes a summary of changed records so the import UI can display it immediately after upload.

## What Changes

- Update `importTripPlans` (`apps/api/src/modules/import/import.service.ts`) to write the 8 fixed cost columns directly onto the matching `TripPlan` scalar fields (`phiNangAmount`/`shdNang`/etc.) for both the create and update branches, instead of creating generic `TripPlanCost` rows for them.
- Keep "CHI PHÍ PHÁT SINH KHÁC" routed through `TripPlanCost` (via the existing delete+recreate `otherCosts` pattern) — this column is correctly modeled as ad-hoc/aggregatable cost entries and matches current export/UI behavior.
- Update `kehoach-xe.parser.ts`'s `ParsedTripPlanRow` so the 8 fixed cost columns are exposed as direct fields (amount + name + invoice number where applicable) rather than generic `ParsedCostItem` entries.
- Write the imported "STT" value into `TripPlan.tripNumber` on **update** of existing rows — STT and `tripNumber` stay a single synced value for rows that already exist.
- For **new** records with no `id` — a new row in an imported sheet, or a trip created via the UI's "Tạo chuyến" form — ignore any STT cell value and auto-assign `tripNumber = (max existing TripPlan.tripNumber ?? 0) + 1`. Apply this in both `trip-plan.service.ts create()` and `import.service.ts`'s create branch.
- Update `kehoach-xe.builder.ts` (export) so the "STT" column writes `tp.tripNumber` (falling back to the row's position only when `tripNumber` is `null`), instead of always writing the row's position.
- Add `documentSentDate` to the create/update data objects in `importTripPlans` so the "NGÀY GỬI CT" column round-trips correctly.
- Change the default sort for `GET /trip-plans` from `tripDate desc` to `tripNumber asc` (`trip-plan.service.ts findAll`); the trip plans list page picks this up automatically since it doesn't currently send an explicit `sortBy`.
- Before updating an existing `TripPlan` during import, read its current field values, diff them against the incoming row, and: (a) write an individual Audit Log entry (`action: "UPDATE"`, `entityType: "TripPlan"`, `entityId`, `beforeSnapshot`, `afterSnapshot`) only when at least one field actually changed, and (b) include a `changedRecords` summary (row number, identifying info, list of changed fields with old/new values) in the `ImportResult` returned to the client.
- Extend the shared `ImportResult` type (`packages/shared/src/index.ts`) with an optional `changedRecords` array, and update the import UI (`apps/web/src/app/(authenticated)/import-export/page.tsx`'s `ImportResultDisplay`) to render this list when present.
- **BREAKING** (data semantics only, no API shape change for existing fields): re-importing a previously exported "kế hoạch xe" file against existing trip plans will now actually update the 8 fixed cost fields and `tripNumber`, where previously cost fields silently didn't update and `tripNumber` was clobbered by row position. Any external scripts or saved files relying on the old (no-op for costs / position-based STT) behavior will see a behavior change.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `trip-plan-excel-import`: cost column mapping for the 8 fixed cost slots changes from "create generic TripPlanCost rows" to "write to dedicated TripPlan scalar fields"; STT now sets `tripNumber` on update of existing rows, and new rows always get an auto-incremented `tripNumber` (STT cell ignored for new rows); `documentSentDate` is now persisted; updates to existing rows are diffed and reported via `changedRecords` + per-record Audit Log entries.
- `trip-plan-excel-export`: STT column now writes the real `tripNumber` (falling back to row position when null) instead of always writing row position.
- `trip-plan-crud`: default sort order for `GET /trip-plans` changes from `tripDate desc` to `tripNumber asc`; creating a trip plan via `POST /trip-plans` now auto-assigns `tripNumber` instead of leaving it null.

## Impact

- `apps/api/src/modules/import/import.service.ts` (`importTripPlans`)
- `apps/api/src/modules/import/parsers/kehoach-xe.parser.ts` (`ParsedTripPlanRow`, column mapping)
- `apps/api/src/modules/export/builders/kehoach-xe.builder.ts` (STT column source)
- `apps/api/src/modules/trip-plan/trip-plan.service.ts` (`findAll` default sort)
- `packages/shared/src/index.ts` (`ImportResult.changedRecords`)
- `apps/web/src/app/(authenticated)/import-export/page.tsx` (`ImportResultDisplay` renders changed records)
- No database schema changes (the dedicated `TripPlan` columns already exist from `trip-plan-refactor`)
- No changes needed to `trip-plan.service.ts` update (UI form) — already uses the correct fixed-slot model; `create()` gets the new auto-increment `tripNumber` logic
- Note: `openspec/specs/trip-plan-excel-export/spec.md` also still documents the pre-refactor "read from TripPlanCost" model for cost columns even though the actual export code already reads from the fixed-slot fields. This is a pre-existing documentation drift, out of scope for this change, but worth a follow-up doc-only correction.
