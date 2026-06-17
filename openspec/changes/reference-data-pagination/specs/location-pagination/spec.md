## ADDED Requirements

### Requirement: Location API returns paginated response with server-side search and type filter

`GET /locations` SHALL accept `page`, `limit`, `search`, and `type` query params and return `PaginatedResponse<T>`. Default: page=1, limit=10. `search` filters by name or code (case-insensitive contains). `type` filters by location type (existing behavior preserved).

### Requirement: Location frontend uses server-side search/filter and pagination

The locations page SHALL send `search` and `type` to the API instead of filtering in-memory, and SHALL show a pagination bar.
