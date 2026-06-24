## Why

The bảo dưỡng xe (vehicle maintenance) page tracks N flexible "KM CÒN LẦN n" checkpoints per vehicle but has no place to record the vehicle's current odometer reading, and no notes field scoped to maintenance (the existing `VehicleRecord.ghiChu` field is already used by the quản lý xe page for unrelated notes). Staff need a "Số KM hiện tại" reference column next to the km rounds, and a maintenance-specific notes field that round-trips through the UI and Excel import/export without colliding with the quản lý xe notes.

## What Changes

- Add `kmHienTai` (current km, free text like the existing `kmCon` round values) to `VehicleRecord`, displayed as a new "SỐ KM HIỆN TẠI" column positioned immediately after the pinned columns and before "KM CÒN LẦN 1"
- Add `ghiChuBaoDuong` (maintenance notes, stored under a name distinct from the existing `ghiChu` field) to `VehicleRecord`, displayed as a new "GHI CHÚ" column at the end of the bảo dưỡng xe table, after all "KM CÒN LẦN n" columns
- Both fields are editable in the bảo dưỡng xe edit modal: `kmHienTai` alongside Đơn vị sửa chữa/Ngày làm, `ghiChuBaoDuong` in its own notes section
- Bảo dưỡng xe Excel export: add "KM HIỆN TẠI" column (right after ĐƠN VỊ SỬA CHỮA, before the KM CÒN LẦN n columns) and "GHI CHÚ" column (after the last KM CÒN LẦN n column, before ID)
- Bảo dưỡng xe Excel import: detect and map the "KM HIỆN TẠI" header to `kmHienTai` and the "Ghi chú" header to `ghiChuBaoDuong`, for both create (no ID) and update (with ID) rows

## Capabilities

### New Capabilities

- `vehicle-maintenance-view-page`: the bảo dưỡng xe page capability has no archived spec yet (a prior change implemented it but was never archived into `openspec/specs/`). This change introduces its spec covering the full current page behavior plus the two new columns ("SỐ KM HIỆN TẠI", "GHI CHÚ") and edit-modal inputs being added here.

### Modified Capabilities

- `vehicle-record-crud`: add `kmHienTai` and `ghiChuBaoDuong` fields to the `VehicleRecord` data model, create/update/list API behavior
- `vehicle-excel-export`: add "KM HIỆN TẠI" and "GHI CHÚ" columns to the bảo dưỡng xe export sheet
- `vehicle-excel-import`: map "KM HIỆN TẠI" and "Ghi chú" header columns on bảo dưỡng xe import

## Impact

- **DB** (`packages/db`): migration adding `km_hien_tai` and `ghi_chu_bao_duong` columns to `vehicle_records`
- **API** (`apps/api`): `UpdateMaintenanceFieldsDto` gains `kmHienTai`, `ghiChuBaoDuong`; `vehicle-maintenance.service.ts` persists them; `baoduong-xe.builder.ts` adds the two export columns at their positions; `baoduong-xe.parser.ts` detects and maps the two import columns; `import.service.ts` writes both fields on create/update
- **Web** (`apps/web`): `vehicle-maintenance/page.tsx` — new table header/cell for each column at their specified positions, and two new inputs in `EditModal`
- **No impact** on trip-plan, kehoach-xe, quản lý xe (`vehicle-record-crud`'s existing `ghiChu` field), or other modules
