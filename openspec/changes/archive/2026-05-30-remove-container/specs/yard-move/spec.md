## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Completing a YardMove triggers container status transition based on toZone

**Reason**: Container entity removed. Container status is no longer tracked in the system. YardMove completion has no side effects on any container record.
**Migration**: Remove `ZONE_TO_CONTAINER_STATUS` map and `tx.container.update()` calls from `YardMoveService.updateStatus()`.
