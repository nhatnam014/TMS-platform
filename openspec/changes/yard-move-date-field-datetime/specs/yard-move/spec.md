## MODIFIED Requirements

### Requirement: YardMove Prisma model tracks yard order trip records

The system SHALL have a `YardMove` model in the Prisma schema with fields:

- `id` (cuid, primary key)
- `date` (DateTime, `@db.Date` — the trip date, day/month/year only, no time component)
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
- **THEN** the record is persisted with all provided values stored as-is (except `date`, which is stored as a `Date`), with no format transformation of the free-text fields

#### Scenario: containerNumber accepts non-conforming values

- **WHEN** a `YardMove` is inserted with `containerNumber: "abc123"`
- **THEN** the record is persisted without validation error

#### Scenario: date is stored as a real date, not free text

- **WHEN** a `YardMove` is inserted with `date: "2026-06-24"`
- **THEN** the record is persisted with `date` as a `Date` value equal to 2026-06-24, queryable and sortable as a date

### Requirement: POST /yard-moves creates a new yard move

The system SHALL expose `POST /api/v1/yard-moves` protected by `JwtAuthGuard`. The request body MUST accept `CreateYardMoveDto` exported from `@tms/shared` with all fields optional except `date` (an ISO date string, e.g. `"2026-06-24"`): `date`, `gps`, `fullName`, `truck`, `mooc`, `booking`, `containerNumber`, `notes`, `daKeo`. The `date` field MUST be validated as an ISO date string; no other field is validated against a format pattern, enum, or foreign-key lookup. On success, the endpoint returns `201 Created` with the created YardMove object.

#### Scenario: Valid request creates a YardMove

- **WHEN** `POST /api/v1/yard-moves` is called with a valid ISO `date` and any subset of the other optional fields
- **THEN** the response is `201 Created` with the persisted YardMove including `id` and `isActive: true`

#### Scenario: Missing date returns 400

- **WHEN** `POST /api/v1/yard-moves` is called without `date`
- **THEN** the response is `400 Bad Request` with a validation error

#### Scenario: Non-date-string date returns 400

- **WHEN** `POST /api/v1/yard-moves` is called with `date: "24/06"`
- **THEN** the response is `400 Bad Request` with a validation error, since the value is not a valid ISO date string

#### Scenario: Unauthenticated request is rejected

- **WHEN** `POST /api/v1/yard-moves` is called without an Authorization header
- **THEN** the response is `401 Unauthorized`
