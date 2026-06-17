## 1. API — trip-plan.service.ts: Expand search OR clause

- [x] 1.1 In `findAll()`, add to `where.OR` when `filters.search` is set: `{ pickupLocationName: { contains: s, mode: insensitive } }`
- [x] 1.2 Add: `{ loadUnloadLocationName: { contains: s, mode: insensitive } }`
- [x] 1.3 Add: `{ dropoffLocationName: { contains: s, mode: insensitive } }`
- [x] 1.4 Add: `{ shdNang: { contains: s, mode: insensitive } }`, `{ shdHa: { contains: s, mode: insensitive } }`, `{ shdVeSinh: { contains: s, mode: insensitive } }`, `{ shdVeCong: { contains: s, mode: insensitive } }`
- [x] 1.5 Add: `{ phiNangName: { contains: s, mode: insensitive } }`, `{ phiHaName: { contains: s, mode: insensitive } }`, `{ phiVeSinhName: { contains: s, mode: insensitive } }`, `{ phiCuocName: { contains: s, mode: insensitive } }`
- [x] 1.6 Add: `{ veCongName: { contains: s, mode: insensitive } }`, `{ chiPhiKhacName: { contains: s, mode: insensitive } }`, `{ chiPhiTraiTuyenName: { contains: s, mode: insensitive } }`, `{ cauDuongName: { contains: s, mode: insensitive } }`
- [x] 1.7 Add: `{ carrier: { name: { contains: s, mode: insensitive } } }` (relation field)
- [x] 1.8 Add: `{ serviceTypeMaster: { code: { contains: s, mode: insensitive } } }` and `{ serviceTypeMaster: { description: { contains: s, mode: insensitive } } }` (relation fields)

## 2. Frontend — FilterState cleanup

- [x] 2.1 Remove `customerId`, `carrierId`, `serviceTypeCode` fields from `FilterState` interface
- [x] 2.2 Remove `customerId: ""`, `carrierId: ""`, `serviceTypeCode: ""` from `DEFAULT_FILTERS`
- [x] 2.3 In the fetch `useEffect`: remove `params.set("customerId", ...)`, `params.set("carrierId", ...)`, `params.set("serviceTypeCode", ...)` lines
- [x] 2.4 In `hasActiveFilter`: remove `filters.customerId`, `filters.carrierId`, `filters.serviceTypeCode` from the condition

## 3. Frontend — Remove filter bar dropdowns

- [x] 3.1 Remove the "Khách hàng" `<select>` block and its label wrapper from the filter bar JSX
- [x] 3.2 Remove the "Đơn vị VC" `<select>` block and its label wrapper from the filter bar JSX
- [x] 3.3 Remove the "Dịch vụ" `<select>` block and its label wrapper from the filter bar JSX
- [x] 3.4 Remove the `filterCustomers`, `filterCarriers`, `filterServiceTypes` state variables (used only by filter bar dropdowns, not by create/edit forms)
- [x] 3.5 Remove the `useEffect` that fetches customers/carriers/service-types specifically for filter dropdowns (the separate form-data fetch must remain)

## 4. Frontend — Page size 20 → 10

- [x] 4.1 Change `params.set("limit", "20")` → `params.set("limit", "10")`
- [x] 4.2 Change `const startItem = total === 0 ? 0 : (filters.page - 1) * 20 + 1` → `* 10`
- [x] 4.3 Change `const endItem = Math.min(filters.page * 20, total)` → `* 10`

## 5. Verify

- [x] 5.1 Run `npx tsc --noEmit -p apps/api/tsconfig.json` — no errors
- [x] 5.2 Run `npx tsc --noEmit -p apps/web/tsconfig.json` — no errors
- [ ] 5.3 Manual: verify search by pickup location name returns correct trips
- [ ] 5.4 Manual: verify search by carrier name filters correctly
- [ ] 5.5 Manual: verify search by SHĐ number returns trips with that invoice
- [ ] 5.6 Manual: verify filter bar no longer shows customer/carrier/service-type dropdowns
- [ ] 5.7 Manual: verify status dropdown and date range still work
- [ ] 5.8 Manual: verify page shows 10 records per page and pagination math is correct
