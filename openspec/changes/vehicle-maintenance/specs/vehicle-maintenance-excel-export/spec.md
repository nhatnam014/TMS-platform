## ADDED Requirements

### Requirement: Admin can export vehicle maintenance records as multi-sheet Excel

The system SHALL provide `GET /api/export/vehicle-maintenance` that accepts an optional `units`
query parameter (comma-separated list of `loaiXe` values — col F "ĐƠN VỊ SỬA CHỮA / LOẠI XE")
and returns an `.xlsx` file. Each distinct `loaiXe` value in the result set becomes a separate
worksheet named after that value. If `units` is omitted, all records are exported across all
available `loaiXe` values.
The response MUST include `Content-Disposition: attachment; filename="bao-duong-xe.xlsx"` and
`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
The endpoint SHALL be restricted to users with role ADMIN. Maximum 10 000 rows per unit.

Each worksheet SHALL contain the following columns in order:
TT, SỐ XE, Tài xế, phone, NGÀY LÀM, ĐƠN VỊ SỬA CHỮA / LOẠI XE, ĐƠN VỊ SỬA CHỮA,
SỐ KM BẢO DƯỠNG, KÌ BẢO DƯỠNG TIẾP THEO, SỐ KM HIỆN TẠI, KM ĐÃ CHẠY, KM CÒN, ID.

`KM ĐÃ CHẠY` and `KM CÒN` SHALL be populated as computed values in the exported file.
The ID column SHALL be styled in grey (small font, muted colour) to indicate system-managed data.
Rows SHALL be ordered by `ngayLam` ascending within each sheet.

#### Scenario: Export with selected units produces correct sheets

- **WHEN** an admin requests `GET /api/export/vehicle-maintenance?units=CHENGLONG,SHACMAN`
- **THEN** the response is an `.xlsx` file with exactly two sheets named "CHENGLONG" and "SHACMAN", each containing only records where `loaiXe` (col F) matches

#### Scenario: Export without units parameter exports all

- **WHEN** an admin requests `GET /api/export/vehicle-maintenance` without the `units` parameter
- **THEN** the response contains one sheet per distinct `loaiXe` value in the database

#### Scenario: Export single unit produces single-sheet file

- **WHEN** an admin requests `GET /api/export/vehicle-maintenance?units=SHACMAN`
- **THEN** the response is an `.xlsx` file with exactly one sheet named "SHACMAN"

#### Scenario: Response triggers browser file download

- **WHEN** the frontend opens the export URL
- **THEN** the browser receives `Content-Disposition: attachment; filename="bao-duong-xe.xlsx"`

#### Scenario: Non-admin role is rejected

- **WHEN** a user without ADMIN role calls the export endpoint
- **THEN** the API returns HTTP 403

---

### Requirement: Import/export page shows vehicle maintenance export section with unit selector

The system SHALL add a new export section to the `/import-export` page titled "Xuất bảo dưỡng xe".
The section SHALL fetch available units from `GET /api/vehicle-maintenance/distinct-units` (which
returns distinct `loaiXe` values — col F) and display them as checkboxes. A "Tất cả" toggle
selects/deselects all units. Clicking the download button calls the export endpoint with the
selected `loaiXe` values as the `units` query parameter.

#### Scenario: Unit checkboxes load dynamically

- **WHEN** an admin opens the import/export page
- **THEN** the export section shows one checkbox per distinct `loaiXe` value (col F) in the database

#### Scenario: Selecting subset of units exports only those sheets

- **WHEN** an admin selects only "CHENGLONG" and clicks download
- **THEN** the downloaded file contains only a "CHENGLONG" sheet

#### Scenario: "Tất cả" checkbox toggles all units

- **WHEN** an admin clicks "Tất cả" while some units are unchecked
- **THEN** all unit checkboxes become checked; clicking again unchecks all
