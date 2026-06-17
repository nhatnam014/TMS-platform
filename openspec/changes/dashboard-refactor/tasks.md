## 1. Shared Types

- [x] 1.1 In `packages/shared/src/index.ts`: remove `tripsCompleted`, `vehiclesInMaintenance`, `expiringCompliance` from `DashboardStats`
- [x] 1.2 Add `tripsWaiting: number` to `DashboardStats`
- [x] 1.3 Add `expiringDangKiemXe: number`, `expiringCaVetXe: number`, `expiringDangKiemMooc: number`, `expiringCaVetMooc: number` to `DashboardStats`
- [x] 1.4 Add new type `ExpiryItem` to shared: `{ entityType: "xe" | "mooc"; plateOrMooc: string; parentPlate?: string; expType: "dangkiem" | "cavet"; expDate: string; daysLeft: number }`
- [x] 1.5 Add new type `TripsTrendItem` to shared: `{ date: string; count: number }`
- [x] 1.6 Run `pnpm --filter @tms/shared build` to rebuild dist

## 2. API — dashboard.service.ts

- [x] 2.1 Rewrite `getStats(tripFrom?, tripTo?, expiryFrom?, expiryTo?)`: default trip range = today only, default expiry range = today to today+30d
- [x] 2.2 In `getStats`: count `tripsWaiting` where `status IN (PLANNED, DISPATCHED)` and `tripDate` in trip range
- [x] 2.3 In `getStats`: count `tripsInTransit` where `status = IN_TRANSIT` and `tripDate` in trip range
- [x] 2.4 In `getStats`: count `totalTrips` (all statuses) where `tripDate` in trip range
- [x] 2.5 In `getStats`: count `vehiclesActive` as total `VehicleRecord` rows (no date filter)
- [x] 2.6 In `getStats`: count `expiringDangKiemXe` from `VehicleRecord.hanDangKiem` in expiry range
- [x] 2.7 In `getStats`: count `expiringCaVetXe` from `VehicleRecord.hanCaVet` in expiry range
- [x] 2.8 In `getStats`: count `expiringDangKiemMooc` from `VehicleRecordMooc.hanDangKiem` in expiry range
- [x] 2.9 In `getStats`: count `expiringCaVetMooc` from `VehicleRecordMooc.hanCaVet` in expiry range
- [x] 2.10 Add `getTripsTrend(from, to)`: group TripPlan by `tripDate` within range, return `TripsTrendItem[]`
- [x] 2.11 Add `getExpiryList(from, to, entity: "all"|"xe"|"mooc", type: "all"|"dangkiem"|"cavet")`:
  - Query VehicleRecord (if entity ≠ "mooc"): collect hanDangKiem and hanCaVet events — always include if expDate < today, also include if expDate in [from, to]
  - Query VehicleRecordMooc (if entity ≠ "xe"): same logic, include parentPlate from VehicleRecord.bienSo
  - Filter by `type` param if not "all"
  - Compute `daysLeft` for each event
  - Return sorted by `daysLeft` ascending (most urgent first)

## 3. API — dashboard.controller.ts

- [x] 3.1 Update `getStats()` route to accept `@Query` params: `tripFrom`, `tripTo`, `expiryFrom`, `expiryTo` (all optional strings) and pass to service
- [x] 3.2 Add `GET /dashboard/trips-trend` route with `@Query` `from` and `to` params, calls `getTripsTrend()`
- [x] 3.3 Add `GET /dashboard/expiry-list` route with `@Query` `from`, `to`, `entity`, `type` params, calls `getExpiryList()`

## 4. Web — Install Recharts

- [x] 4.1 Run `pnpm --filter @tms/web add recharts` (or add to `apps/web/package.json` and run `pnpm install`)

## 5. Web — Dashboard Page Rewrite

- [x] 5.1 Convert `apps/web/src/app/(authenticated)/dashboard/page.tsx` to `"use client"` Client Component
- [x] 5.2 Add state: `tripFrom`, `tripTo` (default: today ISO string for both)
- [x] 5.3 Add state: `expiryFrom` (default: today), `expiryTo` (default: today+30d)
- [x] 5.4 Fetch stats on mount and on filter change via `useEffect` → `GET /api/dashboard/stats?tripFrom=...&tripTo=...&expiryFrom=...&expiryTo=...`
- [x] 5.5 Render trip date range picker section (two `<input type="date">`) labeled "Lọc chuyến xe"
- [x] 5.6 Render 4 trip stat cards: Tổng chuyến, Xe đang chờ, Đang vận chuyển, Xe đang hoạt động
- [x] 5.7 Render 4 expiry stat cards: Hết hạn ĐK xe, Hết hạn Cà vẹt xe, Hết hạn ĐK mooc, Hết hạn Cà vẹt mooc (using expiry date range)

## 6. Web — Charts

- [x] 6.1 Fetch trend data on trip date range change → `GET /api/dashboard/trips-trend?from=...&to=...`
- [x] 6.2 Render `LineChart` (Recharts) with `date` on X-axis and `count` on Y-axis; label "Chuyến theo ngày"; show empty state if no data
- [x] 6.3 Fetch per-status counts for Pie chart (derive from stats or add field): count PLANNED, DISPATCHED, IN_TRANSIT, COMPLETED in trip range
- [x] 6.4 Render `PieChart` (Recharts) with trip status distribution; label each slice in Vietnamese; hide zero-count slices
- [x] 6.5 Render `BarChart` (Recharts) with 4 bars for ĐK xe, Cà vẹt xe, ĐK mooc, Cà vẹt mooc using expiry stat values

## 7. Web — Expiry Report Table

- [x] 7.1 Add expiry section state: `expiryEntity` ("all"|"xe"|"mooc", default "all"), `expiryType` ("all"|"dangkiem"|"cavet", default "all")
- [x] 7.2 Fetch expiry list on mount and on filter change → `GET /api/dashboard/expiry-list?from=...&to=...&entity=...&type=...`
- [x] 7.3 Render expiry date picker pair with helper text: "Xe/mooc đã hết hạn luôn được hiển thị"
- [x] 7.4 Render entity type filter buttons: Tất cả / Xe / Mooc
- [x] 7.5 Render expiry type filter buttons: Tất cả / Đăng kiểm / Cà vẹt
- [x] 7.6 Render expiry table with columns: Loại | Biển số/Mooc | Thuộc xe | Loại hạn | Ngày hết hạn | Còn lại
- [x] 7.7 Apply row color: red for daysLeft < 0, orange for 0–7, yellow for 8–30, no highlight for > 30
- [x] 7.8 Show total count above table: "Tổng: N mục"

## 8. Verify

- [x] 8.1 Run `npx tsc --noEmit -p apps/api/tsconfig.json` — no errors
- [x] 8.2 Run `npx tsc --noEmit -p apps/web/tsconfig.json` — no errors
- [ ] 8.3 Manual: verify 4 trip stat cards update when trip date range changes
- [ ] 8.4 Manual: verify 4 expiry stat cards update when expiry date range changes
- [ ] 8.5 Manual: verify Line chart shows correct daily counts
- [ ] 8.6 Manual: verify Pie chart shows correct status distribution
- [ ] 8.7 Manual: verify Bar chart shows 4 expiry category bars
- [ ] 8.8 Manual: verify expiry table shows expired records (daysLeft < 0) in red regardless of filter
- [ ] 8.9 Manual: verify entity filter (Xe/Mooc) and type filter (ĐK/CàVẹt) narrow the expiry table correctly
