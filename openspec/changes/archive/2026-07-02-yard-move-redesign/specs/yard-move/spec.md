## ADDED Requirements

### Requirement: GET /yard-moves returns yard moves with pagination and text search

The system SHALL expose `GET /api/v1/yard-moves` protected by `JwtAuthGuard`. Query parameters `page` and `limit` control pagination (default `limit` 10). An optional `search` query parameter filters records by case-insensitive substring match across `fullName`, `truck`, `mooc`, `booking`, `containerNumber`, and `gps`. There is NO `locationId` or `status` filter.

#### Scenario: GET without filters returns paginated yard moves

- **WHEN** `GET /api/v1/yard-moves?page=1&limit=10` is called without `search`
- **THEN** up to 10 yard move records are returned along with pagination metadata (`total`, `totalPages`, `page`, `limit`)

#### Scenario: GET with search filters by text match

- **WHEN** `GET /api/v1/yard-moves?search=AK` is called
- **THEN** only yard moves whose `gps`, `fullName`, `truck`, `mooc`, `booking`, or `containerNumber` contains "AK" (case-insensitive) are returned

### Requirement: PATCH /yard-moves/:id updates fields or soft-deletes a yard move

The system SHALL expose `PATCH /api/v1/yard-moves/:id` protected by `JwtAuthGuard`. The request body MUST accept `UpdateYardMoveDto` with all fields from `CreateYardMoveDto` made optional, plus an optional `isActive` boolean. Setting `isActive: false` performs a soft-delete. This is the only update/delete endpoint for yard moves.

#### Scenario: Update changes a subset of fields

- **WHEN** `PATCH /api/v1/yard-moves/:id` is called with `{ notes: "XONG K3" }`
- **THEN** the response is `200 OK` with `notes` updated and all other fields unchanged

#### Scenario: Soft-delete via isActive false

- **WHEN** `PATCH /api/v1/yard-moves/:id` is called with `{ isActive: false }`
- **THEN** the record's `isActive` becomes `false` and it is excluded from default `GET /yard-moves` results

#### Scenario: Update on non-existent YardMove returns 404

- **WHEN** `PATCH /api/v1/yard-moves/<nonexistent-id>` is called
- **THEN** the response is `404 Not Found`

## MODIFIED Requirements

### Requirement: YardMove Prisma model tracks internal factory yard shuttle operations

The system SHALL have a `YardMove` model in the Prisma schema with fields:

- `id` (cuid, primary key)
- `date` (String — free-text date entry, e.g. `"24/06"`; not validated or parsed as a date)
- `gps` (String?, optional free text — e.g. `"AK"`, `"NP"`, `"NA"`, `"DTP"`)
- `fullName` (String?, optional free text — driver's full name)
- `truck` (String?, optional free text — truck plate)
- `mooc` (String?, optional free text — trailer plate)
- `booking` (String?, optional free text — booking number)
- `containerNumber` (String?, optional free text — container identifier; no format validation)
- `notes` (String?, optional free text — GHI CHÚ)
- `daKeo` (String?, optional free text — DÃ KÉO marker)
- `isActive` (Boolean, default `true` — soft-delete flag)
- `createdAt`, `updatedAt` (auto-managed timestamps)

There is NO `fromZone`, `toZone`, `locationId`, `status`, or `costs` relation. There is NO foreign key to `Location` or `Container`.

#### Scenario: YardMove record is created with only a date

- **WHEN** a `YardMove` is inserted with only `date` provided
- **THEN** the record is persisted with all other fields `null` and `isActive: true`

#### Scenario: YardMove record is created with all fields

- **WHEN** a `YardMove` is inserted with `date`, `gps`, `fullName`, `truck`, `mooc`, `booking`, `containerNumber`, `notes`, and `daKeo`
- **THEN** the record is persisted with all provided values stored as-is, with no format transformation

#### Scenario: containerNumber accepts non-conforming values

- **WHEN** a `YardMove` is inserted with `containerNumber: "abc123"`
- **THEN** the record is persisted without validation error

### Requirement: POST /yard-moves creates a new yard move

The system SHALL expose `POST /api/v1/yard-moves` protected by `JwtAuthGuard`. The request body MUST accept `CreateYardMoveDto` exported from `@tms/shared` with all fields optional except `date` (a free-text string): `date`, `gps`, `fullName`, `truck`, `mooc`, `booking`, `containerNumber`, `notes`, `daKeo`. No field is validated against a format pattern, enum, or foreign-key lookup. On success, the endpoint returns `201 Created` with the created YardMove object.

#### Scenario: Valid request creates a YardMove

- **WHEN** `POST /api/v1/yard-moves` is called with a `date` and any subset of the other optional fields
- **THEN** the response is `201 Created` with the persisted YardMove including `id` and `isActive: true`

#### Scenario: Missing date returns 400

- **WHEN** `POST /api/v1/yard-moves` is called without `date`
- **THEN** the response is `400 Bad Request` with a validation error

#### Scenario: Unauthenticated request is rejected

- **WHEN** `POST /api/v1/yard-moves` is called without an Authorization header
- **THEN** the response is `401 Unauthorized`

## REMOVED Requirements

### Requirement: YardMoveStatus enum defines the yard move lifecycle

**Reason**: The status workflow (PENDING/IN_PROGRESS/COMPLETED/CANCELLED) no longer reflects how yard orders are tracked — the business model is a flat trip log with no lifecycle, replaced by simple create/update/soft-delete via `isActive`.
**Migration**: Remove `YardMoveStatus` from `@tms/db` and `@tms/shared` exports. Any code branching on `YardMove.status` must be deleted.

### Requirement: YardCostType enum defines internal yard cost categories

**Reason**: Cost tracking on yard moves is removed entirely; the new model has no cost concept.
**Migration**: Remove `YardCostType` from `@tms/db` and `@tms/shared` exports.

### Requirement: YardMoveCost Prisma model stores itemized internal costs for a YardMove

**Reason**: Cost tracking on yard moves is removed entirely.
**Migration**: Drop the `YardMoveCost` model and its underlying `yard_move_costs` table via Prisma migration. No data preserved (table has no production data).

### Requirement: PATCH /yard-moves/:id/status updates yard move status

**Reason**: No status lifecycle remains on `YardMove`.
**Migration**: Remove the endpoint, its controller method, `UpdateYardMoveStatusDto`, and `YardMoveService.updateStatus()`.

### Requirement: POST /yard-moves/:id/costs adds a cost entry to a YardMove

**Reason**: Cost tracking on yard moves is removed entirely.
**Migration**: Remove the endpoint, its controller method, `CreateYardMoveCostDto`, and `YardMoveService.addCost()`.

### Requirement: GET /yard-moves returns yard moves with optional filters

**Reason**: Superseded by the ADDED requirement above — filtering by `locationId`/`status` no longer applies since those fields are removed; the endpoint now supports pagination and free-text `search` instead.
**Migration**: Remove `locationId`/`status` query parameter handling from `YardMoveController.findAll()` and `YardMoveService.findAll()`; add `search`/pagination handling per the ADDED requirement.
