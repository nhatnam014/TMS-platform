## ADDED Requirements

### Requirement: Service-type API returns paginated response

`GET /service-types` SHALL accept `page` and `limit` query params and return `PaginatedResponse<T>`. Default: page=1, limit=10.

### Requirement: Service-type frontend shows pagination UI

The service-types page SHALL show a pagination bar.
