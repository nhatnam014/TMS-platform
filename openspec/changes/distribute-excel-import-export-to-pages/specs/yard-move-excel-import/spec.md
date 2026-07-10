## MODIFIED Requirements

### Requirement: Any authenticated user can bulk-import yard moves from Excel

The system SHALL provide `POST /api/v1/import/yard-moves` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file matching the "lệnh bãi" export column layout (STT, NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO, optional trailing ID).

The endpoint operates in two modes controlled by the `?confirm=true` query parameter:

**Preview mode** (default, no `?confirm=true`): Parse the file and return counts WITHOUT writing any data. Response: `{ toCreate: number, toUpdate: number, warnings: string[], errors: string[] }`. HTTP 200.

**Execute mode** (`?confirm=true`): Parse and execute: create new `YardMove` records for rows with no matching ID, update existing records for rows with a matching ID. Response: `{ imported: number, updated: number, warnings: string[], errors: string[], changedRecords: ChangedRecord[] }`. HTTP 200.

The endpoint MUST require a valid authenticated session (`JwtAuthGuard`) but MUST NOT restrict by role — any authenticated user, regardless of role, may call it in either mode. File size limit of 5 MB applies to both modes.

#### Scenario: Preview returns create/update counts without writing data

- **WHEN** an authenticated user uploads a file containing a mix of rows with and without an ID matching an existing `YardMove` (no `?confirm=true`)
- **THEN** the API returns HTTP 200 with `{ toCreate: N, toUpdate: M, warnings: [], errors: [] }` and no rows are created or modified

#### Scenario: Execute mode creates and updates records

- **WHEN** an authenticated user uploads the file with `?confirm=true`
- **THEN** rows without a recognized ID create new `YardMove` records; rows with an ID matching an existing record update that record's fields; the API returns `{ imported: N, updated: M, warnings: [], errors: [], changedRecords: [...] }`

#### Scenario: Non-ADMIN authenticated role is not rejected

- **WHEN** a user authenticated with a role other than ADMIN uploads a file
- **THEN** the request is processed normally (HTTP 200), not rejected with HTTP 403

#### Scenario: Unauthenticated request is rejected

- **WHEN** a request with no valid JWT is made to `POST /api/v1/import/yard-moves`
- **THEN** the API returns HTTP 401

#### Scenario: File size exceeds 5 MB limit

- **WHEN** an authenticated user uploads a file larger than 5 MB
- **THEN** the API returns HTTP 413 and does not process any rows
