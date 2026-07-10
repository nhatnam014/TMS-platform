## Why

The customer wants the standalone `/import-export` page removed. The Excel upload/download UI for each module (kế hoạch xe, quản lý xe, bảo dưỡng xe, tiến độ vận tải) should instead live on that module's own page, opened from a header button, so users work with import/export in the same place they manage the data. The underlying import/export logic (endpoints, parsers, Excel builders) does not change — only where the trigger UI lives. Separately, the tiến độ vận tải (yard-move) export needs a new "ĐÃ KÉO / TỒN" filter so staff can export only records that have or have not been hauled yet.

## What Changes

- Extract the shared UI pieces currently defined inline in `apps/web/src/app/(authenticated)/import-export/page.tsx` (`UploadSection`, `DownloadButton`, `ImportResultDisplay`, `ChangedRecordsPopup`, `CreatedRecordsPopup`, `LoaiXeExportPopup`) into reusable components under `apps/web/src/components/import-export/`, unchanged in behavior.
- Add a "Nhập / Xuất Excel" header button to each of the 4 module pages, opening a page-local modal (matching each page's existing Modal pattern) that hosts that module's upload section + download section:
  - `vehicle-records/page.tsx` (quản lý xe) — button next to "+ Thêm record"
  - `trip-plans/page.tsx` (kế hoạch xe) — button next to "+ Tạo chuyến"
  - `vehicle-maintenance/page.tsx` (bảo dưỡng xe) — new header button (page currently has none), includes the "chọn loại xe" export popup
  - `yard-moves/page.tsx` (tiến độ vận tải) — button next to "+ Tạo lệnh"
- Delete `apps/web/src/app/(authenticated)/import-export/page.tsx` and remove its nav entry from `apps/web/src/components/nav-sidebar.tsx`.
- **BREAKING**: Remove the `ADMIN`-only restriction on Excel import/export. Drop `RolesGuard` from `apps/api/src/modules/export/export.controller.ts` and `apps/api/src/modules/import/import.controller.ts` (still behind `JwtAuthGuard`, i.e. any authenticated user). This was required by the decision to make the new per-page buttons visible to all roles, not just ADMIN; previously all 8 endpoints returned HTTP 403 for non-ADMIN callers.
- Add a new "ĐÃ KÉO / TỒN" export-only filter for tiến độ vận tải: `GET /api/v1/export/yard-moves` accepts a new optional `daKeoStatus` query param (`hauled` | `pending`). `hauled` filters to `daKeo` non-empty; `pending` filters to `daKeo` null/empty. Omitted param exports all records (current behavior unchanged). UI: a 3-state toggle (Tất cả / Đã kéo / Tồn) inside the yard-moves export modal only — the main records list/filter bar is untouched.

## Capabilities

### New Capabilities

- `vehicle-maintenance-excel-import`: Bulk-import bảo dưỡng xe records from a multi-sheet Excel file via `POST /api/v1/import/vehicle-maintenance`. Not yet present in `openspec/specs/` (only exists in the unarchived `vehicle-maintenance` change) — captured fresh here since this change modifies its access-control requirement and UI trigger location.
- `vehicle-maintenance-excel-export`: Export bảo dưỡng xe as a multi-sheet Excel file (one sheet per selected loại xe) via `GET /api/v1/export/vehicle-maintenance`. Same rationale as above.
- `import-export-page-placement`: Where each module's Excel import/export UI is surfaced — a button on that module's own page opening a local modal, rather than a shared standalone page. Covers all 4 modules (vehicle records, trip plans, vehicle maintenance, yard moves).

### Modified Capabilities

- `vehicle-excel-import`: Remove the ADMIN-only access restriction; any authenticated user may call `POST /api/v1/import/vehicles`.
- `vehicle-excel-export`: Remove the ADMIN-only access restriction; any authenticated user may call `GET /api/v1/export/vehicles`.
- `trip-plan-excel-import`: Remove the ADMIN-only access restriction; any authenticated user may call `POST /api/v1/import/trip-plans`.
- `trip-plan-excel-export`: Remove the ADMIN-only access restriction; any authenticated user may call `GET /api/v1/export/trip-plans`.
- `yard-move-excel-import`: Remove the ADMIN-only access restriction; any authenticated user may call `POST /api/v1/import/yard-moves`.
- `yard-move-excel-export`: Remove the ADMIN-only access restriction; add the new `daKeoStatus` filter (`hauled` | `pending`) query parameter.

## Impact

- `apps/web/src/app/(authenticated)/import-export/page.tsx` — deleted
- `apps/web/src/components/nav-sidebar.tsx` — remove "Nhập / Xuất Excel" nav item
- `apps/web/src/components/import-export/*` — new shared components (moved, not rewritten)
- `apps/web/src/app/(authenticated)/vehicle-records/page.tsx` — new header button + modal
- `apps/web/src/app/(authenticated)/trip-plans/page.tsx` — new header button + modal
- `apps/web/src/app/(authenticated)/vehicle-maintenance/page.tsx` — new header button + modal (first header action button on this page)
- `apps/web/src/app/(authenticated)/yard-moves/page.tsx` — new header button + modal with the "Đã kéo / Tồn" export filter toggle
- `apps/api/src/modules/export/export.controller.ts` — drop `RolesGuard`; add `daKeoStatus` query param to the yard-moves export endpoint
- `apps/api/src/modules/import/import.controller.ts` — drop `RolesGuard`
- `apps/api/src/modules/export/export.service.ts` — `exportYardMoves` accepts and applies `daKeoStatus` filter
- No database migration — `daKeo` remains a free-text `String?` column; filtering is by null/empty vs. non-empty, no new column
- No change to import parsers, export builders (Excel column layout, branded header), or `@tms/shared` import/export result types
