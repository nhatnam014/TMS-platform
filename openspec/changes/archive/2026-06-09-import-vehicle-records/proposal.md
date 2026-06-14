## Why

The Excel import endpoint (`POST /api/v1/import/vehicles`) currently inserts into the legacy `Vehicle`, `Driver`, and `Trailer` models, but the business has migrated the primary vehicle-management flow to the `VehicleRecord` + `VehicleRecordMooc` model. Importing from the "TMS template - VIET CODE.xlsx" Excel file currently fails with HTTP 500 because the service logic targets the old normalized schema rather than the flat `VehicleRecord` schema that the rest of the UI now reads from.

## What Changes

- Rewrite `importVehicles()` in `ImportService` to INSERT rows into `VehicleRecord` and `VehicleRecordMooc` (no upsert / no unique constraint checks — each import run creates new records).
- Update `quanly-xe.parser.ts` to extract two new date columns: **Hạn cà vẹt** (vehicle) and **Hạn cà vẹt** (mooc), mapping them to `hanCaVet` on each entity.
- Change row validation: only check that required columns are present in the sheet header; do **not** enforce any uniqueness constraints on property values.
- Continuation rows (empty STT, non-empty Số Mooc) are added as `VehicleRecordMooc` entries on the most recently created `VehicleRecord`.
- No changes to the API endpoint path, HTTP method, or multipart field name — frontend import-export page is unaffected.
- Remove the `RolesGuard` dependency from `ImportController` (or keep it — not in scope; endpoint auth stays as-is).

## Capabilities

### New Capabilities

_(none — this change rewires an existing endpoint, it does not introduce a new capability)_

### Modified Capabilities

- `vehicle-excel-import`: Target model changes from `Vehicle`/`Driver`/`Trailer` (upsert) to `VehicleRecord`/`VehicleRecordMooc` (insert-only). Parser gains `hanCaVet` extraction for both vehicle and mooc rows. Row validation rule changes from uniqueness-based upsert to column-presence check only.

## Impact

- **`apps/api/src/modules/import/import.service.ts`** — `importVehicles()` method fully rewritten
- **`apps/api/src/modules/import/parsers/quanly-xe.parser.ts`** — parser updated; new `hanCaVet` columns; row type shape changes to match `VehicleRecord`
- **`apps/api/src/modules/import/import.controller.ts`** — no structural change; endpoint path/method unchanged
- **`apps/web/src/app/(authenticated)/import-export/page.tsx`** — no change needed
- **No schema migration required** — `VehicleRecord` and `VehicleRecordMooc` tables already exist
