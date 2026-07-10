## MODIFIED Requirements

### Requirement: Any authenticated user can bulk-import vehicle records from Excel

The system SHALL provide `POST /api/v1/import/vehicles` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file.

The endpoint operates in two modes controlled by the `?confirm=true` query parameter:

**Preview mode** (default, no `?confirm=true`): Parse the file and return a conflict analysis WITHOUT writing any data. Response: `{ toCreate: number, conflicts: ConflictEntry[], errors: string[] }`. HTTP 200.

**Execute mode** (`?confirm=true`): Parse and execute: driver findOrCreate, vehicle upserts for conflicts, VehicleRecord/VehicleRecordMooc creation. Response: `{ imported: number, warnings: string[], errors: string[] }`. HTTP 200.

The endpoint MUST require a valid authenticated session (`JwtAuthGuard`) but MUST NOT restrict by role — any authenticated user, regardless of role, may call it in either mode. File size limit of 5 MB applies to both modes.

#### Scenario: Preview returns conflict list without writing data

- **WHEN** an authenticated user uploads a file containing a bienSo that already exists in the Vehicle table with differing field values (no `?confirm=true`)
- **THEN** the API returns HTTP 200 with `{ toCreate: N, conflicts: [...], errors: [] }` and no rows are created or modified in any table

#### Scenario: Preview with no conflicts returns empty conflicts array

- **WHEN** the uploaded file contains only bienSo values absent from the Vehicle table and no `?confirm=true`
- **THEN** the API returns HTTP 200 with `{ toCreate: N, conflicts: [], errors: [] }`

#### Scenario: Execute mode creates all records and updates conflicting vehicles

- **WHEN** an authenticated user uploads the file with `?confirm=true`
- **THEN** drivers are upserted by (fullName, phone), conflicting vehicles are updated, VehicleRecord and VehicleRecordMooc rows are created; the API returns `{ imported: N, warnings: [], errors: [] }`

#### Scenario: Non-ADMIN authenticated role is not rejected

- **WHEN** a user authenticated with a role other than ADMIN uploads a file
- **THEN** the request is processed normally (HTTP 200), not rejected with HTTP 403

#### Scenario: Unauthenticated request is rejected

- **WHEN** a request with no valid JWT is made to `POST /api/v1/import/vehicles`
- **THEN** the API returns HTTP 401

#### Scenario: File size exceeds 5 MB limit

- **WHEN** an authenticated user uploads a file larger than 5 MB
- **THEN** the API returns HTTP 413 and does not process any rows
