## 1. Extract shared import/export UI components

- [x] 1.1 Create `apps/web/src/components/import-export/upload-section.tsx` — move `UploadSection` out of `import-export/page.tsx` verbatim (same props: `title`, `endpoint`, `description`; same upload/toast/error logic)
- [x] 1.2 Create `apps/web/src/components/import-export/import-result-display.tsx` — move `ImportResultDisplay`, `ChangedRecordsPopup`, `CreatedRecordsPopup` verbatim; bump `ChangedRecordsPopup` and `CreatedRecordsPopup` overlay `zIndex` from 50 to 60 so they render above a page-local import/export modal (also `zIndex: 50`)
- [x] 1.3 Create `apps/web/src/components/import-export/download-button.tsx` — move `DownloadButton` verbatim (props: `label`, `endpoint`, `filename`, `extraInputs?`, `buildUrl?`)
- [x] 1.4 Create `apps/web/src/components/import-export/loai-xe-export-popup.tsx` — move `LoaiXeExportPopup` verbatim (props: `loaiXeList`, `onConfirm`, `onClose`, `downloading`)
- [x] 1.5 Wire `upload-section.tsx` to import `ImportResultDisplay` from `./import-result-display`

## 2. Backend: open import/export APIs to all authenticated roles

- [x] 2.1 In `apps/api/src/modules/export/export.controller.ts`, change `@UseGuards(JwtAuthGuard, RolesGuard)` to `@UseGuards(JwtAuthGuard)` and remove the now-unused `RolesGuard` import
- [x] 2.2 In `apps/api/src/modules/import/import.controller.ts`, change `@UseGuards(JwtAuthGuard, RolesGuard)` to `@UseGuards(JwtAuthGuard)` and remove the now-unused `RolesGuard` import
- [x] 2.3 Update the `@ApiOperation` summary strings on both controllers to drop the "(ADMIN only)" wording
- [x] 2.4 Verify `user.controller.ts` and `audit.controller.ts` still import and use `RolesGuard` independently (unaffected by 2.1/2.2)

## 3. Backend: add "Đã kéo / Tồn" export filter for yard-moves

- [x] 3.1 In `apps/api/src/modules/export/export.controller.ts`, add `@Query("daKeoStatus") daKeoStatus?: "hauled" | "pending"` param to `exportYardMoves` and pass it through to `exportService.exportYardMoves`
- [x] 3.2 In `apps/api/src/modules/export/export.service.ts`, extend `exportYardMoves(from?, to?, daKeoStatus?)`: for `"hauled"` add `AND: [{ daKeo: { not: null } }, { NOT: { daKeo: "" } }]` to the where clause; for `"pending"` add `OR: [{ daKeo: null }, { daKeo: "" }]`; omit filter when `daKeoStatus` is undefined
- [x] 3.3 Confirm `buildLenhBai` (the export builder) requires no changes — filtering happens in the Prisma query before rows reach the builder

## 4. Frontend: quản lý xe (`vehicle-records`) page

- [x] 4.1 Add `showImportExport` boolean state and a "Nhập / Xuất Excel" header button next to "+ Thêm record"
- [x] 4.2 Render a modal (using the shared `ImportExportModal` component — see design.md Decision 2 revision) containing: `UploadSection` (title "Nhập danh sách xe", endpoint `/api/import/vehicles?confirm=true`) and `DownloadButton` (label "Tải xuống quan-ly-xe.xlsx", endpoint `/api/export/vehicles`, filename `quan-ly-xe.xlsx`) — copy title/description/labels verbatim from the old page
- [ ] 4.3 Manually verify: upload a valid file shows import result inline in the modal; clicking "N bản ghi đã thay đổi" opens the diff popup above the modal; closing the modal and reopening resets the upload state

## 5. Frontend: kế hoạch xe (`trip-plans`) page

- [x] 5.1 Add `showImportExport` boolean state and a "Nhập / Xuất Excel" header button next to "+ Tạo chuyến"
- [x] 5.2 Render a modal containing: `UploadSection` (title "Nhập kế hoạch chuyến", endpoint `/api/import/trip-plans`) and `DownloadButton` (label "Tải xuống ke-hoach-xe.xlsx", endpoint `/api/export/trip-plans`, filename `ke-hoach-xe.xlsx`) with the existing from/to date `extraInputs` and `buildUrl` logic moved in unchanged
- [ ] 5.3 Manually verify: date-filtered export downloads only trip plans in range; unfiltered export downloads all rows

## 6. Frontend: bảo dưỡng xe (`vehicle-maintenance`) page

- [x] 6.1 Add `showImportExport` boolean state and a new "Nhập / Xuất Excel" header button next to `<h1>Bảo dưỡng xe</h1>` (this page currently has no header action button)
- [x] 6.2 Render a modal containing: `UploadSection` (title "Nhập bảo dưỡng xe", endpoint `/api/import/vehicle-maintenance`) and the maintenance export flow — fetch `/api/vehicle-records/distinct-loai-xe`, "Xuất Excel bảo dưỡng xe" button opening `LoaiXeExportPopup`, confirm handler downloading `/api/export/vehicle-maintenance?units=...` as `bao-duong-xe.xlsx` (move `MaintenanceExportSection`'s logic in, inlined into this page's modal rather than kept as a separate shared component)
- [ ] 6.3 Manually verify: loại xe multi-select popup lists all distinct loại xe; exporting a subset produces a workbook with only the selected sheets

## 7. Frontend: tiến độ vận tải (`yard-moves`) page

- [x] 7.1 Add `showImportExport` boolean state and a "Nhập / Xuất Excel" header button next to "+ Tạo lệnh"
- [x] 7.2 Render a modal containing: `UploadSection` (title "Nhập tiến độ vận tải", endpoint `/api/import/yard-moves?confirm=true`) and `DownloadButton` (label "Tải xuống tien-do-van-tai.xlsx", endpoint `/api/export/yard-moves`, filename `tien-do-van-tai.xlsx`) with the existing from/to date `extraInputs` and `buildUrl` logic moved in unchanged
- [x] 7.3 Add a 3-state "Đã kéo / Tồn" toggle (Tất cả / Đã kéo / Tồn) inside the same `extraInputs` block, wired to append `&daKeoStatus=hauled` or `&daKeoStatus=pending` to the download `buildUrl()` (omit the param entirely for "Tất cả")
- [ ] 7.4 Manually verify: exporting with "Đã kéo" only includes rows with a non-empty `daKeo`; exporting with "Tồn" only includes rows with empty/null `daKeo`; exporting with "Tất cả" matches current (pre-change) behavior; combining the toggle with from/to dates filters by both
- [x] 7.5 Confirm the yard-moves list page's own search/filter bar is untouched — no `daKeoStatus` state or UI added outside the export modal (verified by inspection: only the import/export modal gained new state/UI; the existing search input and `fetchMoves` query are unchanged)

## 8. Remove the standalone import/export page

- [x] 8.1 Delete `apps/web/src/app/(authenticated)/import-export/page.tsx`
- [x] 8.2 Remove the `{ href: "/import-export", label: "Nhập / Xuất Excel" }` entry from `apps/web/src/components/nav-sidebar.tsx`
- [x] 8.3 Search the codebase for any remaining links/references to `/import-export` (e.g. redirects, breadcrumbs, tests) and remove them

## 9. Final verification

- [x] 9.1 Run typecheck/lint/build across `apps/web` and `apps/api` — `type-check` passes clean on both; `lint` blocked by pre-existing environment gaps unrelated to this change (`eslint` binary missing in `apps/api/node_modules`, no ESLint config in `apps/web` so `next lint` prompts interactively) — not caused by this change, no config/package.json files were touched
- [ ] 9.2 As a non-ADMIN user, confirm all 4 pages' import/export buttons are visible and functional (upload succeeds, download succeeds) — this is the intended behavior change, not a regression
- [ ] 9.3 Confirm `user.controller.ts` and `audit.controller.ts` endpoints still correctly reject non-ADMIN callers (RolesGuard unaffected there)
- [ ] 9.4 Confirm navigating to `/import-export` no longer shows the old page

## 10. Empty-result export feedback (X-Export-Row-Count)

- [x] 10.1 In `apps/api/src/modules/export/export.service.ts`, change `exportTripPlans` to return `{ buffer: Buffer; count: number }` (`count` = `result.data.length` from the existing `TripPlanService.findAll` call, captured before calling `buildKeHoachXe`)
- [x] 10.2 In the same file, change `exportYardMoves` to return `{ buffer: Buffer; count: number }` (`count` = `records.length`, captured before calling `buildLenhBai`) — combined effect of `isActive` + `from`/`to` + `daKeoStatus` filtering already applied to that query
- [x] 10.3 In `apps/api/src/modules/export/export.controller.ts`, update `exportTripPlans` and `exportYardMoves` handlers to destructure `{ buffer, count }` from the service call and add `res.set("X-Export-Row-Count", String(count))` alongside the existing `Content-Disposition`/`Content-Type` headers, before `res.end(buffer)`
- [x] 10.4 Confirm `exportVehicles` and `exportVehicleMaintenance` (controller + service) are left unchanged — out of scope per design.md Decision 6
- [x] 10.5 In `apps/web/src/components/import-export/download-button.tsx`, add an optional `emptyResultMessage?: string` prop; after a successful fetch, read `res.headers.get("X-Export-Row-Count")` and show `emptyResultMessage` (if provided, else a generic fallback) via `toast` as a warning when the count is `0`, otherwise keep the existing generic success toast — the file download itself is triggered in both cases, unchanged (uses `toast.error(...)` since the shared toast system only supports `success`/`error`, no dedicated `warning` tier — adding one was out of scope for this task)
- [x] 10.6 In `apps/web/src/app/(authenticated)/trip-plans/page.tsx`, compute `emptyResultMessage` from `exportFromDate`/`exportToDate` state (e.g. "Không có chuyến nào từ {từ ngày} đến {đến ngày}" when dates are set, or a generic "Không có chuyến nào phù hợp" fallback when neither is set) and pass it to the trip-plans `DownloadButton`
- [x] 10.7 In `apps/web/src/app/(authenticated)/yard-moves/page.tsx`, compute `emptyResultMessage` from `exportFromDate`/`exportToDate`/`exportDaKeoStatus` state, echoing back whichever of the three are actually active (omit unset ones), and pass it to the yard-moves `DownloadButton`
- [ ] 10.8 Manually verify: exporting trip-plans with a date range matching 0 rows still downloads a valid (header-only) file and shows the filter-aware warning toast, not "Tải xuống thành công"
- [ ] 10.9 Manually verify: exporting yard-moves with a date range + đã kéo/tồn combination that intersects to 0 rows (but each filter alone would match something) still downloads a valid file and shows a warning toast listing both active filters
- [ ] 10.10 Manually verify: exporting either page with filters that do match rows shows the unchanged generic success toast (no regression)
- [x] 10.11 Run `apps/web` and `apps/api` type-check after these changes — both pass clean
