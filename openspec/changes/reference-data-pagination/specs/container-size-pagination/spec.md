## ADDED Requirements

### Requirement: Container-size API returns paginated response

`GET /container-sizes` SHALL accept `page` and `limit` query params and return `PaginatedResponse<T>`. Default: page=1, limit=10.

### Requirement: Container-size frontend shows pagination UI

The container-sizes page SHALL show a pagination bar.
