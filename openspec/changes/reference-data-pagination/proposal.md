## Why

Seven reference-data pages (yard-moves, customers, carriers, locations, service-types, container-sizes, cost-templates) currently fetch all records in a single request with no server-side pagination, causing performance degradation as data grows. The audit-log page has a backend pagination API but hardcodes `limit=50` and shows no pagination UI. Adding 10-record-per-page pagination to all 8 pages, plus live number formatting for the cost-template amount input, brings them to parity with the trip-plans page.

## What Changes

- **yard-moves**: Backend `findAll` changes to return `PaginatedResponse<T>` (10/page); controller accepts `page`/`limit` query params; frontend adds pagination UI
- **customers**: Same as above; backend adds `search` param (name/code contains); frontend moves from in-memory filter to server-side search
- **carriers**: Same as customers
- **locations**: Same, with existing `typeFilter` sent to backend as `type` query param
- **service-types**: Backend pagination; frontend pagination UI (no search needed)
- **container-sizes**: Backend pagination; frontend pagination UI (no search needed)
- **cost-templates**: Backend adds `page`/`limit` alongside existing `q`; frontend pagination UI + live-format `defaultAmount` input (digits-only with `.` thousands separator, same `fmtInput`/`stripNonDigits` pattern as trip-plans)
- **audit-logs**: Backend default `limit` changes from 50 → 10; frontend adds pagination UI (page state, prev/next, page-range label)

## Capabilities

### New Capabilities

- `yard-move-pagination`: Paginated listing for yard-move records (10/page, server-side)
- `customer-pagination`: Paginated + server-side-searched listing for customers
- `carrier-pagination`: Paginated + server-side-searched listing for carriers
- `location-pagination`: Paginated + server-side-searched + type-filtered listing for locations
- `service-type-pagination`: Paginated listing for service types
- `container-size-pagination`: Paginated listing for container sizes
- `cost-template-pagination`: Paginated listing for cost templates + live-formatted amount input
- `audit-log-pagination`: Paginated UI for audit logs (backend already supports pagination)

### Modified Capabilities

## Impact

- **API**: 7 services (`yard-move`, `customer`, `carrier`, `location`, `service-types`, `container-sizes`, `cost-templates`) and their controllers updated; `audit.service.ts` default limit change
- **Frontend**: 8 page components updated
- **Shared types**: No changes needed (`PaginatedResponse<T>` and `PaginationQuery` already exist)
- **No breaking changes** — existing filter params remain; only additions
