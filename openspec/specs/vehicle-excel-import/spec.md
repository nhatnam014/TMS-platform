### Requirement: Admin can bulk-import vehicles, drivers, and trailers from Excel
The system SHALL provide `POST /api/v1/import/vehicles` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file. The endpoint MUST parse the "quản lý xe" sheet, upsert Vehicle, Driver, and Trailer records, and return `{ imported: number, warnings: string[], errors: string[] }` with HTTP 200. The endpoint SHALL be restricted to users with role ADMIN.

#### Scenario: Valid upload returns import summary
- **WHEN** an admin uploads a valid "quản lý xe" Excel file
- **THEN** the API returns HTTP 200 with `{ imported: N, warnings: [...], errors: [...] }` where `imported` is the count of rows processed

#### Scenario: Duplicate rows are upserted without error
- **WHEN** the same Excel file is uploaded twice
- **THEN** the second upload returns HTTP 200 with `imported` equal to the first, no duplicate-key errors, and `errors` is empty

#### Scenario: Non-admin role is rejected
- **WHEN** a user without ADMIN role uploads a file to `POST /api/v1/import/vehicles`
- **THEN** the API returns HTTP 403

#### Scenario: File size exceeds 5 MB limit
- **WHEN** an admin uploads a file larger than 5 MB
- **THEN** the API returns HTTP 413 and does not process any rows

### Requirement: Parser handles the "quản lý xe" continuation-row structure
The system SHALL process rows where the STT column is empty but SỐ MOOC is non-empty as additional trailers belonging to the most recently seen vehicle. Vehicle rows (STT non-empty, plate present, driver name present) SHALL also upsert the associated Driver and optionally the first Trailer in the same row.

#### Scenario: Continuation row appends trailer to preceding vehicle
- **WHEN** a row has an empty STT cell and a non-empty SỐ MOOC cell following a vehicle row
- **THEN** a Trailer record is created and its `vehicleId` is set to the vehicle from the preceding STT row

#### Scenario: Vehicle row with driver upserts both records
- **WHEN** a row has STT, a license plate (SỐ XE), and a driver name (HỌ VÀ TÊN)
- **THEN** both a Vehicle and a Driver record are upserted; Driver.vehicleId is set to the upserted Vehicle's id

#### Scenario: Vehicle-only row (no driver) creates only vehicle
- **WHEN** a row has STT and a license plate but no driver name (e.g., "Xe Chờ Tài")
- **THEN** only a Vehicle record is upserted; no Driver record is created

#### Scenario: Orphan trailer row (STT present, no vehicle, mooc present) creates trailer without vehicleId
- **WHEN** a row has STT, no license plate, and a SỐ MOOC value
- **THEN** a Trailer record is upserted with `vehicleId` null and `currentVehicleId` null

### Requirement: Import tolerates mixed date formats in compliance expiry columns
The system SHALL parse expiry date cells that are either Excel serial integers (value > 40000) or DD/MM/YYYY strings. Cells containing non-date strings (e.g., "K CẦN MUA") SHALL be stored as null without raising an error.

#### Scenario: Excel serial date is converted correctly
- **WHEN** a date cell contains the integer 46821
- **THEN** the parsed Date equals 2028-03-10 (Excel epoch offset applied)

#### Scenario: DD/MM/YYYY string is parsed correctly
- **WHEN** a date cell contains the string "01/07/2026"
- **THEN** the parsed Date equals 2026-07-01

#### Scenario: Non-date string yields null
- **WHEN** a date cell contains "K CẦN MUA"
- **THEN** the field is stored as null and no error is added to the result

### Requirement: Import result identifies auto-created and skipped records
The system SHALL populate `warnings` with a message for each new record that was auto-created (e.g., an entity that did not exist before import). The system SHALL populate `errors` with a message for each row that was skipped and the reason (e.g., missing required field).

#### Scenario: New vehicle record produces a warning
- **WHEN** a vehicle plate did not exist before import
- **THEN** `warnings` includes a message identifying the new plate

#### Scenario: Row missing required plate is skipped
- **WHEN** a non-continuation row has an empty SỐ XE and empty driver name
- **THEN** the row is skipped and `errors` includes a message with the row number
