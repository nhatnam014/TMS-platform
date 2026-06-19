## ADDED Requirements

### Requirement: Admin can import vehicle maintenance records from multi-sheet Excel

The system SHALL provide `POST /api/import/vehicle-maintenance` accepting `multipart/form-data`
with a `file` field containing an `.xlsx` file. The endpoint SHALL iterate over every worksheet in
the workbook; the worksheet name is used as the default `loaiXe` value for all rows parsed from that sheet.
The endpoint returns `{ imported: number, updated: number, warnings: string[], errors: string[] }`
with HTTP 200. The endpoint SHALL be restricted to users with role ADMIN.

Column mapping (1-based, matching the customer's template):

- Col 1 (TT): ignored (display sequence number)
- Col 2 (SỐ XE): `bienSo`
- Col 3 (Tài xế): `tenTaiXe`
- Col 4 (phone): `sdt`
- Col 5 (NGÀY LÀM): `ngayLam` (Date — supports DD/MM/YYYY, DD/MM/YY, and Excel serial formats)
- Col 6 (ĐƠN VỊ SỬA CHỮA / LOẠI XE): `loaiXe` — vehicle brand/type (e.g., CHENGLONG, SHACMAN); if non-empty, overrides the sheet name as the grouping key
- Col 7 (ĐƠN VỊ SỬA CHỮA): `donViSuaChua` — repair shop / service provider name (e.g., "CHENG LONG", "SHACMAN")
- Col 8 (SỐ KM BẢO DƯỠNG): `soKmBaoDuong` (Decimal)
- Col 9 (KÌ BẢO DƯỠNG TIẾP THEO): `kiBaoDuongTiepTheo` (Decimal)
- Col 10 (SỐ KM HIỆN TẠI): `soKmHienTai` (Decimal)
- Col 11 (KM ĐÃ CHẠY): ignored (computed field, not stored)
- Col 12 (KM CÒN: HẠN BẢO DƯỠNG LẦN 2): ignored (computed field, not stored)
- Col 13 (KM CÒN: HẠN BẢO DƯỠNG LẦN 3): ignored (computed field, not stored)
- Last col (ID): `id` — if non-empty, UPDATE existing record; if empty, CREATE new record

The parser SHALL skip rows where `ngayLam` is empty (no maintenance date = not a data row). The
parser SHALL handle merged cells in the SỐ XE, Tài xế, and phone columns by detecting rows where
those cells are empty but a date is present — in that case it reuses the last-seen values for
those fields. `loaiXe` defaults to the sheet name when col 6 is empty.

#### Scenario: Valid upload returns import summary

- **WHEN** a valid `.xlsx` file with two sheets "CHENGLONG" and "SHACMAN" is uploaded
- **THEN** the system parses all rows from both sheets, creates/updates records, and returns `{ imported: N, updated: M, warnings: [], errors: [] }` with HTTP 200

#### Scenario: Sheet name sets loaiXe when col 6 is empty

- **WHEN** a sheet named "SHACMAN" contains rows with no value in col 6
- **THEN** all records created from that sheet have `loaiXe = "SHACMAN"`

#### Scenario: Non-empty col 6 overrides sheet name for loaiXe

- **WHEN** a row in sheet "SHACMAN" has col 6 value "HINO"
- **THEN** the record is created with `loaiXe = "HINO"`

#### Scenario: Row with ID column triggers update

- **WHEN** a row contains a valid existing record id in the last column
- **THEN** the existing record is updated with the row's values; `updated` count increments

#### Scenario: Row without ID creates new record

- **WHEN** a row has an empty ID column
- **THEN** a new record is created; `imported` count increments

#### Scenario: bienSo auto-links to VehicleRecord

- **WHEN** a row's `bienSo` matches an existing `VehicleRecord.bienSo`
- **THEN** the created/updated record has `vehicleRecordId` set to that VehicleRecord's id

#### Scenario: Row skipped when ngayLam is empty

- **WHEN** a row has no value in the NGÀY LÀM column
- **THEN** the row is silently skipped; it does not appear in errors or warnings

#### Scenario: Merged-cell rows inherit vehicle info from previous row

- **WHEN** a row has an empty SỐ XE cell but a valid ngayLam (merged-cell pattern)
- **THEN** the row is parsed using the bienSo, tenTaiXe, sdt values from the most recent non-empty row

#### Scenario: Invalid file format returns 400

- **WHEN** the uploaded file is not a valid `.xlsx` file
- **THEN** the system responds with HTTP 400 and an error message

---

### Requirement: Import/export page shows vehicle maintenance import section

The system SHALL add a new upload section to the existing `/import-export` page titled
"Nhập bảo dưỡng xe" allowing ADMIN users to upload an `.xlsx` file and trigger the import.
The section SHALL display the returned `{ imported, updated, warnings, errors }` result inline.

#### Scenario: Successful import shows result

- **WHEN** an admin uploads a valid maintenance Excel file
- **THEN** a success toast and inline result show the imported and updated counts plus any warnings
