## 1. Shared Types

- [x] 1.1 In `packages/shared/src/index.ts`: add `VehicleRecordFilters` interface with fields `search?`, `expiryType?: 'all'|'dangkiem'|'cavet'`, `expiryScope?: 'all'|'xe'|'mooc'`, `expiryFrom?`, `expiryTo?`
- [x] 1.2 Run `pnpm --filter @tms/shared build` to rebuild dist

## 2. API — vehicle-record.service.ts

- [x] 2.1 Change `findAll()` signature to `findAll(filters: VehicleRecordFilters, pagination: PaginationQuery): Promise<PaginatedResponse<any>>`
- [x] 2.2 Compute `skip = (page-1) * limit`, default `page=1`, `limit=10`, `sortBy='createdAt'`, `sortOrder='asc'`
- [x] 2.3 Build search WHERE: when `filters.search` is set, add `{ OR: [{ tenTaiXe: { contains, insensitive } }, { sdt: { contains } }, { loaiXe: { contains, insensitive } }, { bienSo: { contains, insensitive } }, { moocs: { some: { soMooc: { contains, insensitive } } } }] }`
- [x] 2.4 Build expiry WHERE: when `expiryFrom` or `expiryTo` is set, compute `range = { gte, lte }` then collect `expiryConditions[]` based on scope×type matrix (D3 in design.md), push as `{ OR: expiryConditions }` into `where.AND`
- [x] 2.5 Run `Promise.all([prisma.vehicleRecord.findMany({ where, include: { moocs: true }, skip, take: limit, orderBy: { createdAt: 'asc' } }), prisma.vehicleRecord.count({ where })])`
- [x] 2.6 Return `{ data, meta: { total, page, limit, totalPages: Math.ceil(total/limit) } }`

## 3. API — vehicle-record.controller.ts

- [x] 3.1 Add `@Query` params to `findAll` route: `search?`, `page?`, `limit?`, `expiryType?`, `expiryScope?`, `expiryFrom?`, `expiryTo?`
- [x] 3.2 Call `this.vehicleRecordService.findAll({ search, expiryType, expiryScope, expiryFrom, expiryTo }, { page, limit })`

## 4. Web — State and Fetch

- [x] 4.1 Add filter state: `search` (string, default ""), `expiryScope` ("all"|"xe"|"mooc", default "all"), `expiryType` ("all"|"dangkiem"|"cavet", default "all"), `expiryFrom` (string, default ""), `expiryTo` (string, default "")
- [x] 4.2 Add pagination state: `page` (number, default 1), `total` (number), `totalPages` (number)
- [x] 4.3 Update `VehicleRecord` interface reference in page to match paginated fetch (response is `{ data, meta }` not array)
- [x] 4.4 Update `useEffect` fetch URL to include all filter and pagination params; on response, set `records = data`, `total = meta.total`, `totalPages = meta.totalPages`
- [x] 4.5 Reset `page` to 1 when any filter changes (search, expiryScope, expiryType, expiryFrom, expiryTo)

## 5. Web — Filter UI

- [x] 5.1 Add search input above table with placeholder "Tìm tên tài xế, SĐT, loại xe, biển số, số mooc"; update `search` state on change and trigger fetch (debounce 300ms or use input onChange with page-reset)
- [x] 5.2 Add expiry scope selector buttons: Tất cả / Xe / Mooc (updates `expiryScope` state)
- [x] 5.3 Add expiry type selector buttons: Tất cả / Đăng kiểm / Cà vẹt (updates `expiryType` state)
- [x] 5.4 Add date range inputs: Từ [date] Đến [date] (updates `expiryFrom`, `expiryTo` state)
- [x] 5.5 Style: scope/type selectors as button group similar to dashboard filter buttons; date inputs inline

## 6. Web — Mooc Display Logic

- [x] 6.1 Add helper `vehicleMatchesByField(rec, search)`: returns true if `!search` OR any of tenTaiXe/sdt/loaiXe/bienSo contains search (case-insensitive)
- [x] 6.2 In table render: for each record, compute `displayMoocs = vehicleMatchesByField(rec, search) ? rec.moocs : rec.moocs.filter(m => m.soMooc.toLowerCase().includes(search.toLowerCase()))`
- [x] 6.3 Replace all uses of `rec.moocs` in the table render (rowspan calculation, mooc row loops) with `displayMoocs`

## 7. Web — Pagination Controls

- [x] 7.1 Add pagination controls below table: display "Tổng: N bản ghi" on left; page buttons on right
- [x] 7.2 Render page number buttons: show current page ±2 neighbors, with "..." ellipsis for skipped ranges; max ~7 buttons visible
- [x] 7.3 Prev (←) and Next (→) buttons; disable prev on page=1, disable next on page=totalPages
- [x] 7.4 Clicking a page button sets `page` state (triggers fetch via useEffect)

## 8. Verify

- [x] 8.1 Run `npx tsc --noEmit -p apps/api/tsconfig.json` — no errors
- [x] 8.2 Run `npx tsc --noEmit -p apps/web/tsconfig.json` — no errors
- [ ] 8.3 Manual: verify search by tenTaiXe returns correct records
- [ ] 8.4 Manual: verify search by soMooc shows only matching mooc rows (not all moocs)
- [ ] 8.5 Manual: verify search by bienSo shows all moocs for matched vehicle
- [ ] 8.6 Manual: verify expiry filter scope=xe, type=dangkiem narrows list correctly
- [ ] 8.7 Manual: verify expiry filter scope=mooc, type=cavet narrows list correctly
- [ ] 8.8 Manual: verify pagination — page 2 shows next 10 records; total count is correct
- [ ] 8.9 Manual: verify search + expiry filter combine (both must match)
- [ ] 8.10 Manual: verify filter change resets to page 1
