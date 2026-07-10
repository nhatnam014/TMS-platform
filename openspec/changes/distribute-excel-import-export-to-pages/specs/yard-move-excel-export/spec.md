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

### Requirement: Export response reports matched row count so the UI can distinguish an empty result from a normal download

The system SHALL include an `X-Export-Row-Count` response header on `GET /api/v1/export/yard-moves`, set to the number of `YardMove` rows included in the returned file (as a decimal string), reflecting the combined effect of `isActive`, `from`/`to`, and `daKeoStatus` filtering. The file itself SHALL still be generated and returned even when the count is `0`. The frontend SHALL still trigger the browser download in all cases; it uses this header only to decide which toast message to show, not to block or alter the download. The system MAKES NO attempt to determine which individual filter (date range vs. đã kéo/tồn status) is "responsible" for an empty combined result — only the total combined count is reported.

#### Scenario: Combined date range + daKeoStatus filter matching zero rows still returns a valid file with count 0

- **WHEN** an authenticated user requests `GET /api/v1/export/yard-moves?from=2026-01-01&to=2026-01-31&daKeoStatus=pending` and no record within that date range has an empty/null `daKeo`, even though records exist for that date range with a non-empty `daKeo` and separately records exist elsewhere with an empty/null `daKeo`
- **THEN** the response is HTTP 200 with a valid `.xlsx` file (header rows only, no data rows) and `X-Export-Row-Count: 0`

#### Scenario: Frontend shows a filter-aware warning listing all active filters when count is 0

- **WHEN** the yard-moves export modal receives a response with `X-Export-Row-Count: 0`
- **THEN** the browser still downloads the file, but the toast shown states no records matched, echoing back whichever of the active filters were set by the user (date range if set, "Đã kéo"/"Tồn" if the toggle isn't "Tất cả") — without claiming which specific filter caused the empty result

#### Scenario: Frontend shows the normal success toast when count is greater than 0

- **WHEN** the yard-moves export modal receives a response with `X-Export-Row-Count` greater than `0`
- **THEN** the toast shown is the existing generic success message, unchanged from current behavior
