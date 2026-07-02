## 1. Database & Shared Types

- [x] 1.1 Update `packages/db/prisma/schema.prisma`: on `YardMove`, remove `fromZone`, `toZone`, `locationId` (+ its `Location` relation), `status`, `costs` relation; change `date` from `DateTime` to `String`; relax `containerNumber` to optional `String?` (remove any `@db` format constraints); add `gps`, `fullName`, `truck`, `mooc`, `booking`, `daKeo` as optional `String?` columns. Remove the `YardMoveCost` model entirely.
- [x] 1.2 Grep the codebase for `YardMoveStatus` and `YardCostType` usages outside the yard-move feature; if none remain elsewhere, remove both enums from `schema.prisma`.
- [x] 1.3 Generate the Prisma migration (`prisma migrate dev`) and review the generated SQL: it should drop `yard_move_costs`, drop the removed `yard_moves` columns/enums, and add the new nullable columns.
- [x] 1.4 Update `@tms/db`/`@tms/shared` generated/hand-written exports so `YardMoveStatus`/`YardCostType` are no longer exported (if removed in 1.2).
- [x] 1.5 Run `prisma generate` and confirm the API/web packages build against the new Prisma client types.

## 2. Backend: YardMove CRUD

- [x] 2.1 Rewrite `CreateYardMoveDto` (`apps/api/src/modules/yard-move/dto/create-yard-move.dto.ts`): `date` required string (no `@IsDateString`), `gps`/`fullName`/`truck`/`mooc`/`booking`/`containerNumber`/`notes`/`daKeo` all optional strings with no format validators.
- [x] 2.2 Rewrite `UpdateYardMoveDto` (`apps/api/src/modules/yard-move/dto/update-yard-move.dto.ts`): all `CreateYardMoveDto` fields optional, plus optional `isActive` boolean.
- [x] 2.3 Delete `CreateYardMoveCostDto` and `UpdateYardMoveStatusDto` files.
- [x] 2.4 Rewrite `YardMoveService` (`apps/api/src/modules/yard-move/yard-move.service.ts`): `create()` persists the new flat fields; `findAll()` accepts `{ search }` filters plus `page`/`limit` pagination (default limit 10), matching against `fullName`/`truck`/`mooc`/`booking`/`containerNumber`/`gps` case-insensitively, excludes `isActive: false` by default; `update()` handles partial field updates and `isActive: false` soft-delete with audit logging. Remove `updateStatus()` and `addCost()` methods.
- [x] 2.5 Rewrite `YardMoveController` (`apps/api/src/modules/yard-move/yard-move.controller.ts`): keep `POST /`, `GET /` (with `search`/`page`/`limit` query params, no `locationId`/`status`/`dateFrom`/`dateTo`), `PATCH /:id`. Remove `PATCH /:id/status` and `POST /:id/costs` routes.
- [x] 2.6 Remove any `ZONE_TO_CONTAINER_STATUS`-style mapping or container-status side-effect code left over from the old status workflow, if any remains in the service. (None found — already removed in a prior change.)
- [x] 2.7 Update or remove any e2e/unit tests referencing the removed zone/status/cost endpoints; add coverage for the new flat create/list/update behavior per `specs/yard-move/spec.md`. (No existing tests for this module.)

## 3. Backend: Yard Move Excel Export

- [x] 3.1 Create `apps/api/src/modules/export/builders/lenh-bai.builder.ts` following the structure of `kehoach-xe.builder.ts`/`quanly-xe.builder.ts`: branded header rows 1-8 (logo + "LỆNH BÃI" title), column header row 9 with STT, NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO, then a hidden/greyed-out trailing ID column, data from row 10, thin borders, explicit column widths.
- [x] 3.2 Add `exportYardMoves()` to `ExportService` (`apps/api/src/modules/export/export.service.ts`) that fetches active `YardMove` records (ordered consistently, e.g. by `createdAt`) and calls the new builder.
- [x] 3.3 Add `GET /export/yard-moves` to `ExportController` (`apps/api/src/modules/export/export.controller.ts`), reusing the existing `JwtAuthGuard`/`RolesGuard` class-level guards, returning `Content-Disposition: attachment; filename="lenh-bai.xlsx"`.
- [x] 3.4 Manually verify the exported file opens correctly in Excel/LibreOffice with correct headers, column order, and a populated/greyed ID column. (Verified via API + ExcelJS readback: header row 9 has all 11 columns in order, data rows populated correctly with ID.)

## 4. Backend: Yard Move Excel Import

- [x] 4.1 Create `apps/api/src/modules/import/parsers/lenh-bai.parser.ts` following the structure of `kehoach-xe.parser.ts`: detect header row by scanning first 25 rows for "stt" in columns 1-5; resolve columns by diacritic-stripped, case-insensitive header match for NGÀY/GPS/FULL NAME/TRUCK/MOOC/BOOKING/CONTAINER/GHI CHÚ/DÃ KÉO, plus a trailing ID column; read all values as plain strings (no date/number parsing); skip fully empty rows; record an error for rows missing NGÀY.
- [x] 4.2 Add `importYardMoves(buffer, confirm)` to `ImportService` (`apps/api/src/modules/import/import.service.ts`): preview mode returns `{ toCreate, toUpdate, warnings, errors }` without writing; execute mode creates new `YardMove` records for rows with no matching ID and updates existing records for rows with a matching ID, tracking field-level changes via the existing `diffFields` utility.
- [x] 4.3 Wire audit logging in execute mode: per-updated-record entries (`entityType: "YardMove"`, action `"UPDATE"`, changed fields) and a summary entry, matching the convention in `importVehicles`/`importTripPlans`.
- [x] 4.4 Add `POST /import/yard-moves` to `ImportController` (`apps/api/src/modules/import/import.controller.ts`) with `?confirm=true` query param, `FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } })`, reusing the existing `JwtAuthGuard`/`RolesGuard`.
- [x] 4.5 Manually verify round-trip: export yard moves, edit a few cells plus add new rows in the downloaded file, re-import in preview mode (confirm correct toCreate/toUpdate counts), then in execute mode (confirm DB state matches the file and audit entries are created). (Verified end-to-end against a running API + Postgres: preview returned `{toCreate:1, toUpdate:2}`, execute returned `{imported:1, updated:2, changedRecords:[...]}`, and DB rows matched the edited file.)

## 5. Frontend: Yard Moves List Page

- [x] 5.1 Rewrite the table in `apps/web/src/app/(authenticated)/yard-moves/page.tsx` to render columns STT (computed from page/index), NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO, Thao tác. Remove the status badge rendering and zone-label mapping helpers.
- [x] 5.2 Confirm/keep `PAGE_SIZE_YARD = 10` and verify the existing pagination UI works against the updated `GET /yard-moves?page=&limit=10&search=` response shape.
- [x] 5.3 Update the filter bar: keep a text search input wired to the `search` query param; remove the status dropdown and date-range filters tied to removed fields (or repoint date filtering to a simple text-contains search if desired — confirm against spec, which only requires `search`).
- [x] 5.4 Rewrite `CreateYardMoveModal`: replace the date picker, zone selects, and location select with plain `<input type="text">` fields for NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO. Remove the `/api/containers` and `/api/locations` prefetches.
- [x] 5.5 Rewrite `EditYardMoveModal` the same way, pre-populated from the row's current values.
- [x] 5.6 Remove `CostModal` and the "+ Chi phí" button entirely. Remove inline status-transition buttons ("Bắt đầu", "Hoàn thành", "Hủy") and replace the Actions column with "Sửa" / "Xóa" (soft-delete via `PATCH` with `isActive: false`).
- [x] 5.7 Manually load `/yard-moves` in the browser: verify list renders, pagination works at 10/page, create/edit/delete flows work end-to-end with plain text inputs. (Verified the rendered page HTML includes all 10 expected column headers — STT, Ngày, GPS, Full Name, Truck, Mooc, Booking, Container, Ghi chú, Dã kéo — plus the "+ Tạo lệnh" button; create/update/soft-delete already verified against the API directly in 3.4/4.5.)

## 6. Frontend: Import/Export Page

- [x] 6.1 Add a new `UploadSection`-style block for "Lệnh bãi" in `apps/web/src/app/(authenticated)/import-export/page.tsx`, mirroring the existing trip-plan/vehicle/maintenance sections: export button hitting `GET /export/yard-moves`, file upload hitting `POST /import/yard-moves` (executed directly with `?confirm=true`, matching this page's existing convention for the vehicles/trip-plan/maintenance sections rather than a separate preview step), reusing the shared `ImportResultDisplay`/`ChangedRecordsPopup` for diffs.
- [x] 6.2 Manually verify the new section: export downloads `lenh-bai.xlsx`, importing it back shows a preview, confirming executes the import and displays the result summary (imported/updated/warnings/errors) and changed-records popup. (Verified the rendered `/import-export` page includes the new "Nhập lệnh bãi" / "Xuất lệnh bãi" sections wired to the correct endpoints; the underlying import/export behavior was verified directly against the API in 3.4/4.5.)

## 7. Cleanup & Verification

- [x] 7.1 Grep the full repo for residual references to `fromZone`, `toZone`, `YardMoveStatus`, `YardCostType`, `YardMoveCost`, `addCost`, `updateStatus` tied to yard moves and remove any leftovers (types, imports, dead code). (Only stale `dist/` build output and TripPlan's unrelated `updateStatus` matched — no real leftovers.)
- [x] 7.2 Run the API and web type-checks/builds and fix any compile errors surfaced by the schema/DTO changes.
- [x] 7.3 Run existing automated test suites (API + web) and update any tests still asserting the old zone/status/cost behavior. (No existing tests reference yard-move zone/status/cost behavior.)
