## Why

The trip plans list already supports backend pagination and a basic text search, but the search only covers a narrow set of fields (trip number, plate, customer name, container numbers, notes). Users need to find trips by location names, invoice numbers (SHĐ), cost category names, carrier name, and service type — fields that currently require knowing the exact record. Additionally, the per-page limit of 20 is inconsistent with the 10-record standard used elsewhere, and three dropdown filters (customer, carrier, service type) add visual clutter when the search box can cover them.

## What Changes

- Change page size default from 20 → 10 in the frontend (backend default remains flexible)
- Expand backend `search` OR clause to cover 15+ additional fields
- Remove three dropdown filters from the filter bar: customer (customerId), carrier (carrierId), service type (serviceTypeCode) — these are replaced by text search
- Keep remaining filters: date range (dateFrom/dateTo) and status dropdown
- Remove `customerId`, `carrierId`, `serviceTypeCode` from `FilterState` in the frontend

## Capabilities

### New Capabilities

- `trip-plan-search-expanded`: Extended search covering location names, SHĐ fields, cost name fields, carrier name, service type

### Modified Capabilities

- `trip-plan-pagination`: Page size changes from 20 to 10; filter bar simplified
- `trip-plan-filter-bar`: Remove customer/carrier/service-type dropdowns; keep date range and status

## Impact

- `apps/api/src/modules/trip-plan/trip-plan.service.ts`: expand `where.OR` in `findAll()`
- `apps/web/src/app/(authenticated)/trip-plans/page.tsx`:
  - Remove `customerId`, `carrierId`, `serviceTypeCode` from `FilterState` and `DEFAULT_FILTERS`
  - Remove the three corresponding `<select>` elements from the filter bar
  - Change hardcoded `limit: "20"` to `"10"`, fix `startItem`/`endItem` math accordingly
  - Remove fetching of `filterCustomers`, `filterCarriers`, `filterServiceTypes` if no longer needed by filter bar (still needed for create/edit forms — keep those fetches)
