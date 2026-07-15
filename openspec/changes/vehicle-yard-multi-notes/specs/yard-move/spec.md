## MODIFIED Requirements

### Requirement: YardMove Prisma model tracks yard order trip records

The system SHALL have a `YardMove` model in the Prisma schema with fields:

- `id` (cuid, primary key)
- `date` (String — free-text date entry, e.g. `"24/06"`; not validated or parsed as a date)
- `gps` (String?, optional free text — e.g. `"AK"`, `"NP"`, `"NA"`, `"DTP"`)
- `fullName` (String?, optional free text — driver's full name)
- `truck` (String?, optional free text — truck plate)
- `mooc` (String?, optional free text — trailer plate)
- `booking` (String?, optional free text — booking number)
- `containerNumber` (String?, optional free text — container identifier; no format validation)
- `daKeo` (String?, optional free text — DÃ KÉO marker)
- `isActive` (Boolean, default `true` — soft-delete flag)
- `createdAt`, `updatedAt` (auto-managed timestamps)

The `notes` scalar field is replaced by a one-to-many relation to a new `YardMoveNote` model:

- `id` (cuid, primary key)
- `yardMoveId` — FK to `YardMove`, cascades on delete
- `content` — String (note text)
- `createdAt` — timestamp, set automatically on creation, not user-editable

There is NO `fromZone`, `toZone`, `locationId`, `status`, or `costs` relation. There is NO foreign key to `Location` or `Container`.

#### Scenario: YardMove record is created with only a date

- **WHEN** a `YardMove` is inserted with only `date` provided
- **THEN** the record is persisted with all other fields `null`, zero `YardMoveNote` rows, and `isActive: true`

#### Scenario: YardMove record is created with all fields

- **WHEN** a `YardMove` is inserted with `date`, `gps`, `fullName`, `truck`, `mooc`, `booking`, `containerNumber`, one or more notes, and `daKeo`
- **THEN** the record is persisted with all provided scalar values stored as-is, and one `YardMoveNote` row is created per note, with no format transformation

#### Scenario: containerNumber accepts non-conforming values

- **WHEN** a `YardMove` is inserted with `containerNumber: "abc123"`
- **THEN** the record is persisted without validation error

#### Scenario: YardMove cascade delete removes notes

- **WHEN** a `YardMove` is deleted
- **THEN** all associated `YardMoveNote` rows are also deleted

---

### Requirement: POST /yard-moves creates a new yard move

The system SHALL expose `POST /api/v1/yard-moves` protected by `JwtAuthGuard`. The request body MUST accept `CreateYardMoveDto` exported from `@tms/shared` with all fields optional except `date` (a free-text string): `date`, `gps`, `fullName`, `truck`, `mooc`, `booking`, `containerNumber`, `notes` (an array of `{ content: string }`, optional, defaults to empty), `daKeo`. No field is validated against a format pattern, enum, or foreign-key lookup. On success, the endpoint returns `201 Created` with the created YardMove object including its nested `notes` array.

#### Scenario: Valid request creates a YardMove

- **WHEN** `POST /api/v1/yard-moves` is called with a `date` and any subset of the other optional fields
- **THEN** the response is `201 Created` with the persisted YardMove including `id`, `isActive: true`, and a `notes` array

#### Scenario: Missing date returns 400

- **WHEN** `POST /api/v1/yard-moves` is called without `date`
- **THEN** the response is `400 Bad Request` with a validation error

#### Scenario: Unauthenticated request is rejected

- **WHEN** `POST /api/v1/yard-moves` is called without an Authorization header
- **THEN** the response is `401 Unauthorized`

#### Scenario: Create with multiple notes

- **WHEN** `POST /api/v1/yard-moves` is called with `notes: [{ content: "XONG K3" }, { content: "Chờ booking" }]`
- **THEN** the created YardMove has two `YardMoveNote` rows with those contents, in that order

---

### Requirement: PATCH /yard-moves/:id updates fields or soft-deletes a yard move

The system SHALL expose `PATCH /api/v1/yard-moves/:id` protected by `JwtAuthGuard`. The request body MUST accept `UpdateYardMoveDto` with all fields from `CreateYardMoveDto` made optional, plus an optional `isActive` boolean. Setting `isActive: false` performs a soft-delete. When the request body includes a `notes` array (even empty), all existing `YardMoveNote` rows for that record are deleted and replaced with the submitted array in the same transaction. This is the only update/delete endpoint for yard moves.

#### Scenario: Update changes a subset of fields

- **WHEN** `PATCH /api/v1/yard-moves/:id` is called with `{ gps: "AK" }`
- **THEN** the response is `200 OK` with `gps` updated and all other fields, including `notes`, unchanged

#### Scenario: Replace notes on update

- **WHEN** `PATCH /api/v1/yard-moves/:id` is called with `{ notes: [{ content: "XONG K3" }] }`
- **THEN** all previously existing `YardMoveNote` rows for that record are deleted and replaced with one row containing "XONG K3"

#### Scenario: Soft-delete via isActive false

- **WHEN** `PATCH /api/v1/yard-moves/:id` is called with `{ isActive: false }`
- **THEN** the record's `isActive` becomes `false` and it is excluded from default `GET /yard-moves` results

#### Scenario: Update on non-existent YardMove returns 404

- **WHEN** `PATCH /api/v1/yard-moves/<nonexistent-id>` is called
- **THEN** the response is `404 Not Found`
