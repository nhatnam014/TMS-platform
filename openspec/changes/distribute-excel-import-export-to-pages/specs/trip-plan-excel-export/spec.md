## MODIFIED Requirements

### Requirement: Any authenticated user can export trip plans as a flat Excel file

The system SHALL provide `GET /api/v1/export/trip-plans` that accepts optional `from` and `to` query parameters (ISO date strings) and returns an `.xlsx` file with Vietnamese column headers matching the actual "kế hoạch xe" sheet column order. The response MUST include `Content-Disposition: attachment; filename="ke-hoach-xe.xlsx"` and `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. The endpoint MUST require a valid authenticated session (`JwtAuthGuard`) but MUST NOT restrict by role.

#### Scenario: Export with date range filters rows

- **WHEN** an authenticated user requests `GET /api/v1/export/trip-plans?from=2026-01-01&to=2026-01-31`
- **THEN** the response is an `.xlsx` file containing only TripPlan rows with `tripDate` within January 2026

#### Scenario: Export without date range returns all rows (up to 10 000)

- **WHEN** an authenticated user requests `GET /api/v1/export/trip-plans` without query parameters
- **THEN** the response is an `.xlsx` file containing all TripPlan rows (maximum 10 000)

#### Scenario: Non-ADMIN authenticated role is not rejected

- **WHEN** a user authenticated with a role other than ADMIN calls `GET /api/v1/export/trip-plans`
- **THEN** the request succeeds and returns the export file, not HTTP 403

#### Scenario: Unauthenticated request is rejected

- **WHEN** a request with no valid JWT is made to `GET /api/v1/export/trip-plans`
- **THEN** the API returns HTTP 401

#### Scenario: Response triggers browser file download

- **WHEN** the frontend opens the export URL
- **THEN** the browser receives `Content-Disposition: attachment; filename="ke-hoach-xe.xlsx"` and saves the file

## ADDED Requirements

### Requirement: Export response reports matched row count so the UI can distinguish an empty result from a normal download

The system SHALL include an `X-Export-Row-Count` response header on `GET /api/v1/export/trip-plans`, set to the number of `TripPlan` rows included in the returned file (as a decimal string). The file itself SHALL still be generated and returned even when the count is `0` — a valid `.xlsx` containing only the branded header and column-header row, no data rows. The frontend SHALL still trigger the browser download in all cases; it uses this header only to decide which toast message to show, not to block or alter the download.

#### Scenario: Filtered export matching zero rows still returns a valid file with count 0

- **WHEN** an authenticated user requests `GET /api/v1/export/trip-plans?from=2026-01-01&to=2026-01-02` and no `TripPlan` rows fall in that range
- **THEN** the response is HTTP 200 with a valid `.xlsx` file (header rows only, no data rows) and `X-Export-Row-Count: 0`

#### Scenario: Non-empty export reports its actual row count

- **WHEN** an authenticated user requests an export that matches 12 `TripPlan` rows
- **THEN** the response includes `X-Export-Row-Count: 12`

#### Scenario: Frontend shows a filter-aware warning instead of the success toast when count is 0

- **WHEN** the trip-plans export modal receives a response with `X-Export-Row-Count: 0`
- **THEN** the browser still downloads the file, but the toast shown states no records matched the currently selected date range (echoing the selected `from`/`to` values as the user set them) instead of the generic "Tải xuống thành công" message

#### Scenario: Frontend shows the normal success toast when count is greater than 0

- **WHEN** the trip-plans export modal receives a response with `X-Export-Row-Count` greater than `0`
- **THEN** the toast shown is the existing generic success message, unchanged from current behavior
