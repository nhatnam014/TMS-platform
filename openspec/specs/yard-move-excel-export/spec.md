## Requirements

### Requirement: Admin can export yard moves as a flat Excel file

The system SHALL provide `GET /api/v1/export/yard-moves` that returns an `.xlsx` file with Vietnamese column headers matching the "lệnh bãi" sheet column order. The response MUST include `Content-Disposition: attachment; filename="lenh-bai.xlsx"` and `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. The endpoint SHALL be restricted to users with role ADMIN (via `JwtAuthGuard` + `RolesGuard`).

#### Scenario: Export returns all active yard moves

- **WHEN** an admin requests `GET /api/v1/export/yard-moves`
- **THEN** the response is an `.xlsx` file containing all `YardMove` records where `isActive = true`

#### Scenario: Non-admin role is rejected

- **WHEN** a user without ADMIN role calls `GET /api/v1/export/yard-moves`
- **THEN** the API returns HTTP 403

#### Scenario: Response triggers browser file download

- **WHEN** the frontend opens the export URL
- **THEN** the browser receives `Content-Disposition: attachment; filename="lenh-bai.xlsx"` and saves the file

### Requirement: Exported Excel uses the branded header layout and matches the lệnh bãi column order

The system SHALL produce a worksheet following the same branded layout used by the existing export builders (`kehoach-xe`, `quanly-xe`, `baoduong-xe`): logo image and title block on rows 1-8 (title "LỆNH BÃI"), column headers at row 9, data starting at row 10. The column order SHALL be: STT, NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO, followed by a hidden trailing `ID` column.

#### Scenario: Header row contains the lệnh bãi columns in order

- **WHEN** the export file is opened
- **THEN** row 9 contains the headers "STT", "NGÀY", "GPS", "FULL NAME", "TRUCK", "MOOC", "BOOKING", "CONTAINER", "GHI CHÚ", "DÃ KÉO" in that order, followed by a final "ID" column

#### Scenario: STT column reflects row position, not a stored field

- **WHEN** the export contains N records
- **THEN** the STT column contains sequential values 1..N matching each row's position in the export, regardless of any client-side filtering

#### Scenario: Each field is written as plain text with no format coercion

- **WHEN** a `YardMove` has `gps`, `fullName`, `truck`, `mooc`, `booking`, `containerNumber`, `notes`, `daKeo` values
- **THEN** each is written verbatim as a string cell with no validation or reformatting

#### Scenario: Null optional fields write empty cells

- **WHEN** a `YardMove` field is `null`
- **THEN** the corresponding cell is empty

#### Scenario: Trailing ID column is present but visually de-emphasized

- **WHEN** the export file is opened
- **THEN** the final column contains each record's `id` rendered in a greyed-out font, matching the convention used by the other three export builders

### Requirement: Exported columns have appropriate widths for the lệnh bãi data

The system SHALL set column widths on the export worksheet so that Vietnamese header text and typical field values (driver names, plate numbers, booking/container codes) are fully visible without manual resizing.

#### Scenario: Column widths are explicitly set

- **WHEN** the export file is opened in Excel
- **THEN** columns have widths wider than the default (8.43 characters)
