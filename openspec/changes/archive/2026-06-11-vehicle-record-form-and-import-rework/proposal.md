## Why

The vehicle record create/edit form currently uses free-text inputs for driver and vehicle fields, making it easy to enter inconsistent or duplicate data. The Excel import also creates vehicle records blindly without checking whether the referenced driver or vehicle already exists in the database. This leads to data drift between the Driver/Vehicle master tables and the VehicleRecord entries.

## What Changes

- **Form — Driver selection**: Replace free-text `tenTaiXe` and `sdt` inputs with a searchable dropdown that fetches drivers from the existing Driver table; selecting a driver auto-fills and locks the two fields (read-only display, no inline editing).
- **Form — Vehicle selection**: Replace free-text `loaiXe`, `bienSo`, and the three date inputs with a searchable dropdown over the existing Vehicle table; selecting a vehicle auto-fills and locks all five fields.
- **Form re-selection UX**: Re-selecting from either dropdown overwrites the previous autofill; no separate clear button.
- **Import (quản lý xe) — Driver upsert**: Before creating a VehicleRecord, look up the driver by `(fullName, phone)` exact match; create a new Driver record if not found. No conflict detection for drivers.
- **Import (quản lý xe) — Vehicle conflict resolution**: If a parsed `bienSo` already exists in the Vehicle table and its fields differ, collect it as a conflict. After parsing all rows, return a conflict summary to the frontend. The user must confirm to proceed (applies all upserts) or cancel (aborts the entire import with no changes persisted).
- **VehicleRecord data model**: No changes — still stores denormalized text snapshot fields (`tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, dates).
- **No FK relationship** added between VehicleRecord and Driver/Vehicle.

## Capabilities

### New Capabilities

- `vehicle-record-driver-select`: Searchable driver dropdown on the vehicle record form that auto-fills and locks `tenTaiXe` + `sdt` from the Driver table.
- `vehicle-record-vehicle-select`: Searchable vehicle dropdown on the vehicle record form that auto-fills and locks `loaiXe`, `bienSo`, and three compliance date fields from the Vehicle table.
- `vehicle-record-import-conflict-review`: Two-phase Excel import for quản-lý-xe: Phase 1 parses and detects vehicle conflicts; Phase 2 shows a confirmation dialog listing diffs; user must confirm or cancel before any data is written.

### Modified Capabilities

- `vehicle-record-crud`: Driver and vehicle input sections change from free-text to DB-backed select + autofill (locked fields). Form submit payload remains unchanged.
- `vehicle-excel-import`: Import logic gains driver findOrCreate (by name+phone) and vehicle conflict detection with a two-phase confirm/cancel flow.

## Impact

- **Frontend**: `apps/web/src/app/(authenticated)/vehicle-records/page.tsx` — `RecordFormFields` component updated; import page gains conflict confirmation dialog.
- **Backend**: `apps/api/src/modules/import/import.service.ts` — `importVehicles()` gains driver upsert logic and vehicle conflict detection; new endpoint or query-param for conflict-aware import.
- **APIs consumed**: `GET /api/drivers` (already exists), `GET /api/vehicles` (already exists), `POST /api/import/vehicles` modified.
- **No schema migrations needed.**
