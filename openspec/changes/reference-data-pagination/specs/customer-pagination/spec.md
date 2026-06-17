## ADDED Requirements

### Requirement: Customer API returns paginated response with server-side search

`GET /customers` SHALL accept `page`, `limit`, and `search` query params and return `PaginatedResponse<T>`. Default: page=1, limit=10. `search` filters by name or code (case-insensitive contains).

#### Scenario: Search filters by name

- **WHEN** `GET /customers?search=abc` is called
- **THEN** only customers whose name or code contains "abc" (case-insensitive) are returned

### Requirement: Customer frontend uses server-side search and pagination

The customers page SHALL send `search` to the API instead of filtering in-memory, and SHALL show a pagination bar.

#### Scenario: Pagination bar renders correctly

- **WHEN** there are more than 10 customer records
- **THEN** the pagination bar appears with correct range label
