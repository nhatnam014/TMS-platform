## MODIFIED Requirements

### Requirement: Admin can bulk-import vehicle records from Excel

The system SHALL provide `POST /api/v1/import/vehicles` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file. The endpoint MUST parse the "quản lý xe" sheet, INSERT new `VehicleRecord` and `VehicleRecordMooc` rows (no upsert, no deduplication), and return `{ imported: number, warnings: string[], errors: string[] }` with HTTP 200. The endpoint SHALL be restricted to users with role ADMIN. The system SHALL validate only that the sheet contains the expected header columns; it SHALL NOT enforce any uniqueness constraint on any field value.

#### Scenario: Valid upload returns import summary

- **WHEN** an admin uploads a valid "quản lý xe" Excel file
- **THEN** the API returns HTTP 200 with `{ imported: N, warnings: [], errors: [] }` where `imported` equals the number of `VehicleRecord` rows created

#### Scenario: Same file uploaded twice creates duplicate records

- **WHEN** the same Excel file is uploaded twice
- **THEN** the second upload creates new `VehicleRecord` rows identical to the first, returns HTTP 200, and `errors` is empty — no uniqueness error is raised

#### Scenario: Non-admin role is rejected

- **WHEN** a user without ADMIN role uploads a file to `POST /api/v1/import/vehicles`
- **THEN** the API returns HTTP 403

#### Scenario: File size exceeds 5 MB limit

- **WHEN** an admin uploads a file larger than 5 MB
- **THEN** the API returns HTTP 413 and does not process any rows

### Requirement: Parser handles the "quản lý xe" continuation-row structure for VehicleRecord

The system SHALL process the "quản lý xe" sheet rows as follows: a row where the STT column is non-empty and the data is structurally valid SHALL produce one `VehicleRecord` creation with any mooc present in the same row as its first `VehicleRecordMooc`. A row where the STT column is empty and `soMooc` is non-empty SHALL be treated as a mooc continuation and attached to the most recently created `VehicleRecord`. Rows that are empty or have no identifiable data SHALL be silently skipped. The parser SHALL extract all of: `tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, `hanCaVet` (vehicle), `soMooc`, `hanDangKiem` (mooc), `hanBaoHiem` (mooc), `hanCaVet` (mooc).

#### Scenario: STT row creates VehicleRecord

- **WHEN** a row has a non-empty STT cell
- **THEN** a new `VehicleRecord` is created with all extractable fields; if `soMooc` is also present on the same row a `VehicleRecordMooc` is created and linked to that record

#### Scenario: Continuation row appends mooc to preceding VehicleRecord

- **WHEN** a row has an empty STT cell and a non-empty `soMooc` cell following a record row
- **THEN** a `VehicleRecordMooc` is created and its `vehicleRecordId` is set to the most recently created `VehicleRecord`

#### Scenario: Continuation mooc row with no preceding record is skipped

- **WHEN** a continuation mooc row appears but no `VehicleRecord` has been created yet in that import run
- **THEN** the row is skipped and an entry is added to `errors` with the row number and reason

#### Scenario: hanCaVet column is extracted for vehicle row

- **WHEN** the sheet has a column matching "hạn cà vẹt" (or "han ca vet") and a vehicle row has a date value in that cell
- **THEN** `VehicleRecord.hanCaVet` is set to the parsed date

#### Scenario: hanCaVet column is extracted for mooc

- **WHEN** the sheet has a column matching "hạn cà vẹt mooc" (or variant) and a mooc row or continuation row has a date value in that cell
- **THEN** `VehicleRecordMooc.hanCaVet` is set to the parsed date

#### Scenario: Missing hanCaVet column is silently ignored

- **WHEN** the sheet has no column matching any `hanCaVet` variant for vehicle or mooc
- **THEN** the import proceeds normally with `hanCaVet` stored as null; no error is raised

### Requirement: Import result reports only structural row errors

The system SHALL populate `errors` with a message for each row that was skipped due to a structural issue (e.g., a continuation mooc row with no preceding record). The system SHALL NOT add warnings for newly created records — since every row creates a new record, no distinction between "new" and "existing" is made. `warnings` SHALL be an empty array in normal operation.

#### Scenario: Continuation row before any record row is reported as error

- **WHEN** the first data row has an empty STT and a non-empty soMooc
- **THEN** `errors` contains an entry referencing that row number and `imported` is 0

#### Scenario: Fully empty row is silently skipped

- **WHEN** a row has all cells empty
- **THEN** it is skipped with no entry added to `errors` or `warnings`

#### Scenario: Normal import produces empty errors and warnings

- **WHEN** a well-formed file is imported
- **THEN** both `errors` and `warnings` are empty arrays and `imported` equals the number of valid STT rows
