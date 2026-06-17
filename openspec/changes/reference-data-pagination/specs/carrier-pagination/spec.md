## ADDED Requirements

### Requirement: Carrier API returns paginated response with server-side search

`GET /carriers` SHALL accept `page`, `limit`, and `search` query params and return `PaginatedResponse<T>`. Default: page=1, limit=10. `search` filters by name or code (case-insensitive contains).

### Requirement: Carrier frontend uses server-side search and pagination

The carriers page SHALL send `search` to the API instead of filtering in-memory, and SHALL show a pagination bar.
