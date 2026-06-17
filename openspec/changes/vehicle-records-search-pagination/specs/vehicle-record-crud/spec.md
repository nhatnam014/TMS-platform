## MODIFIED Requirements

### Requirement: List all vehicle records

`GET /vehicle-records` SHALL return a paginated response object rather than a flat array. The response SHALL have shape `{ data: VehicleRecord[], meta: { total: number, page: number, limit: number, totalPages: number } }`. Each `VehicleRecord` in `data` SHALL include its `moocs` array (all moocs, unfiltered at the API level).

#### Scenario: Successful list returns paginated shape

- **WHEN** client calls `GET /vehicle-records`
- **THEN** response is `{ data: [...], meta: { total, page, limit, totalPages } }` with HTTP 200

#### Scenario: Each record includes all its moocs

- **WHEN** a vehicle record has 3 moocs and client calls `GET /vehicle-records`
- **THEN** the vehicle record in `data` contains a `moocs` array of all 3 moocs
