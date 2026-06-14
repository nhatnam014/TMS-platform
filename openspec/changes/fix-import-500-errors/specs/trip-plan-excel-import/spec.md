## ADDED Requirements

### Requirement: Trip plan import returns 400 for unparseable files

The system SHALL return HTTP 400 with a human-readable message when `POST /api/v1/import/trip-plans` receives a file that cannot be loaded as an xlsx workbook or parsed by the kehoach-xe parser. See `import-error-handling` spec for full requirements.

#### Scenario: Invalid file uploaded to trip-plan import endpoint

- **WHEN** an admin uploads a file that is not a valid xlsx workbook to `POST /api/v1/import/trip-plans`
- **THEN** the API returns HTTP 400 with `{ "message": "File không hợp lệ hoặc không đúng định dạng .xlsx", "statusCode": 400 }` and no `TripPlan` rows are created
