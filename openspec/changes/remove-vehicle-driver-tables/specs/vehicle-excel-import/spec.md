## MODIFIED Requirements

### Requirement: Admin can bulk-import vehicle records from Excel

The system SHALL provide `POST /api/v1/import/vehicles` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file.

The endpoint operates in two modes controlled by the `?confirm=true` query parameter:

**Preview mode** (default, no `?confirm=true`): Parse the file and return a row count WITHOUT writing any data. Response: `{ toCreate: number, warnings: [], errors: string[] }`. HTTP 200. There is no conflict detection — the preview only counts the number of VehicleRecord rows that would be created.

**Execute mode** (`?confirm=true`): Parse and write VehicleRecord and VehicleRecordMooc rows directly. The system SHALL NOT create or update any Driver or Vehicle records. Response: `{ imported: number, warnings: [], errors: string[] }`. HTTP 200.

In both modes the endpoint MUST be restricted to users with role ADMIN. File size limit of 5 MB applies to both modes.

#### Scenario: Preview returns row count without writing data

- **WHEN** an admin uploads a file without `?confirm=true`
- **THEN** the API returns HTTP 200 with `{ toCreate: N, warnings: [], errors: [] }` and no rows are written to any table

#### Scenario: Execute mode creates VehicleRecord rows only

- **WHEN** an admin uploads the file with `?confirm=true`
- **THEN** VehicleRecord and VehicleRecordMooc rows are created; no Driver or Vehicle rows are created or modified; the API returns `{ imported: N, warnings: [], errors: [] }`

#### Scenario: Non-admin role is rejected

- **WHEN** a user without ADMIN role uploads a file
- **THEN** the API returns HTTP 403

#### Scenario: File size exceeds 5 MB limit

- **WHEN** an admin uploads a file larger than 5 MB
- **THEN** the API returns HTTP 413 and does not process any rows

## REMOVED Requirements

### Requirement: Vehicle conflict detection in import preview

**Reason**: The Vehicle table is removed. There are no Vehicle records to conflict with. The preview response no longer includes a `conflicts` array.

**Migration**: Remove `detectVehicleConflict` method from `ImportService`. Remove `VehicleConflictEntry` and `VehicleImportPreviewResult` types from `@tms/shared`. The preview endpoint returns `{ toCreate, warnings: [], errors }` using the standard `ImportResult`-compatible shape.
