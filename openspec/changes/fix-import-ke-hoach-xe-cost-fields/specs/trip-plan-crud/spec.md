## MODIFIED Requirements

### Requirement: List trip plans with filters and pagination

The `GET /trip-plans` endpoint SHALL accept an optional `search` query parameter in addition to all existing filter parameters.

When no explicit `sortBy`/`sortOrder` is provided, the endpoint SHALL default to sorting by `tripNumber` ascending (STT order), instead of `tripDate` descending.

#### Scenario: List with search parameter

- **WHEN** a client sends `GET /trip-plans?search=<term>`
- **THEN** the server SHALL apply an OR clause matching `search` against trip number (if integer), vehicle license plate, customer name, outbound container number, inbound container number, and notes
- **THEN** the response SHALL still return a `PaginatedResponse<TripPlanRow>` with `{ data, meta }` shape

#### Scenario: Backwards compatibility — no search param

- **WHEN** a client sends `GET /trip-plans` without a `search` param
- **THEN** the server SHALL behave identically to before this change (no regression)

#### Scenario: Search combined with all existing filters

- **WHEN** a client sends `GET /trip-plans?search=foo&status=PLANNED&customerId=<id>&page=2`
- **THEN** all filter conditions SHALL be applied together (AND logic)
- **THEN** the response `meta` SHALL reflect the filtered total count

#### Scenario: Default sort is by STT (tripNumber) ascending

- **WHEN** a client sends `GET /trip-plans` without `sortBy` or `sortOrder`
- **THEN** the results SHALL be ordered by `tripNumber` ascending
- **THEN** the trip plans list page (which sends no explicit sort param) SHALL display rows in this order

#### Scenario: Explicit sortBy still overrides the default

- **WHEN** a client sends `GET /trip-plans?sortBy=tripDate&sortOrder=desc`
- **THEN** the results SHALL be ordered by `tripDate` descending, overriding the new default

## ADDED Requirements

### Requirement: Auto-assigned tripNumber on trip plan creation

`POST /trip-plans` SHALL NOT accept a `tripNumber` from the client. When creating a new `TripPlan`, the server SHALL compute `tripNumber` as `(MAX(TripPlan.tripNumber) across all rows, or 0 if none) + 1` and assign it inside the same transaction as the create, so every newly created trip plan (via the UI's "Tạo chuyến" form) gets a real, non-null, globally-unique-at-creation-time `tripNumber` rather than being left `null`.

#### Scenario: New trip plan gets the next available tripNumber

- **WHEN** a client calls `POST /trip-plans` with valid data, and the highest existing `tripNumber` in the database is 42
- **THEN** the created `TripPlan` has `tripNumber = 43`

#### Scenario: First trip plan in an empty table gets tripNumber 1

- **WHEN** a client calls `POST /trip-plans` and no `TripPlan` rows exist yet (or none have a non-null `tripNumber`)
- **THEN** the created `TripPlan` has `tripNumber = 1`
