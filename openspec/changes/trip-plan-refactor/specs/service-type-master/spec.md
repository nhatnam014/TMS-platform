## ADDED Requirements

### Requirement: ServiceType master table stores managed service types

The system SHALL have a `service_types` table with columns: `id` (cuid PK), `code` (String, UNIQUE, e.g. "SEA-EX"), `description` (String), `isActive` (Boolean, default true), `createdAt`, `updatedAt`. The table SHALL be seeded with 4 records: `{ code: "SEA-EX", description: "SEA - EXPORT" }`, `{ code: "SEA-IM", description: "SEA - IMPORT" }`, `{ code: "NEO-EX", description: "NEO - EXPORT" }`, `{ code: "NEO-IM", description: "NEO - IMPORT" }`.

The `ServiceType` Prisma enum SHALL be removed. `TripPlan.serviceType` enum column SHALL be replaced by `serviceTypeId String FK → service_types.id` (NOT NULL).

#### Scenario: Seeded service types exist after migration

- **WHEN** the database migration runs
- **THEN** `SELECT COUNT(*) FROM service_types` returns 4 and each of the 4 codes is present

#### Scenario: service_types code is unique

- **WHEN** an attempt is made to insert a record with a duplicate `code`
- **THEN** the database rejects the insert with a unique constraint violation

#### Scenario: TripPlan row references service_types via FK

- **WHEN** a TripPlan is created
- **THEN** `trip_plans.service_type_id` references a valid `service_types.id`

---

### Requirement: Service type CRUD API

The API SHALL expose four endpoints requiring JWT authentication:

- `GET /api/service-types` — returns all service types ordered by `code`, shape `{ id, code, description, isActive }`
- `POST /api/service-types` — creates a new service type; body `{ code: string, description: string }`. Returns HTTP 201.
- `PATCH /api/service-types/:id` — updates `code`, `description`, or `isActive`. Returns HTTP 200.
- `DELETE /api/service-types/:id` — hard-deletes the record if no TripPlan references it; returns HTTP 409 if in use. Returns HTTP 200 on success.

#### Scenario: GET returns all service types

- **WHEN** `GET /api/service-types` is called
- **THEN** the response is HTTP 200 with an array including all active and inactive service types ordered by `code`

#### Scenario: POST creates a new service type

- **WHEN** `POST /api/service-types` is called with `{ code: "DOM-EX", description: "Domestic Export" }`
- **THEN** the response is HTTP 201 and a new row with `code = "DOM-EX"` exists in `service_types`

#### Scenario: POST rejects duplicate code

- **WHEN** `POST /api/service-types` is called with a `code` that already exists
- **THEN** the response is HTTP 409

#### Scenario: PATCH updates description

- **WHEN** `PATCH /api/service-types/:id` is called with `{ description: "Sea Export" }`
- **THEN** the response is HTTP 200 and `description` is updated

#### Scenario: DELETE blocked when in use

- **WHEN** `DELETE /api/service-types/:id` is called for a service type referenced by at least one TripPlan
- **THEN** the response is HTTP 409 with an error message indicating it is in use

#### Scenario: DELETE succeeds when not in use

- **WHEN** `DELETE /api/service-types/:id` is called for a service type with no TripPlan references
- **THEN** the response is HTTP 200 and the record is removed

---

### Requirement: Service type management page

The web app SHALL provide a `/service-types` page listing all service types in a table with columns: Code, Description, Active, Actions (Edit, Delete). A "Thêm loại dịch vụ" button opens a modal form with fields Code and Description. Inline edit button opens a modal pre-filled with current values. Delete prompts confirmation; shows error if in use.

The nav sidebar SHALL include a link to `/service-types` under the system management section.

#### Scenario: Page lists all service types

- **WHEN** the user navigates to `/service-types`
- **THEN** a table shows all service types with Code, Description, and Active status columns

#### Scenario: Create new service type via modal

- **WHEN** the user clicks "Thêm loại dịch vụ", fills in Code and Description, and submits
- **THEN** `POST /api/service-types` is called and the new service type appears in the table

#### Scenario: Edit service type via modal

- **WHEN** the user clicks "Sửa" on a row, updates the Description, and submits
- **THEN** `PATCH /api/service-types/:id` is called and the updated description is shown

#### Scenario: Delete in-use service type shows error

- **WHEN** the user clicks "Xóa" on a service type used by a trip plan and confirms
- **THEN** a toast error message is shown and the record remains in the table

---

### Requirement: Trip plan form service type field uses service_types select

The trip plan create and edit modal form SHALL replace the hardcoded `ServiceType` enum select with a `<select>` populated from `GET /api/service-types` (active records only, ordered by code). The stored value is `serviceTypeId`.

#### Scenario: Form loads service types from API

- **WHEN** the user opens the create trip modal
- **THEN** the Service Type dropdown contains options fetched from `GET /api/service-types`

#### Scenario: Submitting form sends serviceTypeId

- **WHEN** the user selects a service type and submits the form
- **THEN** the POST body includes `serviceTypeId` (not a `serviceType` enum string)
