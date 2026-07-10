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
