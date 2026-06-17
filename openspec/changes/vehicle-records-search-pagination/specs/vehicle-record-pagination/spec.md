## ADDED Requirements

### Requirement: Vehicle records list is paginated

The `GET /vehicle-records` endpoint SHALL accept `page` and `limit` query parameters and return a paginated response. Default page is 1, default limit is 10. The response shape SHALL be `{ data: VehicleRecord[], meta: { total, page, limit, totalPages } }`.

#### Scenario: Default pagination

- **WHEN** client calls `GET /vehicle-records` with no query params
- **THEN** response contains `data` array of up to 10 records and `meta.page = 1`, `meta.limit = 10`, `meta.total` = total matching count, `meta.totalPages = ceil(total/10)`

#### Scenario: Explicit page and limit

- **WHEN** client calls `GET /vehicle-records?page=2&limit=5`
- **THEN** response `data` contains records 6–10 (skipping first 5) and `meta.page = 2`, `meta.limit = 5`

#### Scenario: Page beyond total

- **WHEN** client calls `GET /vehicle-records?page=999`
- **THEN** response `data` is empty array and `meta.totalPages` reflects actual count

### Requirement: Frontend shows pagination controls

The vehicle records page SHALL display pagination controls below the table showing current page, total pages, and next/previous navigation. It SHALL also display the total record count.

#### Scenario: Navigate to next page

- **WHEN** user clicks next page button
- **THEN** table updates to show the next 10 records

#### Scenario: No results

- **WHEN** total records matching filters is 0
- **THEN** pagination controls show "Tổng: 0 bản ghi" and page navigation is disabled
