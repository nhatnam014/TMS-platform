## Context

Trip plans is the core operational page, used by all roles daily. The backend already returns `PaginatedResponse<T>` with `{ data, meta: { total, page, limit, totalPages } }` and accepts `TripPlanFilters` + `PaginationQuery`. The frontend already reads `data.data` and `data.meta.total` — it just never passes filter params. This change is mostly additive wiring.

Key verified facts:
- `TripPlanFilters` already has `dateFrom`, `dateTo`, `customerId`, `carrierId`, `vehicleId`, `serviceType`, `status` — only `search` is missing
- Pagination coercion (`Number(page) || 1`, `Number(limit) || 20`) already exists in the service
- `GET /api/customers` and `GET /api/carriers` already return `{ id, code, name }[]` — same endpoints used by `CreateTripModal`
- Prisma supports `mode: 'insensitive'` (ILIKE) on PostgreSQL string fields

## Goals / Non-Goals

**Goals:**
- Server-side text search across 6 trip plan fields
- 6 filter controls: date-from, date-to, status, customer, carrier, service-type
- Debounced search input (400ms) — avoids a request on every keystroke
- Page navigation controls with "showing X–Y of Z" label
- Default page size 20; URL params not required (in-memory state is sufficient)

**Non-Goals:**
- No `vehicleId` filter dropdown in this change (adds noise; can add later)
- No URL-param persistence (state resets on navigation; acceptable for now)
- No client-side filtering — all filtering/search is server-side
- No changes to other pages (containers, yard-moves, etc.) — separate follow-up change

## Decisions

**1. Search OR across relations using Prisma nested where**

Prisma supports `{ vehicle: { licensePlate: { contains: search, mode: 'insensitive' } } }` for direct (many-to-one) relations, and `{ outboundContainer: { containerNumber: { contains: search } } }` for optional relations. This works correctly even when the related record is null — Prisma simply doesn't match those rows, which is the desired behaviour.

For `tripNumber` (Int?): try `parseInt(search, 10)` — if the result is a valid integer, include `{ tripNumber: num }` in the OR. Otherwise skip it.

The OR clause is appended to the existing `where` object. Prisma AND's top-level `where` fields, so `status = COMPLETED AND (licensePlate ILIKE '%x%' OR customer.name ILIKE '%x%' OR ...)` is produced correctly.

**2. Debounce on frontend, not throttle**

A 400ms debounce (cancel-and-reschedule on each keystroke) is better than a throttle here — it waits for the user to pause typing before firing. Implemented with `useEffect` + `setTimeout`/`clearTimeout`. No external library needed.

**3. Filters reset page to 1**

Any filter change (including search) resets `currentPage` to 1. Otherwise the user could end up on page 5 of a 2-page result set.

**4. Customer and carrier dropdowns populated on mount**

Fetch `GET /api/customers` and `GET /api/carriers` once on page mount (not on each filter change). Store in state. Same pattern as `CreateTripModal` — parallel `Promise.all` fetch.

**5. Pagination UI: simplified number list**

Show at most 5 page buttons. For large page counts, show first/last with ellipsis. "← Trước" and "Sau →" always present; disabled when at boundary.

**6. "Clear filters" button**

Resets all filter state to defaults and page to 1. Appears only when at least one filter is active.

## Risks / Trade-offs

- **OR across 6 fields + 3 relation joins can be slow on large tables**: All join columns (`vehicleId`, `customerId`, `outboundContainerId`, `inboundContainerId`) are indexed. `licensePlate` and `containerNumber` have `@unique` constraints (implicitly indexed). Risk is low for the expected dataset size (~thousands of trips).
- **`mode: 'insensitive'` on PostgreSQL**: Uses `ILIKE` which is not index-accelerated on plain B-tree indexes. For the expected scale this is fine. A full-text index can be added later if performance degrades.

## Open Questions

None — all decisions made above.
