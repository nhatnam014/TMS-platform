## Why

The current `vehicle_maintenance_records` table duplicates vehicle fields (bienSo, tenTaiXe, sdt, loaiXe) already stored in `vehicle_records`, has a nullable FK that enforces no real relationship, and uses three fixed km columns (`soKmBaoDuong`, `kiBaoDuongTiepTheo`, `soKmHienTai`) that cannot represent multiple maintenance rounds per vehicle. The business needs each vehicle to track N flexible maintenance km checkpoints that grow dynamically as service history accumulates.

## What Changes

- **BREAKING**: Drop `vehicle_maintenance_records` table; replace with `vehicle_maintenance_km_rounds` (dynamic per-vehicle km round records)
- Add `don_vi_sua_chua` (maintenance unit) and `ngay_lam` (most recent service date) columns to `vehicle_records`
- Rework `/vehicle-maintenance` page to be a view over `VehicleRecord` — all vehicles always appear; columns scale dynamically (minimum 4, expands to max km round N found in current pagination batch)
- Edit modal on the maintenance page targets only maintenance-relevant fields: `donViSuaChua`, `ngayLam`, and km rounds (add multiple at once, delete individual)
- Rework bảo dưỡng xe Excel export: source data from `VehicleRecord`; present popup for user to select which `loaiXe` values to include; each selected type = one sheet; km columns scale to max N rounds in group; ID column = `VehicleRecord.id`
- Rework bảo dưỡng xe Excel import: detect `KM CÒN ... LẦN{n}` header columns dynamically; if row has ID → update `VehicleRecord` + upsert km rounds; if no ID → create new `VehicleRecord` + create km rounds
- When any `VehicleRecord` is created (app form or quản lý xe import), it automatically appears on the bảo dưỡng xe page with null maintenance fields and 4 empty km columns

## Capabilities

### New Capabilities

- `vehicle-maintenance-km-rounds`: Dynamic km-round data model (`VehicleMaintenanceKmRound` table linked to `VehicleRecord`), API CRUD for km rounds per vehicle, and migration that drops the old maintenance records table
- `vehicle-maintenance-view-page`: Bảo dưỡng xe page as a view of `VehicleRecord` — dynamic km column scaling per pagination batch, inline edit modal for maintenance fields + km rounds list, add-multiple-rounds form

### Modified Capabilities

- `vehicle-record-crud`: Add `donViSuaChua` and `ngayLam` fields to `VehicleRecord` schema, DTOs, and service
- `vehicle-excel-export`: Rework bảo dưỡng xe export — source from `VehicleRecord`, add loaiXe selector popup on export page, dynamic km columns per sheet based on max round N in group, ID column is `VehicleRecord.id`
- `vehicle-excel-import`: Rework bảo dưỡng xe import — dynamic km column detection, create `VehicleRecord` when no ID column present, upsert `VehicleMaintenanceKmRound` records

## Impact

- **DB** (`packages/db`): New migration — add columns to `vehicle_records`, create `vehicle_maintenance_km_rounds`, drop `vehicle_maintenance_records`
- **API** (`apps/api`): Rewrite `vehicle-maintenance` module (service, controller, DTOs); update `vehicle-record` DTOs and service; rewrite `baoduong-xe.builder.ts` and `baoduong-xe.parser.ts`
- **Web** (`apps/web`): Rewrite `vehicle-maintenance/page.tsx`; add loaiXe selector popup to import-export page
- **No impact** on trip-plan, kehoach-xe, or other modules
