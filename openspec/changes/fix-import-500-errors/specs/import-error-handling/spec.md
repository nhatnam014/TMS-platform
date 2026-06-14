## ADDED Requirements

### Requirement: Import endpoints return 400 when uploaded file cannot be parsed

The system SHALL wrap `workbook.xlsx.load()` and the parser call (both `parseQuanLyXe` and `parseKeHoachXe`) in a top-level try-catch inside `importVehicles` and `importTripPlans`. If either throws, the service MUST re-throw a NestJS `BadRequestException` with the message "File không hợp lệ hoặc không đúng định dạng .xlsx". The NestJS global exception filter will serialize this as HTTP 400. The per-row try-catch loop MUST remain unchanged.

#### Scenario: Non-xlsx binary file is uploaded to /import/vehicles

- **WHEN** an admin uploads a file that is not a valid xlsx workbook to `POST /api/v1/import/vehicles`
- **THEN** the API returns HTTP 400 with `{ "message": "File không hợp lệ hoặc không đúng định dạng .xlsx", "statusCode": 400 }` and no database writes occur

#### Scenario: Corrupt xlsx file is uploaded to /import/vehicles

- **WHEN** an admin uploads an xlsx file with corrupted internal structure to `POST /api/v1/import/vehicles`
- **THEN** the API returns HTTP 400 with the standard bad-request message; no partial records are created

#### Scenario: Non-xlsx file is uploaded to /import/trip-plans

- **WHEN** an admin uploads an invalid file to `POST /api/v1/import/trip-plans`
- **THEN** the API returns HTTP 400 with `{ "message": "File không hợp lệ hoặc không đúng định dạng .xlsx", "statusCode": 400 }`

#### Scenario: Valid xlsx file with per-row Prisma errors still returns 200

- **WHEN** an admin uploads a valid xlsx file but some rows fail Prisma constraints
- **THEN** the API returns HTTP 200 with `{ imported: N, warnings: [], errors: ["Hàng X: ..."] }` — the per-row error handling is unchanged
