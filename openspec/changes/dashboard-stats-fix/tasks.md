## 1. Shared Type Update

- [x] 1.1 In `packages/shared/src/index.ts`, add `moocsActive: number` to `DashboardStats` interface
- [x] 1.2 Add `urgentDangKiemXe: number`, `urgentCaVetXe: number`, `urgentDangKiemMooc: number`, `urgentCaVetMooc: number` to `DashboardStats` interface

## 2. Backend Service — dashboard.service.ts

- [x] 2.1 Fix `vehiclesActive`: replace `vehicleRecord.count()` with `vehicleRecord.groupBy({ by: ['bienSo'], where: { bienSo: { not: null } } })` and return `.length`
- [x] 2.2 Add `moocsActive`: `vehicleRecordMooc.count()` with no filter
- [x] 2.3 Add `today` anchor variable (end-of-day: `setHours(23,59,59,999)`) in `getStats()`
- [x] 2.4 Add `urgentDangKiemXe`: `vehicleRecord.groupBy({ by: ['bienSo'], where: { bienSo: { not: null }, hanDangKiem: { lte: today } } }).length`
- [x] 2.5 Add `urgentCaVetXe`: same pattern using `hanCaVet`
- [x] 2.6 Add `urgentDangKiemMooc`: `vehicleRecordMooc.count({ where: { hanDangKiem: { lte: today } } })`
- [x] 2.7 Add `urgentCaVetMooc`: `vehicleRecordMooc.count({ where: { hanCaVet: { lte: today } } })`
- [x] 2.8 Change `expiringDangKiemXe`: replace `expiryRange` with `{ lte: today29 }` (today+29 end-of-day); use `groupBy bienSo NOT NULL` for distinct count
- [x] 2.9 Change `expiringCaVetXe`: same pattern using `hanCaVet`
- [x] 2.10 Change `expiringDangKiemMooc`: replace `expiryRange` with `{ lte: today29 }`
- [x] 2.11 Change `expiringCaVetMooc`: replace `expiryRange` with `{ lte: today29 }`
- [x] 2.12 Remove `expiryRange` / `expiryFrom` / `expiryTo` parameters from `getStats()` signature
- [x] 2.13 Return all new fields (`moocsActive`, `urgentDangKiemXe`, `urgentCaVetXe`, `urgentDangKiemMooc`, `urgentCaVetMooc`) in the returned object

## 3. Backend Controller — dashboard.controller.ts

- [x] 3.1 Remove `expiryFrom` and `expiryTo` `@Query()` params from the `getStats` controller method
- [x] 3.2 Update `service.getStats()` call to remove expiry param arguments

## 4. Frontend — dashboard/page.tsx

- [x] 4.1 Remove `expiryFrom` and `expiryTo` from the `URLSearchParams` in `fetchAll()`
- [x] 4.2 Add "Mooc đang hoạt động" `StatCard` after "Xe đang hoạt động" in "Tổng quan vận hành" (icon 🚛, iconBg `#f0fdf4`, valueColor `#16a34a`, value `stats?.moocsActive ?? 0`)
- [x] 4.3 In "Cần xử lý hôm nay", replace `stats?.expiringDangKiemXe` with `stats?.urgentDangKiemXe`
- [x] 4.4 In "Cần xử lý hôm nay", replace `stats?.expiringDangKiemMooc` with `stats?.urgentDangKiemMooc`
- [x] 4.5 Add "Xe hết hạn cà vẹt" inline item in "Cần xử lý hôm nay" using `stats?.urgentCaVetXe` (red `#dc2626` styling matching ĐK xe item)
- [x] 4.6 Add "Mooc hết hạn cà vẹt" inline item in "Cần xử lý hôm nay" using `stats?.urgentCaVetMooc` (amber `#d97706` styling matching ĐK mooc item)
