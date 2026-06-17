## ADDED Requirements

### Requirement: Yard-move list supports text search

The system SHALL accept a `search` query parameter on `GET /api/yard-moves`. When provided, results SHALL be filtered to rows where `containerNumber`, `fromZone`, `toZone`, or `location.name` contains the search string (case-insensitive).

#### Scenario: Search by container number

- **WHEN** client sends `GET /api/yard-moves?search=MSCU`
- **THEN** only yard-moves whose `containerNumber` contains "MSCU" (case-insensitive) are returned

#### Scenario: Search by zone name

- **WHEN** client sends `GET /api/yard-moves?search=STAGING`
- **THEN** yard-moves where `fromZone` or `toZone` contains "STAGING" are returned

#### Scenario: Search by location name

- **WHEN** client sends `GET /api/yard-moves?search=Hanoi`
- **THEN** yard-moves whose associated location name contains "Hanoi" are returned

#### Scenario: Empty search returns all records (paginated)

- **WHEN** `search` is omitted or empty
- **THEN** no text filter is applied and all records matching other active filters are returned

### Requirement: Yard-move list supports date-range filter

The system SHALL accept `dateFrom` and `dateTo` query parameters on `GET /api/yard-moves`. When provided, results SHALL be filtered to yard-moves whose `createdAt` falls within the inclusive range.

#### Scenario: Filter by date range

- **WHEN** client sends `GET /api/yard-moves?dateFrom=2025-01-01&dateTo=2025-01-31`
- **THEN** only yard-moves created between 2025-01-01 00:00:00 and 2025-01-31 23:59:59 are returned

#### Scenario: Open-ended date filter

- **WHEN** only `dateFrom` is provided (no `dateTo`)
- **THEN** yard-moves created on or after `dateFrom` are returned

### Requirement: Yard-move list supports status filter

The system SHALL accept a `status` query parameter on `GET /api/yard-moves`. When provided, results SHALL be filtered to yard-moves matching the given `YardMoveStatus` value.

#### Scenario: Filter by status PENDING

- **WHEN** client sends `GET /api/yard-moves?status=PENDING`
- **THEN** only yard-moves with status PENDING are returned

### Requirement: Yard-moves frontend shows search + filter bar

The yard-moves page SHALL display a filter bar with: a text search input, two date inputs (From / To), and a status dropdown. Changing any filter SHALL reset pagination to page 1.

#### Scenario: User types in search box

- **WHEN** user types text into the search input and pauses
- **THEN** the page fetches `GET /api/yard-moves?search=<text>&page=1&limit=10` and updates the table

#### Scenario: User selects a status

- **WHEN** user selects a status from the dropdown
- **THEN** the page fetches with `&status=<value>` appended and resets to page 1
