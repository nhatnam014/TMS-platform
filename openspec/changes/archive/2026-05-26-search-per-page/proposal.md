## Why

Users cannot search or filter entities on most listing pages — they must scroll through full lists to find a specific driver, customer, carrier, location, user, or container. Adding per-page text search on critical identifying fields removes this friction.

## What Changes

- **Drivers page** — add search input filtering by driver name and phone number
- **Customers page** — add search input filtering by customer code and name
- **Carriers page** — add search input filtering by carrier code and name
- **Locations page** — add search input filtering by location code and name
- **Users page** — add search input filtering by username
- **Containers page** — add search input filtering by container number

All filtering is client-side (in-memory after fetch) — no API changes required.

## Capabilities

### New Capabilities

- `per-page-search`: Client-side text search on entity listing pages, filtering on the entity's critical identifying properties

### Modified Capabilities

<!-- None — all search logic is purely UI-level; no spec-level behavior changes to existing capabilities -->

## Impact

- `apps/web/src/app/(authenticated)/drivers/page.tsx`
- `apps/web/src/app/(authenticated)/customers/page.tsx`
- `apps/web/src/app/(authenticated)/carriers/page.tsx`
- `apps/web/src/app/(authenticated)/locations/page.tsx`
- `apps/web/src/app/(authenticated)/users/page.tsx`
- `apps/web/src/app/(authenticated)/containers/page.tsx`
- No API changes, no new dependencies
