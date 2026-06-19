## Context

The TMS platform has a `VehicleRecord` model that tracks vehicle identity (plate, driver, expiry dates, moocs).
Customers maintain a separate Excel workbook ("Theo dõi bảo dưỡng xe") with one sheet per repair unit brand
(CHENGLONG, SHACMAN, etc.), recording maintenance events per vehicle over time.

There is currently no module for maintenance data. The existing patterns to follow are:
- `VehicleRecord` + `VehicleRecordMooc` for vehicle management (CRUD + import/export)
- `TripPlan` + `TripPlanCost` for trip management (CRUD + import/export)
- Import service at `apps/api/src/modules/import/`
- Export builders at `apps/api/src/modules/export/builders/`

## Goals / Non-Goals

**Goals:**
- New `VehicleMaintenanceRecord` entity with soft-link to `VehicleRecord`
- Full CRUD page at `/vehicle-maintenance` (table + modal form)
- Multi-sheet Excel import: sheet name → `loaiXe` (col F "ĐƠN VỊ SỬA CHỮA / LOẠI XE"); col G "ĐƠN VỊ SỬA CHỮA" → `donViSuaChua`; ID column → update existing rows
- Multi-sheet Excel export: one sheet per selected `loaiXe` value; export page shows dynamic unit selector
- Sidebar entry "Bảo dưỡng xe" immediately below "Quản lý xe"

**Non-Goals:**
- Hard FK enforcement between maintenance and vehicle records (nullable FK only)
- Automated maintenance alerts or notifications
- Linking maintenance records to trip plans

## Decisions

### D1 — Separate entity, not fields on VehicleRecord

Each vehicle has multiple maintenance events over time (1:N). The Excel shows 2 rows for 50E-54057,
2 rows for 50H-09453, etc. Adding fields to `VehicleRecord` would support only one event, destroying
history. A dedicated `VehicleMaintenanceRecord` model with a nullable FK to `VehicleRecord` is correct.

**Alternative considered**: Embed as JSON array on VehicleRecord → rejected; non-queryable, hard to paginate.

### D2 — Nullable FK + denormalized bienSo (same pattern as TripPlan.vehiclePlate)

`vehicleRecordId` is nullable. `bienSo`, `tenTaiXe`, `sdt` are stored as plain strings (snapshot at
import time). Import auto-matches `bienSo` against `VehicleRecord.bienSo`; sets FK if found, leaves null
otherwise. This allows maintenance records to exist without a corresponding VehicleRecord.

**Alternative considered**: Require VehicleRecord to exist → rejected; import would fail for plates not
yet in the system, creating unnecessary friction.

### D3 — Sheet name = loaiXe (import) and vice-versa (export)

Two distinct columns exist: col F "ĐƠN VỊ SỬA CHỮA / LOẠI XE" (`loaiXe`) is the vehicle brand
used as the sheet discriminator; col G "ĐƠN VỊ SỬA CHỮA" (`donViSuaChua`) is the repair shop name.

On import: `ws.name` (e.g., "CHENGLONG") sets `loaiXe` as default; col F overrides if non-empty;
col G is stored as `donViSuaChua` independently.
On export: records are grouped by `loaiXe`; each group becomes a worksheet named after the value.
This gives symmetric round-trip behaviour identical to the source Excel format.

### D4 — Export unit selector: multi-select checkboxes loaded from API

Export page fetches `GET /api/vehicle-maintenance/distinct-units` which returns the distinct
distinct `loaiXe` values currently in the database. User checks which units to export; the request becomes
`GET /api/export/vehicle-maintenance?units=CHENGLONG,SHACMAN`. If no units selected, all are exported.

### D5 — Computed fields on the frontend, not stored

`kmDaChay` (= soKmHienTai − soKmBaoDuong) and `kmCon` (= kiBaoDuongTiepTheo − soKmHienTai) are derived
in the React table and displayed with red colour when `kmCon ≤ 0`. These values are intentionally not
stored in the DB because they are pure functions of stored fields.

### D6 — ID column for round-trip update (same as vehicle-record and trip-plan imports)

Exported Excel includes an "ID" column (last, grey-styled). On re-import: rows with a valid ID → UPDATE
existing record; rows without ID or new rows added by the user → CREATE new record.

## Risks / Trade-offs

- [Stale denormalized data] If `VehicleRecord.tenTaiXe` is later corrected, the snapshot on maintenance records
  is not updated → Mitigation: display-only, clearly labelled; users can edit via the maintenance CRUD form.
- [Sheet name collision] If a user renames a sheet before re-importing, rows get a new `loaiXe` value
  instead of updating the existing one → Mitigation: the ID column handles identity; `loaiXe` is just
  metadata, not the primary key. New value is silently accepted.
- [Large exports] A workbook with many units and thousands of rows could be slow → Mitigation: cap export at
  10 000 rows per unit (same limit as trip-plan export); acceptable for current scale.

## Migration Plan

1. Add migration: `CREATE TABLE vehicle_maintenance_records (...)` with nullable FK to `vehicle_records`
2. Run `prisma migrate deploy` (no destructive changes to existing tables)
3. Deploy API with new module
4. Deploy web with new page + sidebar entry + import-export sections
5. Rollback: drop the new table; revert API + web (no data loss to existing tables)
