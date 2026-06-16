## MODIFIED Requirements

### Requirement: Admin can export vehicle compliance data as a flat Excel file

The system SHALL provide `GET /api/v1/export/vehicles` that returns an `.xlsx` file sourced from the `VehicleRecord` table (not from the `Vehicle` or `Driver` tables). The response MUST include `Content-Disposition: attachment; filename="quan-ly-xe.xlsx"` and `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. The endpoint SHALL be restricted to users with role ADMIN.

#### Scenario: Export returns all VehicleRecord rows

- **WHEN** an admin requests `GET /api/v1/export/vehicles`
- **THEN** the response is an `.xlsx` file containing all VehicleRecord rows with their mooc data; Driver and Vehicle tables are not queried

#### Scenario: Non-admin role is rejected

- **WHEN** a user without ADMIN role calls `GET /api/v1/export/vehicles`
- **THEN** the API returns HTTP 403

#### Scenario: Response triggers browser file download

- **WHEN** the frontend opens the export URL
- **THEN** the browser receives `Content-Disposition: attachment; filename="quan-ly-xe.xlsx"` and saves the file

### Requirement: Exported Excel maps VehicleRecord fields to quản lý xe column order

The system SHALL produce a worksheet with the same Vietnamese column headers as the original "quản lý xe" template. Column data SHALL be sourced from VehicleRecord fields:

- STT → row index
- HỌ VÀ TÊN → `VehicleRecord.tenTaiXe`
- SĐT → `VehicleRecord.sdt`
- SỐ XE → `VehicleRecord.bienSo`
- LOẠI XE → `VehicleRecord.loaiXe`
- HẠN ĐĂNG KIỂM → `VehicleRecord.hanDangKiem` (formatted DD/MM/YYYY)
- HẠN BẢO HIỂM → `VehicleRecord.hanBaoHiem` (formatted DD/MM/YYYY)
- HẠN CÀ VẸT → `VehicleRecord.hanCaVet` (formatted DD/MM/YYYY)
- SỐ MOOC → first `VehicleRecordMooc.soMooc` (if any)
- HẠN ĐĂNG KIỂM MOOC → first mooc's `hanDangKiem`
- HẠN BẢO HIỂM MOOC → first mooc's `hanBaoHiem`
- HẠN CÀ VẸT MOOC → first mooc's `hanCaVet`

#### Scenario: Each data row maps to one VehicleRecord with its first mooc

- **WHEN** a VehicleRecord has one or more moocs
- **THEN** the exported row contains the VehicleRecord fields and the first mooc's data in the same row

#### Scenario: VehicleRecord with no mooc exports empty mooc columns

- **WHEN** a VehicleRecord has no moocs
- **THEN** the mooc columns (SỐ MOOC, HẠN ĐĂNG KIỂM MOOC, HẠN BẢO HIỂM MOOC, HẠN CÀ VẸT MOOC) are empty

### Requirement: Expiry date columns are formatted as DD/MM/YYYY strings

The system SHALL write compliance date fields as DD/MM/YYYY formatted strings. Null dates SHALL be written as an empty cell.

#### Scenario: Non-null date is formatted as DD/MM/YYYY

- **WHEN** a VehicleRecord has `hanDangKiem = 2026-07-01`
- **THEN** the cell contains "01/07/2026"

#### Scenario: Null date writes empty cell

- **WHEN** a VehicleRecord has `hanDangKiem = null`
- **THEN** the corresponding cell is empty
