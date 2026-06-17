## 1. Shared — extend YardMoveFilters

- [x] 1.1 In `packages/shared/src/index.ts`, add `search?: string`, `dateFrom?: string`, `dateTo?: string` to the `YardMoveFilters` interface

## 2. API — yard-move: add search + date range

- [x] 2.1 In `yard-move.service.ts` `findAll`, build a `where` that includes: existing `isActive`/`locationId`/`status` spread plus an `OR` clause when `filters.search` is set (match `containerNumber`, `fromZone`, `toZone`, `location: { name: ... }` with `mode: Prisma.QueryMode.insensitive`)
- [x] 2.2 In `yard-move.service.ts` `findAll`, add `createdAt` range condition: if `filters.dateFrom` set → `where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) }`, same for `dateTo` → `lte`
- [x] 2.3 In `yard-move.controller.ts` `findAll`, add `@Query("search") search?: string`, `@Query("dateFrom") dateFrom?: string`, `@Query("dateTo") dateTo?: string` params and pass them into the filters object

## 3. API — customer: expand search fields

- [x] 3.1 In `customer.service.ts` `findAll`, add `{ phone: { contains: s, mode: Prisma.QueryMode.insensitive } }`, `{ email: { contains: s, mode: Prisma.QueryMode.insensitive } }`, `{ taxCode: { contains: s, mode: Prisma.QueryMode.insensitive } }` to the existing `where.OR` array

## 4. API — carrier: expand search fields

- [x] 4.1 In `carrier.service.ts` `findAll`, add `{ phone: { contains: s, mode: Prisma.QueryMode.insensitive } }` to the existing `where.OR` array

## 5. API — location: expand search fields

- [x] 5.1 In `location.service.ts` `findAll`, add `{ address: { contains: s, mode: Prisma.QueryMode.insensitive } }` to the existing `where.OR` array

## 6. API — service-types: add search + isActive filter

- [x] 6.1 In `service-types.service.ts`, change `findAll(pagination)` to `findAll(search: string | undefined, isActive: boolean | undefined, pagination: PaginationQuery)`. Build `where`: when `isActive` is not undefined add `{ isActive }`, when `search` is set add OR clause for `code`/`description` contains. Pass `where` to both `findMany` and `count`.
- [x] 6.2 In `service-types.controller.ts`, add `@Query("search") search?: string, @Query("isActive") isActiveStr?: string` params to `findAll`; parse `isActive = isActiveStr === "true" ? true : isActiveStr === "false" ? false : undefined`; call `findAll(search, isActive, pagination ?? {})`

## 7. API — container-sizes: add search + isActive filter

- [x] 7.1 In `container-sizes.service.ts`, change `findAll(pagination)` to `findAll(search: string | undefined, isActive: boolean | undefined, pagination: PaginationQuery)`. Same pattern as service-types but OR on `code`/`name`.
- [x] 7.2 In `container-sizes.controller.ts`, add `@Query("search") search?: string, @Query("isActive") isActiveStr?: string` params; parse `isActive` boolean; call `findAll(search, isActive, pagination ?? {})`

## 8. Frontend — yard-moves page: search + date range + status filter bar

- [x] 8.1 Add state: `search`, `setSearch` (string, default `""`), `dateFrom`, `setDateFrom` (string, default `""`), `dateTo`, `setDateTo` (string, default `""`)
- [x] 8.2 Change fetch URL to include `search`, `dateFrom`, `dateTo` params (append only when non-empty); remove old hardcoded `locationId`/`status` from URL if they were separate — they are now in the unified filter object passed to the API
- [x] 8.3 Add filter bar JSX above the table: a text input (placeholder "Tìm container, khu vực, địa điểm..."), a date input (From / dateFrom), a date input (To / dateTo), and a status `<select>` with options "Tất cả" / "PENDING" / "IN_PROGRESS" / "COMPLETED" / "CANCELLED" (keep existing `status` state)
- [x] 8.4 Reset `page` to 1 in `useEffect` (or explicit `onChange` handlers) when `search`, `dateFrom`, `dateTo`, or `status` changes

## 9. Frontend — service-types page: search + status filter

- [x] 9.1 Add `search`/`setSearch` (string) and `isActiveFilter`/`setIsActiveFilter` (string: `""` | `"true"` | `"false"`) state
- [x] 9.2 Change fetch URL from `/api/service-types?page=...&limit=...` to include `&search=${search}&isActive=${isActiveFilter}` (omit params when empty)
- [x] 9.3 Add filter bar JSX: a text input (placeholder "Tìm mã, mô tả...") and a `<select>` with options "Tất cả" (`""`), "Đang hoạt động" (`"true"`), "Ngừng hoạt động" (`"false"`)
- [x] 9.4 Reset `page` to 1 when `search` or `isActiveFilter` changes

## 10. Frontend — container-sizes page: search + status filter

- [x] 10.1 Add `search`/`setSearch` and `isActiveFilter`/`setIsActiveFilter` state (same as service-types)
- [x] 10.2 Change fetch URL to include `&search=${search}&isActive=${isActiveFilter}` when non-empty
- [x] 10.3 Add filter bar JSX: text input (placeholder "Tìm mã, tên...") and status `<select>` with same 3 options
- [x] 10.4 Reset `page` to 1 when `search` or `isActiveFilter` changes

## 11. Frontend — cost-templates: fix amount display

- [x] 11.1 In `cost-templates/page.tsx` table row, change `r.defaultAmount.toLocaleString("vi-VN")` to `Number(r.defaultAmount).toLocaleString("vi-VN")`

## 12. Frontend — audit-logs: date range filter

- [x] 12.1 Add `dateFrom`/`setDateFrom` and `dateTo`/`setDateTo` state (string, default `""`)
- [x] 12.2 Change fetch URL from `/api/audit-logs?limit=${PAGE_SIZE_AL}&page=${page}` to also append `&dateFrom=${dateFrom}&dateTo=${dateTo}` when non-empty; add `dateFrom` and `dateTo` to `useEffect` dependency array
- [x] 12.3 Add date filter bar JSX above the table: two `<input type="date">` fields labelled "Từ ngày" and "Đến ngày"; reset `page` to 1 on change
- [x] 12.4 Update the range label span to show active date filter if set (optional; or leave as current record range display)

## 13. Verify

- [x] 13.1 Run `npx tsc --noEmit -p apps/api/tsconfig.json` — no errors
- [x] 13.2 Run `npx tsc --noEmit -p apps/web/tsconfig.json` — no errors
- [ ] 13.3 Manual: yard-moves — search by container number filters results
- [ ] 13.4 Manual: yard-moves — date range filter limits results
- [ ] 13.5 Manual: yard-moves — status dropdown filters correctly
- [ ] 13.6 Manual: customers — search by phone number returns matching rows
- [ ] 13.7 Manual: service-types — search input + status dropdown filter correctly
- [ ] 13.8 Manual: container-sizes — search input + status dropdown filter correctly
- [ ] 13.9 Manual: cost-templates — defaultAmount displays "1.000đ" not "1000.00"
- [ ] 13.10 Manual: audit-logs — date range inputs filter the log list
