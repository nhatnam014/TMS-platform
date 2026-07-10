## MODIFIED Requirements

### Requirement: Any authenticated user can export yard moves as a flat Excel file

The system SHALL provide `GET /api/v1/export/yard-moves` that accepts optional `from`, `to`, and `daKeoStatus` query parameters and returns an `.xlsx` file with Vietnamese column headers matching the "lệnh bãi" sheet column order. The response MUST include `Content-Disposition: attachment; filename="tien-do-van-tai.xlsx"` and `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. The endpoint MUST require a valid authenticated session (`JwtAuthGuard`) but MUST NOT restrict by role.

#### Scenario: Export returns all active yard moves

- **WHEN** an authenticated user requests `GET /api/v1/export/yard-moves` with no `daKeoStatus`
- **THEN** the response is an `.xlsx` file containing all `YardMove` records where `isActive = true`, regardless of `daKeo` value

#### Scenario: Non-ADMIN authenticated role is not rejected

- **WHEN** a user authenticated with a role other than ADMIN calls `GET /api/v1/export/yard-moves`
- **THEN** the request succeeds and returns the export file, not HTTP 403

#### Scenario: Unauthenticated request is rejected

- **WHEN** a request with no valid JWT is made to `GET /api/v1/export/yard-moves`
- **THEN** the API returns HTTP 401

#### Scenario: Response triggers browser file download

- **WHEN** the frontend opens the export URL
- **THEN** the browser receives `Content-Disposition: attachment; filename="tien-do-van-tai.xlsx"` and saves the file

## ADDED Requirements

### Requirement: Yard-move export can be filtered by đã kéo / tồn status

The system SHALL accept an optional `daKeoStatus` query parameter on `GET /api/v1/export/yard-moves` with value `"hauled"` or `"pending"`. A `YardMove` record is considered **hauled** ("Đã kéo") if its `daKeo` field is non-null and not an exact empty string, and **pending** ("Tồn") if `daKeo` is null or an exact empty string. No trimming or whitespace normalization is applied — a whitespace-only value (e.g. `"   "`) is classified as hauled, consistent with `daKeo` being untouched free text elsewhere in the system. This filter applies only to the export endpoint, in addition to any `isActive`, `from`, and `to` filtering already applied; it does NOT change `YardMoveService.findAll` (the records list/search endpoint) or any list-page UI filter.

#### Scenario: daKeoStatus=hauled exports only records with a non-empty daKeo value

- **WHEN** an authenticated user requests `GET /api/v1/export/yard-moves?daKeoStatus=hauled`
- **THEN** the response contains only `YardMove` records where `daKeo` is a non-empty string, excluding records where `daKeo` is null or empty

#### Scenario: daKeoStatus=pending exports only records with an empty or null daKeo value

- **WHEN** an authenticated user requests `GET /api/v1/export/yard-moves?daKeoStatus=pending`
- **THEN** the response contains only `YardMove` records where `daKeo` is null or an empty string, excluding records with any non-empty `daKeo` value

#### Scenario: Omitted daKeoStatus exports all records regardless of daKeo

- **WHEN** an authenticated user requests `GET /api/v1/export/yard-moves` without a `daKeoStatus` parameter
- **THEN** the response contains records regardless of their `daKeo` value (current behavior, unchanged)

#### Scenario: daKeoStatus combines with existing from/to date filters

- **WHEN** an authenticated user requests `GET /api/v1/export/yard-moves?from=2026-01-01&to=2026-01-31&daKeoStatus=pending`
- **THEN** the response contains only records within the January 2026 date range AND with an empty/null `daKeo` value
