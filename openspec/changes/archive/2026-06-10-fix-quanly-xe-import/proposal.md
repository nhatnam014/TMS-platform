## Why

The Excel import for the "Quản lý xe" sheet is silently dropping most columns (driver name, license plate, all compliance dates, notes) because the parser's header-name candidates do not match the actual column headers in the file. Additionally, duplicate column names for vehicle vs. mooc date columns cause the wrong column index to be picked, and the list page displays records in reverse import order (newest first).

## What Changes

- **Fix parser header candidates**: Add `"tên tx"`, `"ten tx"` for driver name; add `"theo xe"` for license plate; add `"hạn bảo hiểm"` (without xe-suffix) for vehicle insurance date.
- **Fix duplicate-header collision**: Mooc date columns share the same display names as vehicle date columns (`"HẠN ĐĂNG KIỂM"`, `"HẠN CÀ VẸT"`). Switch to position-relative lookup: once `SỐ MOOC` column is found at index N, treat N+1, N+2, N+3 as mooc DK/BH/CV, and N+4 as `GHI CHÚ`.
- **Add ghiChu import**: The `ParsedVehicleRecordRow` interface and import service did not include `ghiChu`; add it throughout the import pipeline.
- **Fix record ordering**: `VehicleRecord.findAll()` currently uses `orderBy: { createdAt: "desc" }`, showing the last-imported row at the top; change to `"asc"` so import order matches Excel row order.

## Capabilities

### New Capabilities

_(none — this change only corrects existing behaviour)_

### Modified Capabilities

- `vehicle-excel-import`: Update header-matching requirements to reflect actual Excel column names (`TÊN TX`, `THEO XE`, abbreviated mooc-date headers, `GHI CHÚ`); replace name-based mooc-column lookup with position-relative lookup anchored on `SỐ MOOC`.
- `vehicle-record-crud`: Update list ordering requirement from descending to ascending creation date.

## Impact

- `apps/api/src/modules/import/parsers/quanly-xe.parser.ts` — header candidates, duplicate-column fix, ghiChu field
- `apps/api/src/modules/import/import.service.ts` — pass ghiChu to Prisma create
- `apps/api/src/modules/vehicle-record/vehicle-record.service.ts` — orderBy asc
