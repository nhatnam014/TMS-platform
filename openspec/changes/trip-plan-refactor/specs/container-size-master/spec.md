## ADDED Requirements

### Requirement: ContainerSize master table stores managed container sizes

The system SHALL have a `container_sizes` table with columns: `id` (cuid PK), `code` (String, UNIQUE, e.g. "40HC"), `name` (String, human-readable label e.g. "40ft High Cube"), `isActive` (Boolean, default true), `createdAt`, `updatedAt`. The table SHALL be seeded with these records: `20GP`, `20HC`, `40GP`, `40HC`, `45HC`.

The `TripPlan.containerSize String?` column SHALL be replaced by `containerSizeId String? FK → container_sizes.id` (nullable — container size is optional on a trip plan).

#### Scenario: Seeded container sizes exist after migration

- **WHEN** the database migration runs
- **THEN** `SELECT COUNT(*) FROM container_sizes` returns at least 5 and codes 20GP, 20HC, 40GP, 40HC, 45HC are present

#### Scenario: container_sizes code is unique

- **WHEN** an attempt is made to insert a record with a duplicate `code`
- **THEN** the database rejects the insert with a unique constraint violation

#### Scenario: TripPlan containerSizeId is nullable

- **WHEN** a TripPlan is created without a containerSize
- **THEN** `trip_plans.container_size_id` is NULL

---

### Requirement: Container size CRUD API

The API SHALL expose four endpoints requiring JWT authentication:

- `GET /api/container-sizes` — returns all container sizes ordered by `code`, shape `{ id, code, name, isActive }`
- `POST /api/container-sizes` — creates a new container size; body `{ code: string, name: string }`. Returns HTTP 201.
- `PATCH /api/container-sizes/:id` — updates `code`, `name`, or `isActive`. Returns HTTP 200.
- `DELETE /api/container-sizes/:id` — hard-deletes if no TripPlan references it; returns HTTP 409 if in use.

#### Scenario: GET returns all container sizes

- **WHEN** `GET /api/container-sizes` is called
- **THEN** the response is HTTP 200 with an array ordered by `code`

#### Scenario: POST creates new container size

- **WHEN** `POST /api/container-sizes` is called with `{ code: "45GP", name: "45ft General Purpose" }`
- **THEN** the response is HTTP 201 and a new row exists in `container_sizes`

#### Scenario: POST rejects duplicate code

- **WHEN** `POST /api/container-sizes` is called with an existing `code`
- **THEN** the response is HTTP 409

#### Scenario: DELETE blocked when in use

- **WHEN** `DELETE /api/container-sizes/:id` is called for a size referenced by at least one TripPlan
- **THEN** the response is HTTP 409

---

### Requirement: Container size management page

The web app SHALL provide a `/container-sizes` page listing all container sizes in a table with columns: Code, Name, Active, Actions. A "Thêm size cont" button opens a modal with Code and Name fields. The nav sidebar SHALL include a link to `/container-sizes`.

#### Scenario: Page lists all container sizes

- **WHEN** the user navigates to `/container-sizes`
- **THEN** a table shows all container sizes with Code and Name columns

#### Scenario: Create new container size

- **WHEN** the user clicks "Thêm size cont", fills Code and Name, and submits
- **THEN** `POST /api/container-sizes` is called and the new size appears in the table

---

### Requirement: Trip plan form container size field uses container_sizes select

The trip plan create and edit modal form SHALL replace the free-text `containerSize` input with a `<select>` populated from `GET /api/container-sizes` (active records only, ordered by code). Selection is optional (includes a "— Không chọn —" option). The stored value is `containerSizeId`.

#### Scenario: Form loads container sizes from API

- **WHEN** the user opens the create trip modal
- **THEN** the Container Size dropdown contains options fetched from `GET /api/container-sizes`

#### Scenario: Submitting without container size sends no containerSizeId

- **WHEN** the user submits the form without selecting a container size
- **THEN** the POST body omits `containerSizeId` (or sends `null`)

#### Scenario: Submitting with container size sends containerSizeId

- **WHEN** the user selects "40HC" and submits
- **THEN** the POST body includes `containerSizeId` referencing the 40HC record
