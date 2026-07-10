## MODIFIED Requirements

### Requirement: Any authenticated user can export vehicle compliance data as a flat Excel file

The system SHALL provide `GET /api/v1/export/vehicles` that returns an `.xlsx` file with Vietnamese column headers matching the "quản lý xe" sheet column order. The response MUST include `Content-Disposition: attachment; filename="quan-ly-xe.xlsx"` and `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. The endpoint MUST require a valid authenticated session (`JwtAuthGuard`) but MUST NOT restrict by role.

#### Scenario: Export returns all active vehicles
- **WHEN** an authenticated user requests `GET /api/v1/export/vehicles`
- **THEN** the response is an `.xlsx` file containing all Vehicle records with their associated Driver and Trailer compliance data

#### Scenario: Non-ADMIN authenticated role is not rejected
- **WHEN** a user authenticated with a role other than ADMIN calls `GET /api/v1/export/vehicles`
- **THEN** the request succeeds and returns the export file, not HTTP 403

#### Scenario: Unauthenticated request is rejected
- **WHEN** a request with no valid JWT is made to `GET /api/v1/export/vehicles`
- **THEN** the API returns HTTP 401

#### Scenario: Response triggers browser file download
- **WHEN** the frontend opens the export URL
- **THEN** the browser receives `Content-Disposition: attachment; filename="quan-ly-xe.xlsx"` and saves the file
