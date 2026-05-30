## 1. Prerequisites and Dependencies

- [x] 1.1 Add `exceljs` as runtime dependency and `@types/multer` as devDependency in `apps/api/package.json`
- [x] 1.2 Add `ImportResult` interface to `packages/shared/src/index.ts`

## 2. BFF Proxy Binary Fix

- [x] 2.1 Update `apps/web/src/app/api/[...path]/route.ts` — replace `request.text()` with `request.arrayBuffer()` for all non-GET/HEAD methods
- [x] 2.2 Update `apps/web/src/app/api/[...path]/route.ts` — replace `apiRes.text()` with `apiRes.arrayBuffer()` for response body
- [x] 2.3 Update `apps/web/src/app/api/[...path]/route.ts` — forward all non-hop-by-hop response headers (skip `transfer-encoding`, `connection`, `keep-alive`) and use `new NextResponse(buffer, { status, headers })`

## 3. Import Module — Scaffolding

- [x] 3.1 Create `apps/api/src/modules/import/import.module.ts` with `FileInterceptor` (MemoryStorage, 5 MB limit) and `ImportService`/`ImportController`
- [x] 3.2 Create `apps/api/src/modules/import/import.controller.ts` with `POST /import/vehicles` and `POST /import/trip-plans` routes, both guarded by `JwtAuthGuard` + `RolesGuard` (ADMIN only), using `@UseInterceptors(FileInterceptor('file'))`
- [x] 3.3 Create `apps/api/src/modules/import/import.service.ts` with stub methods `importVehicles(buffer)` and `importTripPlans(buffer)` returning `ImportResult`
- [x] 3.4 Register `ImportModule` in `apps/api/src/app.module.ts`

## 4. Import Utilities

- [x] 4.1 Create `apps/api/src/modules/import/utils/excel-date.ts` — `parseExcelDate(val: unknown): Date | null` that handles serial integers > 40000 and DD/MM/YYYY strings; returns null for unparseable values
- [x] 4.2 Create `apps/api/src/modules/import/utils/container-size.ts` — `normalizeContainerSize(sizeStr: string, flag20: string, flag40: string, flag45: string): ContainerSize | null` mapping known strings to enum values and falling back to flag columns

## 5. "Quản lý xe" Parser

- [x] 5.1 Create `apps/api/src/modules/import/parsers/quanly-xe.parser.ts` — `parseQuanLyXe(workbook: ExcelJS.Workbook): ParsedVehicleRow[]` that reads the "quản lý xe" sheet, classifies rows (vehicle+driver, vehicle-only, orphan trailer, continuation trailer), and tracks `currentVehicleId` cursor for continuation rows
- [x] 5.2 Implement upsert logic in `ImportService.importVehicles`: for each parsed row call `prisma.vehicle.upsert`, `prisma.driver.upsert`, `prisma.trailer.upsert` with `update: {}` (no-op on conflict); collect warnings for new records and errors for skipped rows
- [x] 5.3 Add single `AuditService.log` call at the end of `importVehicles` summarizing the import

## 6. "Kế hoạch xe" Parser

- [x] 6.1 Create `apps/api/src/modules/import/parsers/kehoach-xe.parser.ts` — `parseKeHoachXe(workbook: ExcelJS.Workbook): ParsedTripPlanRow[]` that reads the "kế hoạch xe" sheet, maps each data row to trip plan + cost fields using the container size normalizer and date parser utilities
- [x] 6.2 Implement upsert/create logic in `ImportService.importTripPlans`: upsert Customer, Carrier, Location (case-insensitive name match), Vehicle with `update: {}` and collect warnings; always auto-create Container; insert new TripPlan + TripCost records
- [x] 6.3 Add single `AuditService.log` call at the end of `importTripPlans` summarizing the import

## 7. Export Module — Scaffolding

- [x] 7.1 Create `apps/api/src/modules/export/export.module.ts` importing `TripPlanModule` and providing `ExportService` and `ExportController`
- [x] 7.2 Create `apps/api/src/modules/export/export.controller.ts` with `GET /export/trip-plans` (accepts optional `from`/`to` query params) and `GET /export/vehicles`, both guarded by `JwtAuthGuard` + `RolesGuard` (ADMIN only); set response headers for binary file download
- [x] 7.3 Create `apps/api/src/modules/export/export.service.ts` with stub methods `exportTripPlans(from?, to?)` and `exportVehicles()` returning `Buffer`
- [x] 7.4 Register `ExportModule` in `apps/api/src/app.module.ts`

## 8. "Kế hoạch xe" Builder

- [x] 8.1 Create `apps/api/src/modules/export/builders/kehoach-xe.builder.ts` — `buildKeHoachXe(tripPlans: TripPlan[]): Promise<Buffer>` that creates an ExcelJS workbook, writes Vietnamese headers in template column order, maps each TripPlan to a data row, sets column widths, and returns the buffer

## 9. "Quản lý xe" Builder

- [x] 9.1 Create `apps/api/src/modules/export/builders/quanly-xe.builder.ts` — `buildQuanLyXe(vehicles: Vehicle[]): Promise<Buffer>` that creates an ExcelJS workbook, writes Vietnamese headers in template column order, maps each Vehicle with its Driver and Trailer to a row, formats dates as DD/MM/YYYY strings (null → empty cell), sets column widths, and returns the buffer

## 10. Export Service Integration

- [x] 10.1 Implement `ExportService.exportTripPlans(from?, to?)` — calls `TripPlanService.findAll({ page: 1, limit: 10000, from, to })`, passes result to `buildKeHoachXe`, returns buffer
- [x] 10.2 Implement `ExportService.exportVehicles()` — queries all vehicles with driver and trailers via Prisma, passes result to `buildQuanLyXe`, returns buffer

## 11. Frontend — Import/Export Page

- [x] 11.1 Create `apps/web/src/app/(authenticated)/import-export/page.tsx` — admin-only page with two file upload sections (one for "Quản lý xe", one for "Kế hoạch xe"), each showing a file picker and upload button; on success display `imported` count, `warnings` list, and `errors` list
- [x] 11.2 Add download button for "Kế hoạch xe" export (calls `GET /api/export/trip-plans` with optional date range inputs) that triggers browser file download
- [x] 11.3 Add download button for "Quản lý xe" export (calls `GET /api/export/vehicles`) that triggers browser file download
- [x] 11.4 Add ADMIN-only nav sidebar entry `{ href: "/import-export", label: "Nhập / Xuất Excel" }` in `apps/web/src/components/nav-sidebar.tsx`
