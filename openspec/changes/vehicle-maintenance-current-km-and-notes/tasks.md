## 1. Database

- [x] 1.1 Add `kmHienTai` (`String?` @map `km_hien_tai`) and `ghiChuBaoDuong` (`String?` @map `ghi_chu_bao_duong`) fields to the `VehicleRecord` model in `packages/db/prisma/schema.prisma`
- [x] 1.2 Generate and run the Prisma migration (`prisma migrate dev`) adding the two nullable columns to `vehicle_records`
- [x] 1.3 Run `prisma generate` so the Prisma client types include the new fields

## 2. API — vehicle-maintenance module

- [x] 2.1 Add `kmHienTai` and `ghiChuBaoDuong` (both optional, nullable strings) to `UpdateMaintenanceFieldsDto`
- [x] 2.2 Update `VehicleMaintenanceService.updateMaintenanceFields` in `vehicle-maintenance.service.ts` to persist `kmHienTai` and `ghiChuBaoDuong` following the same `!== undefined` pattern as `donViSuaChua`/`ngayLam`
- [x] 2.3 Update `VehicleMaintenanceService.findOne` to include `kmHienTai` and `ghiChuBaoDuong` in its returned shape

## 3. API — vehicle-record module

- [x] 3.1 Add `kmHienTai` and `ghiChuBaoDuong` to `CreateVehicleRecordDto` (and update DTO, if fields are duplicated there) as optional nullable strings
- [x] 3.2 Update `VehicleRecordService` create/update methods to pass through `kmHienTai` and `ghiChuBaoDuong`

## 4. API — bảo dưỡng xe Excel export

- [x] 4.1 Update `buildHeaders` in `baoduong-xe.builder.ts` to insert "KM HIỆN TẠI" immediately after "ĐƠN VỊ SỬA CHỮA" and before the `KM CÒN DƯỠNG LẦN n` headers, and append "GHI CHÚ" immediately after the last `KM CÒN DƯỠNG LẦN n` header and before "ID"
- [x] 4.2 Update `addSheet`'s row-building logic and `colWidths` to write `rec.kmHienTai` and `rec.ghiChuBaoDuong` at the new column positions

## 5. API — bảo dưỡng xe Excel import

- [x] 5.1 Add `COL_KM_HIEN_TAI` and `COL_GHI_CHU` detection in `baoduong-xe.parser.ts` using `colIdx(hmap, "km hiện tại", "km hien tai")` and `colIdx(hmap, "ghi chú", "ghi chu")`
- [x] 5.2 Add `kmHienTai` and `ghiChuBaoDuong` fields to `ParsedMaintenanceRow` and populate them from the detected columns in `parseBaoDuongXe`
- [x] 5.3 Update `importVehicleMaintenance` in `import.service.ts` to write `kmHienTai` and `ghiChuBaoDuong` on both the create (no ID) and update (with ID) branches

## 6. Web — bảo dưỡng xe page

- [x] 6.1 Add `kmHienTai` and `ghiChuBaoDuong` to the `VehicleRecord` interface in `vehicle-maintenance/page.tsx`
- [x] 6.2 Add a non-sticky "SỐ KM HIỆN TẠI" header/cell positioned after "Đơn vị sửa chữa" and before the km-round header block
- [x] 6.3 Add a "GHI CHÚ" header/cell positioned after the last km-round column and before the action-menu column; update `totalCols`/table width calculations to account for the two new columns
- [x] 6.4 In `EditModal`, add a `kmHienTai` text input in the existing "Đơn vị sửa chữa" section
- [x] 6.5 In `EditModal`, add a new "Ghi chú" section with a textarea bound to `ghiChuBaoDuong`
- [x] 6.6 Update `EditModal`'s save handler to include `kmHienTai` and `ghiChuBaoDuong` in the PATCH body

## 7. Verification

- [ ] 7.1 Manually create/edit a vehicle in the bảo dưỡng xe page and confirm `kmHienTai` and `ghiChuBaoDuong` save and display correctly, and that `ghiChu` on the quản lý xe page is unaffected
- [ ] 7.2 Export a bảo dưỡng xe Excel file and confirm "KM HIỆN TẠI" and "GHI CHÚ" columns appear at the correct positions with correct values
- [ ] 7.3 Re-import the exported file and confirm both fields round-trip correctly for both existing (with ID) and new (without ID) rows
