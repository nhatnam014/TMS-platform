## Context

`GET /vehicle-records` returns a flat array with no query params. The frontend fetches all records and renders them in a merged-row table (one VehicleRecord may span multiple rows when it has multiple moocs). TripPlanService already implements the target pattern: `findAll(filters: TripPlanFilters, pagination: PaginationQuery) → PaginatedResponse<T>`.

The main complexity is two-fold:

1. **Cross-table search**: searching by `soMooc` requires `moocs: { some: { soMooc: { contains } } }` on `VehicleRecord`, since moocs live in a related `VehicleRecordMooc` table.
2. **Cross-table expiry filter**: expiry dates exist on both `VehicleRecord` (hanDangKiem, hanCaVet) and `VehicleRecordMooc` (hanDangKiem, hanCaVet). The filter must support targeting xe, mooc, or both.

## Goals / Non-Goals

**Goals:**

- Paginate vehicle records at 10 per page (default, configurable via `limit` param)
- Full-text search across tenTaiXe, sdt, loaiXe, bienSo, soMooc (OR logic, case-insensitive)
- Expiry filter: scope (xe/mooc/all) × type (dangkiem/cavet/all) × date range
- Frontend filter controls: search input, scope selector, type selector, date range pickers
- Frontend pagination controls: page numbers, prev/next, total count display
- Frontend mooc display: when search matches by soMooc only, show only matching mooc rows

**Non-Goals:**

- Sorting by user-selected column (default createdAt asc is sufficient)
- Export/download of filtered results (separate concern)
- Saving filter state to URL params (nice-to-have, not in scope)

## Decisions

### D1: Mirror TripPlanService pagination pattern exactly

The existing `findAll(filters, pagination) → PaginatedResponse<T>` in TripPlanService is the established pattern. VehicleRecordService will follow it identically: `skip = (page-1)*limit`, `Promise.all([findMany, count])` for data + total.

### D2: Shared type — `VehicleRecordFilters`

Add to `@tms/shared`:

```
interface VehicleRecordFilters {
  search?: string;
  expiryType?: 'all' | 'dangkiem' | 'cavet';
  expiryScope?: 'all' | 'xe' | 'mooc';
  expiryFrom?: string;
  expiryTo?: string;
}
```

Reuse existing `PaginationQuery` and `PaginatedResponse<T>`.

### D3: Expiry WHERE clause — OR of applicable conditions

```
expiryConditions = []
if scope !== 'mooc':
  if type !== 'cavet': push { hanDangKiem: range }
  if type !== 'dangkiem': push { hanCaVet: range }
if scope !== 'xe':
  if type !== 'cavet': push { moocs: { some: { hanDangKiem: range } } }
  if type !== 'dangkiem': push { moocs: { some: { hanCaVet: range } } }
WHERE AND [{ OR: expiryConditions }]
```

The outer AND ensures expiry filter combines with search filter. Inner OR means "match any of these expiry conditions."

### D4: Backend always returns all moocs; frontend filters display

Filtering which moocs to display (Option B — show only matching moocs when match was via soMooc) is done client-side. The backend include always returns all moocs for matched records. Frontend logic:

```
vehicleMatchesByNonMoocField = !search || [tenTaiXe, sdt, loaiXe, bienSo].some contains search
displayMoocs = vehicleMatchesByNonMoocField ? rec.moocs : rec.moocs.filter(m => m.soMooc.includes(search))
```

This avoids complex conditional Prisma includes and is consistent with the existing merged-row table rendering.

### D5: Pagination unit = VehicleRecord rows (not display rows)

`limit=10` returns 10 VehicleRecord objects. Each may render as multiple HTML rows due to moocs. The count in meta reflects VehicleRecord count, not display row count.

### D6: default sort = createdAt asc (unchanged from current behavior)

## Risks / Trade-offs

- **Breaking API response shape**: Consumers of `GET /vehicle-records` get `{ data, meta }` instead of an array. Only the single frontend page consumes this endpoint, so impact is contained.
  → Mitigation: Update frontend fetch handling in the same PR.

- **Frontend mooc display logic**: When search term is not present, all moocs render (no change). When present, there's a client-side filter. Risk of showing zero moocs for a vehicle that matched via bienSo containing the same string as a soMooc filter.
  → Mitigation: Check non-mooc fields first; if any match, show all moocs.

- **Count query performance**: `prisma.vehicleRecord.count({ where })` with `moocs: { some: ... }` triggers a JOIN. For current data volumes this is negligible.

## Migration Plan

No database migrations required. Changes are API behavior and UI only. Frontend and backend deploy together as a monorepo build.
