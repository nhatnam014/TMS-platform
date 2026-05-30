### Requirement: Admin can bulk-import trip plans from Excel
The system SHALL provide `POST /api/v1/import/trip-plans` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file. The endpoint MUST parse the "kế hoạch xe" sheet, insert TripPlan and TripCost records, auto-create missing reference entities (Customer, Carrier, Location, Container, Vehicle), and return `{ imported: number, warnings: string[], errors: string[] }` with HTTP 200. The endpoint SHALL be restricted to users with role ADMIN.

#### Scenario: Valid upload returns import summary
- **WHEN** an admin uploads a valid "kế hoạch xe" Excel file
- **THEN** the API returns HTTP 200 with `{ imported: N, warnings: [...], errors: [...] }` where `imported` counts TripPlan rows inserted

#### Scenario: Non-admin role is rejected
- **WHEN** a user without ADMIN role uploads a file to `POST /api/v1/import/trip-plans`
- **THEN** the API returns HTTP 403

#### Scenario: File size exceeds 5 MB limit
- **WHEN** an admin uploads a file larger than 5 MB
- **THEN** the API returns HTTP 413 and does not process any rows

### Requirement: Trip plan rows are always inserted (not upserted)
The system SHALL insert each trip plan row as a new TripPlan record. Re-importing the same file produces duplicate TripPlan rows. This is intentional because TripPlan has no natural unique key across imports.

#### Scenario: Re-import creates new rows
- **WHEN** the same "kế hoạch xe" file is uploaded twice
- **THEN** the second upload creates additional TripPlan records; `imported` equals the same value as the first upload

### Requirement: Missing reference entities are auto-created with warnings
The system SHALL auto-create Customer, Carrier, Location, Container, and Vehicle records when they are referenced in the Excel but do not exist in the database. Each auto-created entity SHALL produce a warning message in the result. Location matching MUST be case-insensitive on the `name` field.

#### Scenario: Unknown carrier auto-creates carrier and adds warning
- **WHEN** a row references a carrier name not in the database
- **THEN** a new Carrier record is created with that name, and `warnings` includes a message identifying the new carrier

#### Scenario: Unknown customer auto-creates customer and adds warning
- **WHEN** a row references a customer name not in the database
- **THEN** a new Customer record is created with that name, and `warnings` includes a message identifying the new customer

#### Scenario: Unknown location auto-creates location and adds warning
- **WHEN** a row references a location name not found by case-insensitive match
- **THEN** a new Location record is created with that name, and `warnings` includes a message identifying the new location

#### Scenario: Container number always auto-creates if absent
- **WHEN** a row references a container number not in the database
- **THEN** a new Container record is created; no warning is added (containers are expected to be new daily)

#### Scenario: Unknown vehicle plate auto-creates vehicle and adds warning
- **WHEN** a row references a vehicle plate not in the database
- **THEN** a new Vehicle record is created, and `warnings` includes a message identifying the new plate

### Requirement: Container size is normalized from Excel strings to Prisma enum
The system SHALL map Excel container size strings to the Prisma `ContainerSize` enum. Blank size cells SHALL fall back to inference from 20'/40'/45' flag columns. Unrecognized values SHALL add a row-level error and skip the row.

#### Scenario: "20GP" maps to GP20
- **WHEN** the container size cell contains "20GP", "20'GP", or "20"
- **THEN** the Container record is created with `sizeType = GP20`

#### Scenario: "40HC" maps to HC40
- **WHEN** the container size cell contains "40HC", "40HQ", or "40'HC"
- **THEN** the Container record is created with `sizeType = HC40`

#### Scenario: Blank size with 20' flag column marked X infers GP20
- **WHEN** the size cell is blank and the 20' flag column contains "X" or "x"
- **THEN** the Container record is created with `sizeType = GP20`

#### Scenario: Unrecognized size string skips the row
- **WHEN** the size cell contains an unrecognized value
- **THEN** the row is skipped and `errors` includes a message with the row number and the invalid value

### Requirement: Import result identifies all auto-created and skipped records
The system SHALL populate `warnings` with auto-created entity messages and `errors` with skipped-row messages. Neither field causes HTTP 4xx. A single summary AuditLog entry SHALL be created for the entire import, not one per row.

#### Scenario: No hard failure on partial errors
- **WHEN** some rows are invalid but others are valid
- **THEN** valid rows are inserted, invalid rows are listed in `errors`, and the API returns HTTP 200
