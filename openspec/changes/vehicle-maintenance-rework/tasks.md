## 1. DB Schema & Migration

- [x] 1.1 Update `packages/db/prisma/schema.prisma`: add `donViSuaChua String? @map("don_vi_sua_chua")` and `ngayLam DateTime? @map("ngay_lam") @db.Date` to `VehicleRecord`; remove `maintenanceRecords VehicleMaintenanceRecord[]` relation from `VehicleRecord`
- [x] 1.2 Add new Prisma model `VehicleMaintenanceKmRound` with fields: `id`, `vehicleRecordId String @map("vehicle_record_id")`, `roundNumber Int @map("round_number")`, `kmCon Decimal @db.Decimal(10,2) @map("km_con")`, `createdAt`, `updatedAt`; relation to `VehicleRecord`; `@@unique([vehicleRecordId, roundNumber])`; `@@map("vehicle_maintenance_km_rounds")`
- [x] 1.3 Remove `VehicleMaintenanceRecord` model from `schema.prisma` entirely
- [x] 1.4 Generate Prisma migration: `pnpm --filter @tms/db exec prisma migrate dev --name rework_vehicle_maintenance` — migration SQL must: (a) add `don_vi_sua_chua` and `ngay_lam` to `vehicle_records`, (b) create `vehicle_maintenance_km_rounds` table with unique index, (c) DROP TABLE `vehicle_maintenance_records`
- [x] 1.5 Run `pnpm --filter @tms/db exec prisma generate` and confirm no TypeScript errors in `packages/db`

## 2. API — VehicleRecord Module Updates

- [x] 2.1 Add `donViSuaChua?: string` and `ngayLam?: string` to `CreateVehicleRecordDto` (with `@IsOptional()`, `@IsString()` / `@IsDateString()` validators)
- [x] 2.2 Add `donViSuaChua?: string | null` and `ngayLam?: string | null` to `UpdateVehicleRecordDto`
- [x] 2.3 Update `VehicleRecordService.create()` to persist `donViSuaChua` and `ngayLam` (convert ngayLam to `new Date()`)
- [x] 2.4 Update `VehicleRecordService.update()` to persist `donViSuaChua` and `ngayLam` when present in DTO
- [x] 2.5 Update `VehicleRecordService.findAll()` to include `donViSuaChua` and `ngayLam` in the returned data (and `kmRounds` via `include: { kmRounds: { orderBy: { roundNumber: 'asc' } } }`)
- [x] 2.6 Add `GET /api/vehicle-records/distinct-loai-xe` endpoint to `VehicleRecordController` that returns distinct non-null `loaiXe` values sorted ascending from `vehicle_records`

## 3. API — VehicleMaintenance Module Rewrite

- [x] 3.1 Create `UpdateMaintenanceFieldsDto` with optional `donViSuaChua?: string | null` and `ngayLam?: string | null`
- [x] 3.2 Create `KmRoundDto` with `roundNumber: number` (`@IsInt()`, `@Min(1)`) and `kmCon: string` (`@IsNumberString()`)
- [x] 3.3 Create `BatchKmRoundsDto` wrapping `rounds: KmRoundDto[]` (`@IsArray()`, `@ValidateNested({ each: true })`)
- [x] 3.4 Rewrite `VehicleMaintenanceService`:
  - `findAll(filters, pagination)` — queries `VehicleRecord` (not maintenance table) with `include: { kmRounds: true }`; supports search by bienSo, tenTaiXe, loaiXe, donViSuaChua
  - `findOne(vehicleRecordId)` — returns VehicleRecord with kmRounds; 404 if not found
  - `updateMaintenanceFields(vehicleRecordId, dto)` — PATCH only `donViSuaChua` and `ngayLam` on VehicleRecord
  - `listKmRounds(vehicleRecordId)` — returns kmRounds ordered by roundNumber asc; 404 if vehicleRecord not found
  - `batchUpsertKmRounds(vehicleRecordId, rounds)` — upsert each round using Prisma `upsert` on unique `[vehicleRecordId, roundNumber]`
  - `deleteKmRound(vehicleRecordId, roundNumber)` — delete specific round; 404 if not found
- [x] 3.5 Rewrite `VehicleMaintenanceController` with new routes:
  - `GET /vehicle-maintenance` (list with search/pagination, from VehicleRecord)
  - `GET /vehicle-maintenance/distinct-units` (distinct loaiXe from vehicle_records — keep for backward compat)
  - `GET /vehicle-maintenance/:vehicleRecordId` (full maintenance profile)
  - `PATCH /vehicle-maintenance/:vehicleRecordId` (update donViSuaChua, ngayLam)
  - `GET /vehicle-maintenance/:vehicleRecordId/km-rounds` (list rounds)
  - `PUT /vehicle-maintenance/:vehicleRecordId/km-rounds` (batch upsert)
  - `DELETE /vehicle-maintenance/:vehicleRecordId/km-rounds/:roundNumber` (delete one round)

## 4. API — Export Builder Rewrite (baoduong-xe)

- [x] 4.1 Rewrite `apps/api/src/modules/export/builders/baoduong-xe.builder.ts`:
  - Accept `records: VehicleRecord[]` (with `kmRounds: KmRound[]`) and `selectedLoaiXe: string[]`
  - Group by `loaiXe`; for each group compute `maxRound = max(round_number)` across all records in group; `colCount = max(4, maxRound)`
  - Headers: TT, SỐ XE, Tài xế, PHONE, NGÀY LÀM, LOẠI XE, ĐƠN VỊ SỬA CHỮA, KM CÒN LẦN 1 … KM CÒN LẦN {colCount}, ID
  - Each row: map `kmRounds` by `roundNumber` to fill km cells; empty string for missing rounds
  - ID column: VehicleRecord.id in light grey (same style as before)
- [x] 4.2 Update `ExportService.exportVehicleMaintenance()` to query `prisma.vehicleRecord.findMany()` (not maintenance table) with `include: { kmRounds: true }` filtered by selected loaiXe; pass result to builder
- [x] 4.3 Update `ExportController` if needed to accept `loaiXe` filter query param sourced from VehicleRecord

## 5. API — Import Parser Rewrite (baoduong-xe)

- [x] 5.1 Rewrite `apps/api/src/modules/import/parsers/baoduong-xe.parser.ts`:
  - Detect header columns: SỐ XE/BIỂN SỐ → `bienSo`; TÀI XẾ/HỌ TÊN → `tenTaiXe`; PHONE/SĐT → `sdt`; LOẠI XE → `loaiXe`; ĐƠN VỊ SỬA CHỮA/ĐƠN VỊ BẢO DƯỠNG → `donViSuaChua`; NGÀY LÀM → `ngayLam`; ID → `id`
  - Detect km columns via regex `/KM\s*C[ÒO]N.+L[ÀA]N\s*(\d+)/i` on each header cell; extract roundNumber from capture group
  - Return `ParsedMaintenanceRow` interface with: `rowNum`, `sheetName`, `id?`, `bienSo?`, `tenTaiXe?`, `sdt?`, `loaiXe?`, `donViSuaChua?`, `ngayLam?`, `kmRounds: { roundNumber: number, kmCon: string }[]`
- [x] 5.2 Rewrite `ImportService.importVehicleMaintenance()`:
  - For each parsed row: if `id` present → find VehicleRecord by id; if not found, push warning and skip; if found, PATCH maintenance fields; if no `id` → CREATE new VehicleRecord with mapped fields
  - After create/update: batch upsert `kmRounds` into `vehicle_maintenance_km_rounds`
  - Return `{ imported: number, warnings: string[], errors: string[] }`

## 6. Web — Bảo dưỡng xe Page Rewrite

- [x] 6.1 Rewrite `apps/web/src/app/(authenticated)/vehicle-maintenance/page.tsx` — update `MaintenanceRecord` interface to reflect `VehicleRecord` fields: include `id`, `bienSo`, `tenTaiXe`, `sdt`, `loaiXe`, `donViSuaChua`, `ngayLam`, `kmRounds: { roundNumber: number, kmCon: string }[]`
- [x] 6.2 Implement dynamic column logic: after fetching each page, compute `maxRound = max(record.kmRounds.length ?? 0)` across all records; `colCount = Math.max(4, maxRound)`; pass `colCount` to table render
- [x] 6.3 Render table with column order: STT, SỐ XE, Tài xế, PHONE, NGÀY LÀM, LOẠI XE, ĐƠN VỊ SỬA CHỮA, KM CÒN LẦN 1 … LẦN {colCount}, action column
- [x] 6.4 Implement edit modal with two sections:
  - Section A (maintenance fields): text field for `donViSuaChua`, date input for `ngayLam`
  - Section B (km rounds list): render existing rounds as a list `[Lần {n}] [kmCon input] [xóa]`; clicking "xóa" calls `DELETE .../km-rounds/{roundNumber}` then refreshes the modal's round list
- [x] 6.5 Implement "add rounds" sub-form inside the modal: a dynamic list of `[Lần {n}] [kmCon input]` rows with "+ Thêm lần" button to append a new input row; on modal save, collect new rows and include in batch upsert `PUT .../km-rounds`
- [x] 6.6 Modal save flow: (1) `PATCH /api/vehicle-maintenance/:id` with `{donViSuaChua, ngayLam}`; (2) if new km rounds added, `PUT /api/vehicle-maintenance/:id/km-rounds` with new rounds array; (3) close modal and refresh table
- [x] 6.7 Remove create-new-record functionality from the bảo dưỡng xe page (records originate from quản lý xe, not directly created here); keep only edit and search/pagination

## 7. Web — Import/Export Page Updates

- [x] 7.1 Add a `LoaiXeExportPopup` component to the import-export page: fetches `GET /api/vehicle-records/distinct-loai-xe`; renders checkboxes for each value + "Tất cả" toggle button
- [x] 7.2 Replace the current loaiXe multi-select in the bảo dưỡng xe export section with the new popup: when user clicks "Xuất Excel", open the popup; on confirm call `GET /api/export/vehicle-maintenance?loaiXe=X,Y` with selected values
- [x] 7.3 Update the export section to call `GET /api/vehicle-records/distinct-loai-xe` instead of the old `GET /api/vehicle-maintenance/distinct-units` for populating the selector
