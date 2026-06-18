## Why

The dashboard stats section has three correctness bugs: vehicle count inflates because it counts all `VehicleRecord` rows (including records with no license plate), the "Cần xử lý hôm nay" alert section reuses the user's date-filter range instead of a fixed "today" anchor, and no stat card exists for active mooc units. The expiry warning section also lacks a clear definition of its window, causing inconsistent numbers.

## What Changes

- **FIX** `vehiclesActive` stat: change from `vehicleRecord.count()` to a `groupBy` on non-null `bienSo`, counting only unique license plates
- **ADD** `moocsActive` stat: count of all `VehicleRecordMooc` rows (moocs in the system)
- **ADD** "Mooc đang hoạt động" stat card in "Tổng quan vận hành" section
- **FIX** "Cần xử lý hôm nay" section: replace date-filter-relative expiry fields with fixed `urgent*` fields anchored to `<= today` (covers both past-overdue and expiring-today items)
- **ADD** `urgentCaVetXe` and `urgentCaVetMooc` to "Cần xử lý hôm nay" (previously only đăng kiểm shown)
- **FIX** "Cảnh báo hồ sơ (sắp hết hạn)" section: change from date-filter range to a fixed window of `<= today+29` (expired + expiring in next 29 days), independent of the user date filter
- **REMOVE** `expiryFrom`/`expiryTo` query params from `GET /dashboard/stats` (expiry is now always fixed-window)
- **BREAKING** `DashboardStats` shared type: add `moocsActive`, `urgentDangKiemXe`, `urgentCaVetXe`, `urgentDangKiemMooc`, `urgentCaVetMooc`

## Capabilities

### New Capabilities

- `dashboard-stats-fix`: Corrected vehicle/mooc counting logic, new urgent expiry fields anchored to today, and fixed 29-day warning window for the expiry alert section

### Modified Capabilities

- `dashboard-stats`: Vehicle active count logic changes (unique bienSo), new mooc active count, new urgent expiry fields, fixed expiry warning window; API param `expiryFrom`/`expiryTo` removed

## Impact

- `packages/shared/src/index.ts` — **BREAKING**: add `moocsActive`, `urgentDangKiemXe`, `urgentCaVetXe`, `urgentDangKiemMooc`, `urgentCaVetMooc` to `DashboardStats`
- `apps/api/src/modules/dashboard/dashboard.service.ts` — fix `vehiclesActive` query, add `moocsActive`, add 4 `urgent*` queries with fixed-today anchor, change `expiring*` queries to fixed today+29 window
- `apps/api/src/modules/dashboard/dashboard.controller.ts` — remove `expiryFrom`/`expiryTo` params
- `apps/web/src/app/(authenticated)/dashboard/page.tsx` — update fetch to drop expiry params, wire new `urgent*` fields in "Cần xử lý hôm nay", add cà vẹt items inline, add "Mooc đang hoạt động" stat card
- No database migrations required
