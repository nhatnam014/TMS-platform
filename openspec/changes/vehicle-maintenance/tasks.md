## 1. Database — Prisma Schema & Migration

- [x] 1.1 Add `VehicleMaintenanceRecord` model to `packages/db/prisma/schema.prisma` with fields: id, vehicleRecordId (nullable FK → VehicleRecord, onDelete SetNull), bienSo, tenTaiXe, sdt, loaiXe (col F — ĐƠN VỊ SỬA CHỮA / LOẠI XE — sheet discriminator), donViSuaChua (col G — ĐƠN VỊ SỬA CHỮA — repair shop name), ngayLam (Date), soKmBaoDuong (Decimal), kiBaoDuongTiepTheo (Decimal), soKmHienTai (Decimal), ghiChu, createdAt, updatedAt; indexes on bienSo, loaiXe, ngayLam
- [x] 1.2 Run `pnpm --filter @tms/db exec prisma migrate dev --name add-vehicle-maintenance` to generate and apply migration
- [x] 1.3 Regenerate Prisma client: `pnpm --filter @tms/db exec prisma generate`

## 2. API — NestJS Module (CRUD)

- [x] 2.1 Create module directory `apps/api/src/modules/vehicle-maintenance/`
- [x] 2.2 Create `vehicle-maintenance.module.ts` importing PrismaService and AuditService
- [x] 2.3 Create `dto/create-vehicle-maintenance.dto.ts` and `dto/update-vehicle-maintenance.dto.ts` with class-validator decorators
- [x] 2.4 Create `vehicle-maintenance.service.ts` implementing: `findAll` (paginated, search by bienSo/tenTaiXe, `loaiXe` exact filter), `distinctUnits` (distinct `loaiXe` values), `findOne`, `create` (auto-link VehicleRecord by bienSo), `update`, `remove` — all with audit log
- [x] 2.5 Create `vehicle-maintenance.controller.ts` with routes: `GET /vehicle-maintenance`, `GET /vehicle-maintenance/distinct-units`, `GET /vehicle-maintenance/:id`, `POST /vehicle-maintenance`, `PATCH /vehicle-maintenance/:id`, `DELETE /vehicle-maintenance/:id`
- [x] 2.6 Register `VehicleMaintenanceModule` in `apps/api/src/app.module.ts`
- [x] 2.7 Run `pnpm --filter @tms/api exec tsc --noEmit` to verify no type errors

## 3. API — Excel Import Parser

- [x] 3.1 Create `apps/api/src/modules/import/parsers/baoduong-xe.parser.ts` — iterate all worksheets; sheet name → `loaiXe` default; col 6 (ĐƠN VỊ SỬA CHỮA / LOẠI XE) overrides `loaiXe` if non-empty; col 7 (ĐƠN VỊ SỬA CHỮA) → `donViSuaChua`; handle merged cells for bienSo/tenTaiXe/sdt; skip rows without ngayLam; read ID column for create-vs-update logic
- [x] 3.2 Add `importVehicleMaintenance(buffer: Buffer): Promise<ImportResult>` method to `apps/api/src/modules/import/import.service.ts` — calls parser, auto-links vehicleRecordId by bienSo, creates/updates records via Prisma
- [x] 3.3 Add `POST /import/vehicle-maintenance` route to `apps/api/src/modules/import/import.controller.ts`
- [x] 3.4 Run type-check to verify no errors

## 4. API — Excel Export Builder

- [x] 4.1 Create `apps/api/src/modules/export/builders/baoduong-xe.builder.ts` — accepts `records: any[]` and `units: string[]`; groups records by `loaiXe`; creates one worksheet per unit named after the `loaiXe` value; columns: TT, SỐ XE, Tài xế, phone, NGÀY LÀM, ĐƠN VỊ SỬA CHỮA/LOẠI XE, ĐƠN VỊ SỬA CHỮA, SỐ KM BẢO DƯỠNG, KÌ BẢO DƯỠNG TIẾP THEO, SỐ KM HIỆN TẠI, KM ĐÃ CHẠY (computed), KM CÒN (computed), ID (grey); borders and header style
- [x] 4.2 Add `exportVehicleMaintenance(units?: string[])` method to `apps/api/src/modules/export/export.service.ts` — queries records filtered by `loaiXe` IN units (or all if units empty), calls builder
- [x] 4.3 Add `GET /export/vehicle-maintenance` route to `apps/api/src/modules/export/export.controller.ts` accepting `units` query param (comma-separated)
- [x] 4.4 Run type-check to verify no errors

## 5. Web — Maintenance CRUD Page

- [x] 5.1 Create `apps/web/src/app/(authenticated)/vehicle-maintenance/page.tsx` with: paginated table (columns: STT, SỐ XE, Tài xế, SĐT, Đơn vị SC, Ngày làm, Km BD, Kì tiếp, Km HT, Km đã chạy, Km còn, Ghi chú, Thao tác), search bar, "+ Thêm bảo dưỡng" button, 3-dot action menu per row (Sửa / Xóa)
- [x] 5.2 Implement create modal with all input fields (bienSo, tenTaiXe, sdt, loaiXe, donViSuaChua, ngayLam, soKmBaoDuong, kiBaoDuongTiepTheo, soKmHienTai, ghiChu); submit calls `POST /api/vehicle-maintenance`
- [x] 5.3 Implement edit modal pre-filled with existing values; submit calls `PATCH /api/vehicle-maintenance/:id`
- [x] 5.4 Implement delete confirmation dialog calling `DELETE /api/vehicle-maintenance/:id`
- [x] 5.5 Display `kmDaChay` and `kmCon` as computed columns; colour `kmCon` red when ≤ 0
- [x] 5.6 Apply section background colours consistent with trip-plans form style
- [x] 5.7 Run `pnpm --filter @tms/web exec tsc --noEmit` to verify no type errors

## 6. Web — Navigation Sidebar

- [x] 6.1 Add `{ href: "/vehicle-maintenance", label: "Bảo dưỡng xe" }` to `BASE_NAV_ITEMS` in `apps/web/src/components/nav-sidebar.tsx` immediately after the "Quản lý xe" entry

## 7. Web — Import/Export Page

- [x] 7.1 Add `UploadSection` for maintenance import to `apps/web/src/app/(authenticated)/import-export/page.tsx` under the existing "Nhập dữ liệu từ Excel" heading (endpoint: `/api/import/vehicle-maintenance`)
- [x] 7.2 Add maintenance export section with dynamic unit checkboxes: on mount fetch `/api/vehicle-maintenance/distinct-units`; render one checkbox per unit; include "Tất cả" toggle; download button calls `/api/export/vehicle-maintenance?units=...` with selected units joined by comma
- [x] 7.3 Run type-check to verify no errors

## 8. Verification

- [x] 8.1 Run full API type-check: `pnpm --filter @tms/api exec tsc --noEmit`
- [x] 8.2 Run full web type-check: `pnpm --filter @tms/web exec tsc --noEmit`
- [ ] 8.3 Manually test import with the customer's 2-sheet Excel file — verify CHENGLONG and SHACMAN records are created with correct `loaiXe` (from sheet name) and `donViSuaChua` (from col G), merged-cell rows inherit correct bienSo/tenTaiXe/sdt
- [ ] 8.4 Manually test export — select CHENGLONG only → 1-sheet file; select both → 2-sheet file; verify computed KM ĐÃ CHẠY and KM CÒN values are correct
- [ ] 8.5 Manually test CRUD page — create, edit, delete records; verify kmCon turns red when ≤ 0
- [ ] 8.6 Verify sidebar shows "Bảo dưỡng xe" below "Quản lý xe" and navigation works
