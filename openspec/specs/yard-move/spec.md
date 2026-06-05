## ADDED Requirements

### Requirement: YardMoveStatus enum defines the yard move lifecycle

The system SHALL define a `YardMoveStatus` enum with values: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. This enum MUST be exported from `@tms/shared` and used in the Prisma schema and YardMove DTOs.

#### Scenario: YardMoveStatus enum is available in shared package

- **WHEN** a consuming package imports from `@tms/shared`
- **THEN** `YardMoveStatus` is available as an exported enum with all four values

---

### Requirement: YardCostType enum defines internal yard cost categories

The system SHALL define a `YardCostType` enum with values: `YARD_HANDLING`, `FORKLIFT`, `OVERTIME`, `OTHER`. This enum MUST be exported from `@tms/shared` and used in `YardMoveCost` records.

#### Scenario: YardCostType enum is available in shared package

- **WHEN** a consuming package imports from `@tms/shared`
- **THEN** `YardCostType` is available as an exported enum with all four values

---

### Requirement: YardMove Prisma model tracks internal factory yard shuttle operations

The system SHALL have a `YardMove` model in the Prisma schema with fields:

- `id` (cuid, primary key)
- `date` (DateTime — the date of the move)
- `containerNumber` (String — the container identifier, validated as `^[A-Z]{4}\d{7}$` at the API layer)
- `fromZone` (String — source zone within the factory, e.g. `STAGING_DROP`)
- `toZone` (String — destination zone, e.g. `LOADING_DOCK`, `STAGING_READY`)
- `locationId` (required FK to Location — the factory where the move occurs)
- `status` (YardMoveStatus, default `PENDING`)
- `notes` (String?, optional free text)
- `createdAt`, `updatedAt` (auto-managed timestamps)
- `costs` (relation to `YardMoveCost[]`)

There is NO `containerId` foreign key. Container data is stored as a plain string.

#### Scenario: YardMove record is created with required fields

- **WHEN** a `YardMove` is inserted with `date`, `containerNumber`, `fromZone`, `toZone`, and `locationId`
- **THEN** the record is persisted with `status = PENDING`

#### Scenario: YardMove containerNumber is a plain string

- **WHEN** a `YardMove` is inserted with a container number string
- **THEN** no foreign key lookup is performed — the string is stored as-is

---

### Requirement: YardMoveCost Prisma model stores itemized internal costs for a YardMove

The system SHALL add a `YardMoveCost` model with fields:

- `id` (cuid, primary key)
- `yardMoveId` (FK to YardMove, cascade delete)
- `type` (YardCostType)
- `amount` (Decimal)
- `note` (String?, optional)
- `createdAt`, `updatedAt`

#### Scenario: YardMoveCost is linked to its parent YardMove

- **WHEN** a `YardMoveCost` is created with a valid `yardMoveId`
- **THEN** the cost record is retrievable via `yardMove.costs`

#### Scenario: Deleting a YardMove cascades to its costs

- **WHEN** a `YardMove` record is deleted
- **THEN** all associated `YardMoveCost` records are also deleted

---

### Requirement: POST /yard-moves creates a new yard move

The system SHALL expose `POST /api/v1/yard-moves` protected by `JwtAuthGuard`. The request body MUST accept `CreateYardMoveDto` exported from `@tms/shared` with fields: `date` (ISO string), `containerNumber` (validated `^[A-Z]{4}\d{7}$`), `fromZone`, `toZone`, `locationId`, and optional `notes`. On success, the endpoint returns `201 Created` with the created YardMove object.

#### Scenario: Valid request creates a YardMove

- **WHEN** `POST /api/v1/yard-moves` is called with valid `CreateYardMoveDto` including a valid `containerNumber`
- **THEN** the response is `201 Created` with the persisted YardMove including `id` and `status: "PENDING"`

#### Scenario: Missing required field returns 400

- **WHEN** `POST /api/v1/yard-moves` is called without `containerNumber`
- **THEN** the response is `400 Bad Request` with a validation error

#### Scenario: Invalid container number format returns 400

- **WHEN** `POST /api/v1/yard-moves` is called with `containerNumber: "abc123"`
- **THEN** the response is `400 Bad Request` with a validation error

#### Scenario: Unauthenticated request is rejected

- **WHEN** `POST /api/v1/yard-moves` is called without an Authorization header
- **THEN** the response is `401 Unauthorized`

---

### Requirement: GET /yard-moves returns yard moves with optional filters

The system SHALL expose `GET /api/v1/yard-moves` protected by `JwtAuthGuard`. Query parameters `locationId` (string) and `status` (YardMoveStatus) MAY be provided to filter results.

#### Scenario: GET without filters returns all yard moves

- **WHEN** `GET /api/v1/yard-moves` is called without query parameters
- **THEN** all yard move records are returned

#### Scenario: GET with locationId filters to that factory

- **WHEN** `GET /api/v1/yard-moves?locationId=<factory-id>` is called
- **THEN** only yard moves at that factory are returned

#### Scenario: GET with status filter returns matching moves

- **WHEN** `GET /api/v1/yard-moves?status=IN_PROGRESS` is called
- **THEN** only yard moves with `status = IN_PROGRESS` are returned

---

### Requirement: PATCH /yard-moves/:id/status updates yard move status

The system SHALL expose `PATCH /api/v1/yard-moves/:id/status` protected by `JwtAuthGuard`. The request body MUST accept `{ status: YardMoveStatus }`. Invalid status transitions MUST return `400 Bad Request`.

#### Scenario: PENDING → IN_PROGRESS transition succeeds

- **WHEN** `PATCH /api/v1/yard-moves/:id/status` is called with `{ status: "IN_PROGRESS" }` on a PENDING move
- **THEN** the response is `200 OK` with the updated YardMove

#### Scenario: Status update on non-existent YardMove returns 404

- **WHEN** `PATCH /api/v1/yard-moves/<nonexistent-id>/status` is called
- **THEN** the response is `404 Not Found`

---

### Requirement: POST /yard-moves/:id/costs adds a cost entry to a YardMove

The system SHALL expose `POST /api/v1/yard-moves/:id/costs` protected by `JwtAuthGuard`. The request body accepts `{ type: YardCostType, amount: number, note?: string }`. On success, returns `201 Created` with the created `YardMoveCost`.

#### Scenario: Valid cost is added to existing YardMove

- **WHEN** `POST /api/v1/yard-moves/:id/costs` is called with valid `type` and `amount`
- **THEN** the response is `201 Created` and the cost is retrievable via the YardMove's costs relation

#### Scenario: Adding cost to non-existent YardMove returns 404

- **WHEN** `POST /api/v1/yard-moves/<nonexistent-id>/costs` is called
- **THEN** the response is `404 Not Found`

## REMOVED Requirements

### Requirement: Completing a YardMove triggers container status transition based on toZone

**Reason**: Container entity removed. Container status is no longer tracked in the system. YardMove completion has no side effects on any container record.
**Migration**: Remove `ZONE_TO_CONTAINER_STATUS` map and `tx.container.update()` calls from `YardMoveService.updateStatus()`.
