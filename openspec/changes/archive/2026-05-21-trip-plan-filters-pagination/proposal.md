## Why

The trip plans page currently loads only the last 50 records with no filters — operators cannot slice by date, customer, status, or search for a specific vehicle or container number. As trip volume grows this becomes unusable for daily dispatch coordination.

## What Changes

- Add `search?: string` to `TripPlanFilters` in `@tms/shared` so the shared type covers full-text search
- Extend `TripPlanService.findAll()` to apply a Prisma `OR` clause across `tripNumber`, `vehicle.licensePlate`, `customer.name`, `outboundContainer.containerNumber`, `inboundContainer.containerNumber`, and `notes` when `search` is provided
- Add `@ApiQuery` decorator for `search` to `TripPlanController.findAll()`
- Rewrite the trip plans page filter area to expose: date range, status, customer, carrier, service type, and a debounced text search input
- Replace the hard-coded `?limit=50` fetch with a fully-parameterised query that respects all active filters and the current page
- Add pagination controls below the table (prev/next, page numbers, "showing X–Y of Z" label)

## Capabilities

### New Capabilities

- `trip-plan-search`: Full-text search across key trip plan fields (trip number, license plate, customer, container numbers, notes)
- `trip-plan-filter-bar`: Structured filter controls — date range, status, customer, carrier, service type — that combine with each other and with text search
- `trip-plan-pagination`: Server-side pagination with page controls, replacing the static 50-record cap

### Modified Capabilities

- `trip-plan-crud`: The `GET /trip-plans` contract gains one new optional query param (`search`). Fully backwards-compatible — existing callers passing no `search` see identical behaviour.

## Impact

- **Backend**: `packages/shared/src/index.ts` (add field), `apps/api/src/modules/trip-plan/trip-plan.service.ts` (OR clause), `apps/api/src/modules/trip-plan/trip-plan.controller.ts` (ApiQuery)
- **Frontend**: `apps/web/src/app/(authenticated)/trip-plans/page.tsx` (filter bar + pagination)
- No schema migrations. No new endpoints. No breaking changes.
