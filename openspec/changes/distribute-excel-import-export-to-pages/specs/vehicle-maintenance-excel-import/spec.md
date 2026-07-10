## ADDED Requirements

### Requirement: Any authenticated user can bulk-import vehicle maintenance records from a multi-sheet Excel file

The system SHALL provide `POST /api/v1/import/vehicle-maintenance` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file with one sheet per loại xe, matching the "bảo dưỡng xe" export layout. The endpoint MUST require a valid authenticated session (`JwtAuthGuard`) but MUST NOT restrict by role. File size limit of 5 MB applies. Response: `{ imported: number, updated: number, warnings: string[], errors: string[], changedRecords: ChangedRecord[], createdRecords: CreatedRecord[] }`. HTTP 200.

#### Scenario: Row with an ID matching an existing VehicleRecord is treated as an update

- **WHEN** a data row has a non-empty ID column value matching an existing `VehicleRecord.id`
- **THEN** the matching `VehicleRecord` is updated (bienSo, tenTaiXe, sdt, loaiXe, donViSuaChua, ngayLam, kmHienTai, ghiChuBaoDuong as present in the row) and the row counts toward `updated`

#### Scenario: Row with no ID or an unrecognized ID creates a new VehicleRecord

- **WHEN** a data row has an empty ID column, or an ID value that does not match any existing `VehicleRecord.id`
- **THEN** a new `VehicleRecord` is created from the row's fields and the row counts toward `imported`; if the ID was non-empty but unmatched, a warning is added noting the ID did not exist

#### Scenario: KM round columns are upserted per round number

- **WHEN** a row contains one or more "KM CÒN LẦN N" values
- **THEN** for each such value the system upserts a `VehicleMaintenanceKmRound` keyed by `(vehicleRecordId, roundNumber)`, creating it if absent or updating `kmCon` if present

#### Scenario: Updated record changes are captured for the changed-records report

- **WHEN** an update to an existing `VehicleRecord` or one of its KM rounds changes a field value
- **THEN** the change (field, old value, new value) is included in that record's entry in `changedRecords`, with KM round field names prefixed `kmRounds[Lần N].`

#### Scenario: Non-ADMIN authenticated role is not rejected

- **WHEN** a user authenticated with a role other than ADMIN uploads a file to `POST /api/v1/import/vehicle-maintenance`
- **THEN** the request is processed normally (HTTP 200), not rejected with HTTP 403

#### Scenario: Unauthenticated request is rejected

- **WHEN** a request with no valid JWT is made to `POST /api/v1/import/vehicle-maintenance`
- **THEN** the API returns HTTP 401
