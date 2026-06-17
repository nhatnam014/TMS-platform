## Context

`TripPlanService.findAll()` already builds a `where.OR` array when `filters.search` is provided. Current OR members: `tripNumber` (numeric), `vehiclePlate`, `customer.name`, `outboundContainerNumber`, `inboundContainerNumber`, `notes`. The frontend `FilterState` has `customerId`, `carrierId`, `serviceTypeCode` as dedicated filter fields sent as separate query params; the UI renders these as `<select>` dropdowns populated from reference-data fetches.

The frontend also fetches customers/carriers/service-types in two places: one for the filter dropdowns (local `filterCustomers` etc. state), and one for the create/edit form comboboxes (`customers`, `carriers`, `serviceTypes` state). These are separate fetches. Removing filter dropdowns only removes the first set of consumers — the form fetches must remain.

## Goals / Non-Goals

**Goals:**

- Add 15 fields to the backend search OR clause (all string fields, insensitive)
- Remove `customerId`, `carrierId`, `serviceTypeCode` from FilterState and filter bar UI
- Change hardcoded `limit: "20"` → `"10"` in the frontend fetch; fix derived pagination math
- Keep the status `<select>` filter and date range inputs unchanged

**Non-Goals:**

- Changing the API contract for `customerId`/`carrierId`/`serviceTypeCode` query params (backend still accepts them, just frontend stops sending them)
- Removing reference-data fetches used by create/edit forms
- Adding new UI controls beyond removing the three dropdowns
- Sorting or column-level filtering

## Decisions

### D1: Expand OR clause in service, not add new params

All new searchable fields are added to the existing `where.OR` array under the `filters.search` path. No new query params introduced. This keeps the API surface stable.

### D2: New OR members (all string fields, `mode: insensitive`)

```
pickupLocationName        — Điểm lấy (R/H)
loadUnloadLocationName    — Điểm đóng/rút
dropoffLocationName       — Điểm hạ (R/H)
shdNang                   — SHĐ nâng
shdHa                     — SHĐ hạ
shdVeSinh                 — SHĐ vệ sinh
shdVeCong                 — SHĐ vé cổng
phiNangName               — Tên phí nâng
phiHaName                 — Tên phí hạ
phiVeSinhName             — Tên phí vệ sinh
phiCuocName               — Tên phí cược
veCongName                — Tên vé cổng
chiPhiKhacName            — Tên chi phí khác
chiPhiTraiTuyenName       — Tên chi phí trái tuyến
cauDuongName              — Tên cầu đường
carrier.name              — Tên đơn vị vận chuyển
serviceTypeMaster.code    — Mã loại dịch vụ
serviceTypeMaster.description — Mô tả loại dịch vụ
```

Note: `carrier.name` and `serviceTypeMaster.code/description` are relation fields — use `{ carrier: { name: { contains: s, mode: insensitive } } }` syntax (Prisma nested where on included relations).

### D3: Frontend filter bar simplification

Remove from `FilterState`: `customerId`, `carrierId`, `serviceTypeCode`.
Remove from `DEFAULT_FILTERS`: same three fields.
Remove from params construction: same three fields.
Remove from filter bar JSX: the three `<select>` blocks and their label wrappers.
The `hasActiveFilter` check currently references all three — remove those references too.

The state variables `filterCustomers`, `filterCarriers`, `filterServiceTypes` and their fetch (in the first `useEffect`) are used ONLY for filter bar dropdowns. Once dropdowns are removed, these state variables and that fetch block can be removed. (The form-level fetch for `customers`, `carriers`, `serviceTypes` in a separate `useEffect` is kept.)

### D4: Page size 20 → 10

Three locations in `page.tsx`:

1. `params.set("limit", "20")` → `"10"`
2. `const startItem = total === 0 ? 0 : (filters.page - 1) * 20 + 1` → `* 10`
3. `const endItem = Math.min(filters.page * 20, total)` → `* 10`

## Risks / Trade-offs

- **Search recall vs. precision**: Adding 18 OR members means a search for "PHÍ" will match any trip with a cost named "PHÍ..." — which is most trips. Users should use specific terms. No mitigation needed; this is expected behavior.
- **Relation field search in Prisma**: `carrier.name` search requires the carrier relation to be included in the query's `include` (already is via `TRIP_PLAN_INCLUDE`). But `where.OR` with relation fields works independently of `include` — Prisma handles this correctly with a JOIN. No risk.
- **Removing filter dropdowns**: Users who relied on filtering by exact customer/carrier/service type via dropdown must now type a partial name in search. Given search is case-insensitive partial match, this is equivalent and more flexible.
