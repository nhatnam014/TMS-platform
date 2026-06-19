## Why

The business tracks vehicle maintenance events (oil changes, scheduled servicing) in Excel files
organised by repair unit / vehicle brand (e.g., CHENGLONG, SHACMAN), but there is no dedicated
module in the platform for capturing, viewing, or updating these records. Adding this module closes
the gap and keeps maintenance history alongside the existing vehicle management data.

## What Changes

- Add a new `VehicleMaintenanceRecord` Prisma model (standalone, soft-linked to `VehicleRecord` via nullable FK + denormalized `bienSo`)
- New API module: CRUD endpoints at `/api/vehicle-maintenance`
- New frontend page: `/vehicle-maintenance` with full CRUD table + modal form
- Navigation: add "Bảo dưỡng xe" entry immediately below "Quản lý xe" in the sidebar
- Import: new endpoint `/api/import/vehicle-maintenance` — parses multi-sheet Excel; sheet name → `loaiXe` field (col F "ĐƠN VỊ SỬA CHỮA / LOẠI XE"); col G "ĐƠN VỊ SỬA CHỮA" stored separately as `donViSuaChua`
- Export: new endpoint `/api/export/vehicle-maintenance` — generates multi-sheet Excel; each selected `loaiXe` value becomes a sheet; query param `units=CHENGLONG,SHACMAN` controls which sheets are included
- Import/Export page: two new sections (import + export) for vehicle maintenance

## Capabilities

### New Capabilities

- `vehicle-maintenance-crud`: Full CRUD for vehicle maintenance records — list with pagination/search, create, edit, delete via modal form. Fields: bienSo, tenTaiXe, sdt, `loaiXe` (col F — vehicle brand, sheet key), `donViSuaChua` (col G — repair shop name), ngayLam, soKmBaoDuong, kiBaoDuongTiepTheo, soKmHienTai, ghiChu. Computed display fields (kmDaChay, kmCon) derived on frontend.
- `vehicle-maintenance-excel-import`: Import maintenance records from multi-sheet Excel. Sheet name → `loaiXe`; col F value overrides if non-empty; col G → `donViSuaChua`. Matches `bienSo` against existing `VehicleRecord` to populate nullable FK. Rows with ID column → UPDATE existing record; rows without ID → CREATE new.
- `vehicle-maintenance-excel-export`: Export maintenance records to multi-sheet Excel. Each distinct `loaiXe` value becomes a named sheet. Export page offers multi-select of available `loaiXe` values; selected values determine which sheets appear in the output file.

### Modified Capabilities

- `vehicle-record-crud`: No requirement changes — navigation sidebar gains a new adjacent item but vehicle record behaviour is unchanged.

## Impact

- **DB**: New migration adding `vehicle_maintenance_records` table
- **API** (`apps/api`): New NestJS module — controller, service, DTOs; new import parser; new export builder
- **Web** (`apps/web`): New page `app/(authenticated)/vehicle-maintenance/page.tsx`; sidebar update; import-export page gains two new sections
- **Shared** (`packages/shared`): No new shared types required (maintenance-specific types stay in API/web)
- **No breaking changes** to existing endpoints or data models
