## ADDED Requirements

### Requirement: Bảo dưỡng xe export includes current km and notes columns

The bảo dưỡng xe Excel export SHALL include a "KM HIỆN TẠI" column immediately after "ĐƠN VỊ SỬA CHỮA" and before the first "KM CÒN LẦN n" column, sourced from `VehicleRecord.kmHienTai`. It SHALL also include a "GHI CHÚ" column immediately after the last "KM CÒN LẦN n" column and before the "ID" column, sourced from `VehicleRecord.ghiChuBaoDuong`.

The full column order per sheet SHALL be: STT, SỐ XE, Tài xế, PHONE, NGÀY LÀM, LOẠI XE, ĐƠN VỊ SỬA CHỮA, KM HIỆN TẠI, KM CÒN LẦN 1 ... KM CÒN LẦN {maxN}, GHI CHÚ, ID.

#### Scenario: KM HIỆN TẠI column appears before the km-round block

- **WHEN** the bảo dưỡng xe export is generated
- **THEN** the "KM HIỆN TẠI" header appears immediately after "ĐƠN VỊ SỬA CHỮA" and immediately before "KM CÒN LẦN 1"

#### Scenario: GHI CHÚ column appears after the km-round block

- **WHEN** the bảo dưỡng xe export is generated with `maxN = 6` km-round columns
- **THEN** the "GHI CHÚ" header appears immediately after "KM CÒN LẦN 6" and immediately before "ID"

#### Scenario: Null values export as empty cells

- **WHEN** a `VehicleRecord` has `kmHienTai = null` and `ghiChuBaoDuong = null`
- **THEN** the corresponding "KM HIỆN TẠI" and "GHI CHÚ" cells are empty strings

#### Scenario: Values export as plain text

- **WHEN** a `VehicleRecord` has `kmHienTai = "320.000 km"` and `ghiChuBaoDuong = "Cần kiểm tra phanh"`
- **THEN** the exported cells contain those exact text values
