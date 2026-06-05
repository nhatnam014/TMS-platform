## 1. Database Schema

- [x] 1.1 Add `VehicleRecord` model to `packages/db/prisma/schema.prisma` with fields: id, tenTaiXe, sdt, loaiXe, bienSo, hanDangKiem, hanBaoHiem, hanCaVet, ghiChu, createdAt, updatedAt
- [x] 1.2 Add `VehicleRecordMooc` model to `packages/db/prisma/schema.prisma` with fields: id, vehicleRecordId (FK → VehicleRecord, cascade delete), soMooc, hanDangKiem, hanBaoHiem, hanCaVet; add `moocs VehicleRecordMooc[]` relation on `VehicleRecord`
- [x] 1.3 Run `prisma migrate dev --name add_vehicle_record` to generate and apply the migration

## 2. Shared Types

- [x] 2.1 Add `VehicleRecord` and `VehicleRecordMooc` TypeScript interfaces to `packages/shared/src/index.ts` (or relevant types file), including `CreateVehicleRecordDto` and `UpdateVehicleRecordDto` interface shapes with all optional fields and a `moocs` array

## 3. API — NestJS Module

- [x] 3.1 Create `apps/api/src/modules/vehicle-record/dto/create-vehicle-record.dto.ts` with all optional fields: `tenTaiXe?`, `sdt?`, `loaiXe?`, `bienSo?`, `hanDangKiem?`, `hanBaoHiem?`, `hanCaVet?`, `ghiChu?`, and `moocs?: { soMooc: string; hanDangKiem?: string; hanBaoHiem?: string; hanCaVet?: string }[]`
- [x] 3.2 Create `apps/api/src/modules/vehicle-record/dto/update-vehicle-record.dto.ts` extending `PartialType(CreateVehicleRecordDto)` (or same shape, all optional including `moocs`)
- [x] 3.3 Create `apps/api/src/modules/vehicle-record/vehicle-record.service.ts` with methods: `findAll()` (include moocs, order by createdAt desc), `create(dto)` (transaction: create record + create moocs + audit log CREATE), `update(id, dto)` (transaction: update record fields + delete old moocs + insert new moocs + audit log UPDATE), `delete(id)` (transaction: delete record with cascade + audit log DELETE)
- [x] 3.4 Create `apps/api/src/modules/vehicle-record/vehicle-record.controller.ts` with routes: `GET /vehicle-records`, `POST /vehicle-records`, `PATCH /vehicle-records/:id`, `DELETE /vehicle-records/:id`; apply `JwtAuthGuard`
- [x] 3.5 Create `apps/api/src/modules/vehicle-record/vehicle-record.module.ts` importing `VehicleRecordController` and `VehicleRecordService`
- [x] 3.6 Register `VehicleRecordModule` in `apps/api/src/app.module.ts`

## 4. Web — Page & UI

- [x] 4.1 Create directory `apps/web/src/app/(authenticated)/vehicle-records/` and add `page.tsx`
- [x] 4.2 Implement data table in `page.tsx` with columns: STT, Tên TX, SĐT, Loại xe, Biển số, Hạn ĐK (xe), Hạn BH (xe), Hạn CV (xe), Số Mooc, Hạn ĐK (mooc), Hạn BH (mooc), Hạn CV (mooc), Ghi chú, Actions — mooc columns stack vertically for multi-mooc records; vehicle-level columns align top
- [x] 4.3 Implement expiry date warning indicator (highlight dates within 30 days of today)
- [x] 4.4 Implement "Thêm record" modal form with all vehicle-level text/date inputs and a dynamic mooc section (add/remove mooc rows via "+ Thêm mooc" button and "×" remove per row)
- [x] 4.5 Implement "Sửa" edit modal pre-populated with existing record data including existing mooc rows
- [x] 4.6 Implement "Xóa" delete with `confirm()` prompt before calling `DELETE /api/vehicle-records/:id`
- [x] 4.7 Wire all form submissions to API calls (`POST` for create, `PATCH` for update, `DELETE` for delete) and refresh list on success

## 5. Navigation

- [x] 5.1 Add `{ href: "/vehicle-records", label: "Quản lý xe" }` entry to the `navItems` array in `apps/web/src/components/nav-sidebar.tsx`, placed after the "Phương tiện" entry
