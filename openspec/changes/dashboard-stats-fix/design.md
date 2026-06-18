## Context

The dashboard currently queries `vehicleRecord.count()` for the "Xe đang hoạt động" stat, but `VehicleRecord` stores driver/vehicle info per row and some rows have no `bienSo` (license plate), inflating the count. Expiry stats (`expiringDangKiemXe` etc.) use the user's date-filter range for both the "Cần xử lý hôm nay" and "Cảnh báo hồ sơ" sections, which means the numbers change as users adjust the filter — they should be fixed anchors independent of the trip date filter. There is no mooc count stat card on the dashboard.

## Goals / Non-Goals

**Goals:**
- Count vehicles by unique non-null `bienSo` across `VehicleRecord`
- Count total moocs from `VehicleRecordMooc`
- Introduce `urgent*` expiry fields anchored to `<= today` (for "Cần xử lý hôm nay")
- Change `expiring*` fields to use a fixed `<= today+29` window (for "Cảnh báo hồ sơ")
- Display cà vẹt expiry items inline in "Cần xử lý hôm nay"
- Add "Mooc đang hoạt động" stat card

**Non-Goals:**
- Changing what the trip date filter covers (trips section stays date-filter driven)
- Adding expiry drill-down or list view changes
- Any database schema or migration changes

## Decisions

### D1: Count unique vehicles via `groupBy` on `bienSo`

Prisma supports `groupBy` — use `prisma.vehicleRecord.groupBy({ by: ['bienSo'], where: { bienSo: { not: null } } })` and take `.length`. This avoids raw SQL while correctly deduplicating rows with the same plate.

Alternative considered: raw `SELECT COUNT(DISTINCT bien_so)` query — rejected to keep Prisma ORM consistency.

### D2: Separate `urgent*` and `expiring*` fields with fixed date anchors

Rather than reusing the same 4 expiry fields for two UI sections with different windows, introduce 4 new `urgent*` fields:
- `urgentDangKiemXe / urgentCaVetXe`: count distinct non-null `bienSo` where `han* <= end-of-today`
- `urgentDangKiemMooc / urgentCaVetMooc`: count moocs where `han* <= end-of-today`

The existing `expiring*` fields are re-anchored to `<= today+29` (fixed, no longer from query params).

Alternative considered: passing a separate `urgentTo=today` param — rejected because the "urgent" threshold is always today, making a param redundant and error-prone.

### D3: Remove `expiryFrom`/`expiryTo` query params from `GET /dashboard/stats`

Since both expiry windows (urgent = today, warning = today+29) are now computed server-side, the frontend no longer sends expiry date params. The controller drops those params. Existing callers passing these params will have them silently ignored (no breaking HTTP change, only the `DashboardStats` type shape changes).

### D4: `moocsActive` = total `VehicleRecordMooc` count

`VehicleRecordMooc.soMooc` is always populated (non-optional in schema), so a simple `count()` gives total mooc units. No deduplication needed since each mooc row is a distinct mooc.

### D5: Frontend layout — 5 stat cards + 5 urgent items inline

"Tổng quan vận hành": add a 5th StatCard for "Mooc đang hoạt động" after "Xe đang hoạt động".  
"Cần xử lý hôm nay": extend the flex row with 2 additional items (urgentCaVetXe, urgentCaVetMooc) for 5 total items inline, keeping the existing "Chuyến đang chờ" item.

## Risks / Trade-offs

- **Groupby performance**: `groupBy bienSo` on a large `VehicleRecord` table does a full scan. For typical fleet sizes (hundreds to low thousands), this is negligible. → Acceptable for now; add index on `bienSo` if profiling shows slowdown.
- **Fixed window semantics**: The 29-day warning window is hardcoded server-side. If business rules change, a deploy is required. → Acceptable; this is a deliberate product decision, not a user-configurable setting.
- **`DashboardStats` BREAKING change**: Adding 5 new required fields means any consumer that destructures the type must be updated. Only one consumer exists (`dashboard/page.tsx`). → Updated in the same PR.

## Migration Plan

1. Update shared type `DashboardStats` (add 5 fields)
2. Update `dashboard.service.ts` (new queries)
3. Update `dashboard.controller.ts` (drop expiry params)
4. Update `dashboard/page.tsx` (new cards + urgent items)
5. No deploy ordering constraint — all changes ship together

## Open Questions

None — all decisions resolved during exploration.
