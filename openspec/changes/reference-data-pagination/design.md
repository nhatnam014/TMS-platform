## Context

Seven reference-data services currently return flat arrays. One service (audit) already returns `PaginatedResponse<T>` but with a 50-record default and no frontend pagination UI. `PaginatedResponse<T>` and `PaginationQuery` types already exist in `@tms/shared`. The trip-plans and vehicle-records pages provide the reference implementation for all patterns.

## Goals / Non-Goals

**Goals**: Add 10/page server-side pagination to all 8 pages; add server-side search to customers, carriers, locations; preserve existing filter params (locationId/status for yard-moves, type for locations); add live-formatted amount input to cost-templates.

**Non-Goals**: Full-text search for service-types, container-sizes, audit-logs; changing existing create/edit/delete behavior.

## Technical Design

### Backend pattern (same for all 7 services without pagination)

```typescript
async findAll(filters: XFilters, pagination: PaginationQuery): Promise<PaginatedResponse<any>> {
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 10;
  const skip = (page - 1) * limit;
  const where: Prisma.XWhereInput = { /* existing filters */ };
  if (filters.search) {
    const s = filters.search.trim();
    where.OR = [
      { name: { contains: s, mode: Prisma.QueryMode.insensitive } },
      { code: { contains: s, mode: Prisma.QueryMode.insensitive } },
    ];
  }
  const [data, total] = await Promise.all([
    this.prisma.x.findMany({ where, skip, take: limit, orderBy: ... }),
    this.prisma.x.count({ where }),
  ]);
  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
```

Controller adds `@Query() filters: XFilters, @Query() pagination: PaginationQuery`.

### Pages with search (customers, carriers, locations)

For search-enabled pages, the frontend moves from in-memory filtering to server-side: adds `search` state, sends it as `&search=` query param, resets `page` to 1 on search change. 300ms debounce not strictly needed for reference data (smaller datasets) but follows the same pattern.

### Audit-log

Only change: backend default `limit` 50 → 10. Frontend: add `page`/`totalPages` state, change `?limit=50` → `?limit=10&page=${page}`, add Pagination component.

### Cost-template amount input formatting

Replace the generic `<Field>` component call for `defaultAmount` with an inline `<input>` that uses `fmtInput`/`stripNonDigits` helpers (copy from trip-plans page). The stored form state holds the raw digit string; display value is `fmtInput(rawValue)`. `parseAmount` already handles stripping separators before sending to the API.

### Frontend pagination component

All pages reuse the same inline `Pagination` JSX (copy-paste from vehicle-records/trip-plans pattern):

- `PAGE_SIZE = 10` constant
- `page`, `total`, `totalPages` state
- `startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1`
- `endItem = Math.min(page * PAGE_SIZE, total)`
- Pagination buttons: prev, 1, …, p-2..p+2, …, last, next

## Shared types

No changes to `@tms/shared` needed. `PaginationQuery` already accepts `page`, `limit`, `sortBy`, `sortOrder`. For customer/carrier/location search we can use inline `@Query("search")` params in controllers without a new interface, since search is a simple optional string.
