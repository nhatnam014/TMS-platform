## ADDED Requirements

### Requirement: Admin can export vehicle compliance data as a flat Excel file
The system SHALL provide `GET /api/v1/export/vehicles` that returns an `.xlsx` file with Vietnamese column headers matching the "quản lý xe" sheet column order. The response MUST include `Content-Disposition: attachment; filename="quan-ly-xe.xlsx"` and `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. The endpoint SHALL be restricted to users with role ADMIN.

#### Scenario: Export returns all active vehicles
- **WHEN** an admin requests `GET /api/v1/export/vehicles`
- **THEN** the response is an `.xlsx` file containing all Vehicle records with their associated Driver and Trailer compliance data

#### Scenario: Non-admin role is rejected
- **WHEN** a user without ADMIN role calls `GET /api/v1/export/vehicles`
- **THEN** the API returns HTTP 403

#### Scenario: Response triggers browser file download
- **WHEN** the frontend opens the export URL
- **THEN** the browser receives `Content-Disposition: attachment; filename="quan-ly-xe.xlsx"` and saves the file

### Requirement: Exported Excel matches the Vietnamese column header order for quản lý xe
The system SHALL produce a worksheet with headers and column order matching the original "quản lý xe" template: STT, HỌ VÀ TÊN (driver), NGÀY SINH, ĐỊA CHỈ, SỐ XE, LOẠI XE, HẠN ĐĂNG KIỂM, HẠN PHÙ HIỆU, HẠN BẢO HIỂM XE, SỐ MOOC, HẠN ĐĂNG KIỂM MOOC, HẠN BẢO HIỂM MOOC. Phase 1 uses flat rows — no merged cells.

#### Scenario: Header row contains Vietnamese column names
- **WHEN** the export file is opened
- **THEN** row 1 contains the Vietnamese headers in the specified order

#### Scenario: Each data row maps to one vehicle record with its linked driver and trailer
- **WHEN** a vehicle has one associated driver and one trailer
- **THEN** the exported row contains vehicle plate, driver name, and trailer number in the same row

### Requirement: Exported columns have appropriate widths for compliance data
The system SHALL set column widths on the export worksheet so that Vietnamese header text and date values are fully visible without manual resizing.

#### Scenario: Column widths are explicitly set
- **WHEN** the export file is opened in Excel
- **THEN** columns have widths wider than the default (8.43 characters)

### Requirement: Expiry date columns are formatted as DD/MM/YYYY strings
The system SHALL write compliance date fields (đăng kiểm, phù hiệu, bảo hiểm) as DD/MM/YYYY formatted strings. Null dates SHALL be written as an empty cell.

#### Scenario: Non-null date is formatted as DD/MM/YYYY
- **WHEN** a vehicle has `registrationExpiry = 2026-07-01`
- **THEN** the cell contains "01/07/2026"

#### Scenario: Null date writes empty cell
- **WHEN** a vehicle has `registrationExpiry = null`
- **THEN** the corresponding cell is empty
