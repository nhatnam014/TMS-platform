## ADDED Requirements

### Requirement: Yard-move API returns paginated response

`GET /yard-moves` SHALL accept `page` and `limit` query params and return `PaginatedResponse<T>` (`{ data, meta: { total, page, limit, totalPages } }`). Default: page=1, limit=10.

#### Scenario: Default page size is 10

- **WHEN** `GET /yard-moves` is called without `page`/`limit`
- **THEN** at most 10 records are returned and `meta.limit === 10`

### Requirement: Yard-move frontend shows pagination UI

The yard-moves page SHALL show a pagination bar identical in style to the trip-plans page: record count "Hiển thị X–Y / Z", prev/next buttons, page number buttons with ±2 neighbors and ellipsis.

#### Scenario: Pagination bar renders correctly

- **WHEN** there are more than 10 yard-move records
- **THEN** the pagination bar appears, showing range label and page buttons
