## MODIFIED Requirements

### Requirement: Admin can bulk-import trip plans from Excel

The system SHALL provide `POST /api/v1/import/trip-plans` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file. The endpoint MUST parse the "kế hoạch xe" sheet, insert TripPlan and TripCost records, auto-create missing reference entities (Customer, Carrier, Location, Vehicle), and return `{ imported: number, warnings: string[], errors: string[] }` with HTTP 200. Container records are NOT created during import. The endpoint SHALL be restricted to users with role ADMIN.

#### Scenario: Valid upload returns import summary

- **WHEN** an admin uploads a valid "kế hoạch xe" Excel file
- **THEN** the API returns HTTP 200 with `{ imported: N, warnings: [...], errors: [...] }` where `imported` counts TripPlan rows inserted

#### Scenario: Non-admin role is rejected

- **WHEN** a user without ADMIN role uploads a file to `POST /api/v1/import/trip-plans`
- **THEN** the API returns HTTP 403

#### Scenario: File size exceeds 5 MB limit

- **WHEN** an admin uploads a file larger than 5 MB
- **THEN** the API returns HTTP 413 and does not process any rows

---

### Requirement: Missing reference entities are auto-created with warnings

The system SHALL auto-create Customer, Carrier, Location, and Vehicle records when they are referenced in the Excel but do not exist in the database. Each auto-created entity SHALL produce a warning message in the result. Location matching MUST be case-insensitive on the `name` field. Container records are NOT auto-created; container numbers are stored as plain strings on the TripPlan record.

#### Scenario: Unknown carrier auto-creates carrier and adds warning

- **WHEN** a row references a carrier name not in the database
- **THEN** a new Carrier record is created with that name, and `warnings` includes a message identifying the new carrier

#### Scenario: Unknown customer auto-creates customer and adds warning

- **WHEN** a row references a customer name not in the database
- **THEN** a new Customer record is created with that name, and `warnings` includes a message identifying the new customer

#### Scenario: Unknown location auto-creates location and adds warning

- **WHEN** a row references a location name not found by case-insensitive match
- **THEN** a new Location record is created with that name, and `warnings` includes a message identifying the new location

#### Scenario: Container number is stored as plain string, no record created

- **WHEN** a row contains a container number (e.g., "OOLU8990993")
- **THEN** the TripPlan is created with `outboundContainerNumber = "OOLU8990993"` as a plain string; no Container record is inserted

#### Scenario: Unknown vehicle plate auto-creates vehicle and adds warning

- **WHEN** a row references a vehicle plate not in the database
- **THEN** a new Vehicle record is created, and `warnings` includes a message identifying the new plate

## REMOVED Requirements

### Requirement: Container size is normalized from Excel strings to Prisma enum

**Reason**: Container entity removed. Container size is no longer stored.
**Migration**: Remove `findOrCreateContainer()` from `ImportService`. Remove `outboundContainerSize` and `inboundContainerSize` fields from `kehoach-xe.parser.ts` ParsedRow interface. The `normalizeContainerSize` utility MAY be retained for use in the export builder but its result MUST NOT be persisted.
