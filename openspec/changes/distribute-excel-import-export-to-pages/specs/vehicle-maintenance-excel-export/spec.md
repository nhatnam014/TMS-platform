## ADDED Requirements

### Requirement: Any authenticated user can export vehicle maintenance records as a multi-sheet Excel file grouped by loại xe

The system SHALL provide `GET /api/v1/export/vehicle-maintenance` that accepts an optional `units` query parameter (comma-separated `loaiXe` values) and returns an `.xlsx` file with one worksheet per selected `loaiXe`. If `units` is omitted or empty, all `loaiXe` values present in `VehicleRecord` are included. The response MUST include `Content-Disposition: attachment; filename="bao-duong-xe.xlsx"` and `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. The endpoint MUST require a valid authenticated session (`JwtAuthGuard`) but MUST NOT restrict by role.

Each sheet's column set SHALL be: STT, SỐ XE (bienSo), Tài xế (tenTaiXe), PHONE (sdt), NGÀY LÀM (ngayLam), LOẠI XE (loaiXe), ĐƠN VỊ SỬA CHỮA (donViSuaChua), KM CÒN LẦN 1 ... KM CÒN LẦN {maxN} (one column per KM round present across the exported records), and a trailing ID column.

#### Scenario: Export with no units parameter includes every loại xe

- **WHEN** an authenticated user requests `GET /api/v1/export/vehicle-maintenance` without a `units` parameter
- **THEN** the response is an `.xlsx` file with one worksheet per distinct `loaiXe` value found in `VehicleRecord`

#### Scenario: Export with units parameter includes only the selected loại xe

- **WHEN** an authenticated user requests `GET /api/v1/export/vehicle-maintenance?units=Đầu%20kéo,Sơ%20mi%20rơ%20moóc`
- **THEN** the response contains only worksheets for "Đầu kéo" and "Sơ mi rơ moóc", each with the matching `VehicleRecord` rows

#### Scenario: KM round columns adapt to the maximum round count in the export

- **WHEN** the exported records collectively have KM rounds numbered 1 through 4
- **THEN** each sheet has columns "KM CÒN LẦN 1" through "KM CÒN LẦN 4", blank for any record missing a given round

#### Scenario: Non-ADMIN authenticated role is not rejected

- **WHEN** a user authenticated with a role other than ADMIN calls `GET /api/v1/export/vehicle-maintenance`
- **THEN** the request succeeds and returns the export file, not HTTP 403

#### Scenario: Unauthenticated request is rejected

- **WHEN** a request with no valid JWT is made to `GET /api/v1/export/vehicle-maintenance`
- **THEN** the API returns HTTP 401

#### Scenario: Response triggers browser file download

- **WHEN** the frontend opens the export URL
- **THEN** the browser receives `Content-Disposition: attachment; filename="bao-duong-xe.xlsx"` and saves the file
