## 1. API — yard-move: add pagination

- [x] 1.1 In `yard-move.service.ts`, change `findAll(filters)` signature to `findAll(filters: YardMoveFilters, pagination: PaginationQuery): Promise<PaginatedResponse<any>>`
- [x] 1.2 Add `page`, `limit`, `skip` from pagination, replace `findMany` with `Promise.all([findMany({skip, take: limit, ...}), count({where})])`, return `{ data, meta }`
- [x] 1.3 In `yard-move.controller.ts`, add `@Query() pagination: PaginationQuery` param to `findAll`

## 2. API — customer: add pagination + search

- [x] 2.1 In `customer.service.ts`, change `findAll()` to `findAll(search: string | undefined, pagination: PaginationQuery): Promise<PaginatedResponse<any>>`
- [x] 2.2 Build `where` with optional `OR` for `name`/`code` contains search; add `Promise.all` count pattern; return `{ data, meta }`
- [x] 2.3 In `customer.controller.ts`, add `@Query("search") search?: string, @Query() pagination: PaginationQuery` params to `findAll`

## 3. API — carrier: add pagination + search

- [x] 3.1 In `carrier.service.ts`, same pattern as customer (search by name/code)
- [x] 3.2 In `carrier.controller.ts`, same as customer controller

## 4. API — location: add pagination + search + type filter

- [x] 4.1 In `location.service.ts`, change `findAll()` to accept `search`, `type`, and `pagination`; add search OR clause for name/code; preserve existing type filter logic; return `PaginatedResponse`
- [x] 4.2 In `location.controller.ts`, add `@Query("search") search?: string, @Query("type") type?: string, @Query() pagination: PaginationQuery`

## 5. API — service-types: add pagination

- [x] 5.1 In `service-types.service.ts`, change `findAll()` to accept `pagination: PaginationQuery`; return `PaginatedResponse`
- [x] 5.2 In `service-types.controller.ts`, add `@Query() pagination: PaginationQuery`

## 6. API — container-sizes: add pagination

- [x] 6.1 In `container-sizes.service.ts`, change `findAll()` to accept `pagination: PaginationQuery`; return `PaginatedResponse`
- [x] 6.2 In `container-sizes.controller.ts`, add `@Query() pagination: PaginationQuery`

## 7. API — cost-templates: add pagination

- [x] 7.1 In `cost-templates.service.ts`, change `findAll(q?)` to `findAll(q: string | undefined, pagination: PaginationQuery)`; add `skip`/`take`, `Promise.all` count, return `PaginatedResponse`
- [x] 7.2 In `cost-templates.controller.ts`, add `@Query() pagination: PaginationQuery` param alongside existing `@Query("q") q?`

## 8. API — audit-log: change default limit

- [x] 8.1 In `audit.service.ts`, change `const limit = Number(pagination.limit) || 50` → `|| 10`

## 9. Frontend — add fmtInput/stripNonDigits helpers to cost-templates

- [x] 9.1 Add `fmtInput(raw: string): string` and `stripNonDigits(v: string): string` helper functions at top of `cost-templates/page.tsx` (copy pattern from trip-plans/page.tsx)
- [x] 9.2 Replace the `<Field label="Số tiền mặc định..." value={createForm.defaultAmount} onChange={...} />` in the create modal with an inline input that uses `fmtInput`/`stripNonDigits`
- [x] 9.3 Same replacement for the edit modal's defaultAmount `<Field>` component

## 10. Frontend — yard-moves page: pagination

- [x] 10.1 Add `PAGE_SIZE = 10` constant, `page`/`total`/`totalPages` state
- [x] 10.2 Change fetch from `?limit=100` to `?limit=${PAGE_SIZE}&page=${page}`; parse `data.data` and `data.meta` instead of flat array
- [x] 10.3 Add `Pagination` component JSX (range label + prev/next + page buttons with ±2 ellipsis)
- [x] 10.4 Reset `page` to 1 when filters change (locationId, status)

## 11. Frontend — customers page: pagination + server-side search

- [x] 11.1 Add `PAGE_SIZE = 10`, `page`/`total`/`totalPages` state
- [x] 11.2 Change fetch URL from `/api/customers` to `/api/customers?search=${search}&page=${page}&limit=${PAGE_SIZE}`; parse `data.data` + `data.meta`; remove in-memory `filteredCustomers` logic
- [x] 11.3 Add `Pagination` component JSX
- [x] 11.4 Reset `page` to 1 when `search` changes

## 12. Frontend — carriers page: pagination + server-side search

- [x] 12.1 Add `PAGE_SIZE = 10`, `page`/`total`/`totalPages` state
- [x] 12.2 Change fetch URL; parse paginated response; remove in-memory filter
- [x] 12.3 Add `Pagination` component JSX
- [x] 12.4 Reset `page` to 1 when `search` changes

## 13. Frontend — locations page: pagination + server-side search

- [x] 13.1 Add `PAGE_SIZE = 10`, `page`/`total`/`totalPages` state
- [x] 13.2 Change fetch URL to include `search`, `type`, `page`, `limit`; parse paginated response; remove in-memory filter
- [x] 13.3 Add `Pagination` component JSX
- [x] 13.4 Reset `page` to 1 when `search` or `typeFilter` changes

## 14. Frontend — service-types page: pagination

- [x] 14.1 Add `PAGE_SIZE = 10`, `page`/`total`/`totalPages` state
- [x] 14.2 Change fetch URL to include `page`/`limit`; parse paginated response
- [x] 14.3 Add `Pagination` component JSX

## 15. Frontend — container-sizes page: pagination

- [x] 15.1 Add `PAGE_SIZE = 10`, `page`/`total`/`totalPages` state
- [x] 15.2 Change fetch URL to include `page`/`limit`; parse paginated response
- [x] 15.3 Add `Pagination` component JSX

## 16. Frontend — cost-templates page: pagination

- [x] 16.1 Add `PAGE_SIZE = 10`, `page`/`total`/`totalPages` state
- [x] 16.2 Change fetch URL to include `page`/`limit`; parse paginated response (change `setRows(data)` to `setRows(data.data)`)
- [x] 16.3 Add `Pagination` component JSX
- [x] 16.4 Reset `page` to 1 when `search` changes

## 17. Frontend — audit-logs page: pagination UI

- [x] 17.1 Add `PAGE_SIZE = 10`, `page`/`totalPages` state
- [x] 17.2 Change fetch URL from `?limit=50` to `?limit=${PAGE_SIZE}&page=${page}` and include `page` as a useEffect dep
- [x] 17.3 Add `Pagination` component JSX (range label + prev/next + page buttons)

## 18. Verify

- [x] 18.1 Run `npx tsc --noEmit -p apps/api/tsconfig.json` — no errors
- [x] 18.2 Run `npx tsc --noEmit -p apps/web/tsconfig.json` — no errors
- [ ] 18.3 Manual: verify each page shows 10 records and pagination bar appears
- [ ] 18.4 Manual: verify search works on customers/carriers/locations (server-side)
- [ ] 18.5 Manual: verify cost-template amount input formats live (1000 → "1.000")
- [ ] 18.6 Manual: verify audit-log pagination navigates correctly
