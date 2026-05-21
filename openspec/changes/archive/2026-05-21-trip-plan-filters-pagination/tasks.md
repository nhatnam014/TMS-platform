## 1. Shared Types

- [x] 1.1 Add `search?: string` field to the `TripPlanFilters` interface in `packages/shared/src/index.ts`

## 2. Backend — Service

- [x] 2.1 In `apps/api/src/modules/trip-plan/trip-plan.service.ts`, add an OR search clause to `findAll()` when `filters.search` is non-empty: match against `tripNumber` (parsed int), `vehicle.licensePlate`, `customer.name`, `outboundContainer.containerNumber`, `inboundContainer.containerNumber`, and `notes` — all string fields use `contains` + `mode: 'insensitive'`

## 3. Backend — Controller

- [x] 3.1 Add `@ApiQuery({ name: "search", required: false })` decorator to the `findAll()` method in `apps/api/src/modules/trip-plan/trip-plan.controller.ts`

## 4. Frontend — Filter State & Data Fetching

- [x] 4.1 Add filter state variables to the trip plans page: `dateFrom`, `dateTo`, `statusFilter`, `customerId`, `carrierId`, `serviceType`, `search`, `currentPage` (default 1), `totalPages` (from meta), `total` (from meta)
- [x] 4.2 Fetch customers and carriers on mount via `Promise.all([GET /api/customers, GET /api/carriers])` and store in state for dropdown options
- [x] 4.3 Update `fetchTrips()` to build the full query string from all active filter state variables and the current page (`?page=N&limit=20&dateFrom=...&status=...&search=...`)
- [x] 4.4 Implement debounced search: use `useEffect` with a 400ms `setTimeout` that fires `fetchTrips()` when `search` changes; clear the timer on each re-render
- [x] 4.5 Ensure any filter control change (except search) calls `setCurrentPage(1)` then `fetchTrips()` immediately

## 5. Frontend — Filter Bar UI

- [x] 5.1 Render a filter bar above the table with: Date From `<input type="date">`, Date To `<input type="date">`, Status `<select>` (all TripStatus values + blank "Tất cả"), Customer `<select>` (from customers state + blank), Carrier `<select>` (from carriers state + blank), Service Type `<select>` (SEA_EXPORT | SEA_IMPORT | NEO_EXPORT | NEO_IMPORT + blank), Search `<input type="text">` (placeholder "Tìm xe, container, khách hàng...")
- [x] 5.2 Add "Xóa bộ lọc" button that resets all filter state to defaults; only visible when at least one filter is active

## 6. Frontend — Pagination Controls

- [x] 6.1 Below the table, render pagination controls when `totalPages > 1`: "← Trước" button, up to 5 page-number buttons, "Sau →" button, label "Hiển thị X–Y / Z chuyến"
- [x] 6.2 Disable "← Trước" on page 1 and "Sau →" on the last page; clicking a page number sets `currentPage` and re-fetches

## 7. Verification

- [x] 7.1 Run `npx tsc --noEmit -p apps/web/tsconfig.json` and fix any type errors
- [x] 7.2 Run `npx tsc --noEmit -p apps/api/tsconfig.json` and fix any type errors
- [ ] 7.3 Manually verify: filter by status works, search by license plate returns correct rows, pagination navigates correctly, clearing filters reloads all records
