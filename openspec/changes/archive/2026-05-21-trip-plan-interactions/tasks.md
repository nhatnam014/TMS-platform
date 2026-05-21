## 1. Backend — Auth & Reference Data Endpoints

- [x] 1.1 Add `GET /auth/me` to `AuthController` — return `{ id, username, role }` from `req.user` (no DB query)
- [x] 1.2 Create `CustomersModule` with `CustomersController` (`GET /customers`) and `CustomersService` (findAll ordered by name)
- [x] 1.3 Create `CarriersModule` with `CarriersController` (`GET /carriers`) and `CarriersService` (findAll ordered by name)
- [x] 1.4 Create `LocationsModule` with `LocationsController` (`GET /locations`) and `LocationsService` (findAll ordered by name)
- [x] 1.5 Register `CustomersModule`, `CarriersModule`, `LocationsModule` in `AppModule`

## 2. Backend — Bug Fix

- [x] 2.1 Fix pagination coercion in `AuditService.findAll` — coerce `page` and `limit` to numbers with `Number()` (same fix as `TripPlanService`)

## 3. Frontend — Auth Context

- [x] 3.1 Create `src/lib/auth-context.tsx` — `AuthContext` with `{ username, role }`, `AuthProvider` that fetches `GET /api/auth/me` on mount, and `useAuth()` hook
- [x] 3.2 Update `src/app/(authenticated)/layout.tsx` — wrap `<NavSidebar />` and `{children}` with `<AuthProvider>`

## 4. Frontend — Nav Sidebar Role Gating

- [x] 4.1 Update `src/components/nav-sidebar.tsx` — consume `useAuth()` and conditionally render "Nhật ký kiểm tra" nav link only when `role === "ADMIN"`

## 5. Frontend — Trip Plans Interactive Page

- [x] 5.1 Convert `src/app/(authenticated)/trip-plans/page.tsx` to `"use client"` — replace `serverFetch` with `fetch("/api/trip-plans?limit=50")` in `useEffect`, add loading state
- [x] 5.2 Add status action buttons column to trip table — "Điều xe" (PLANNED), "Xuất phát" (DISPATCHED), "Hoàn thành" (IN_TRANSIT), "Hủy" (non-terminal) — each calls `PATCH /api/trip-plans/:id/status` and re-fetches list
- [x] 5.3 Add "+ Chi phí" button for COMPLETED trip rows — opens cost modal
- [x] 5.4 Build cost modal component — fields: cost type select (CostType), amount input, invoice number, description — submits to `POST /api/trip-plans/:id/costs`
- [x] 5.5 Add "Tạo chuyến" button that opens create trip modal
- [x] 5.6 Build create trip modal — fetches vehicles/customers/carriers/locations dropdowns on open, form fields per spec, submits to `POST /api/trip-plans`, closes and refreshes list on success

## 6. Frontend — Audit Log Page

- [x] 6.1 Create `src/app/(authenticated)/audit-logs/page.tsx` — `"use client"`, fetches `GET /api/audit-logs`, renders paginated table (timestamp, actor, action, entity type, entity ID, summary)
- [x] 6.2 Show access denied message when API returns 403

## 7. Verification

- [x] 7.1 Verify `GET /api/auth/me` returns correct role for both admin and operator users
- [ ] 7.2 Verify audit log nav link is hidden for OPERATOR, visible for ADMIN
- [ ] 7.3 Verify full trip creation flow: fill form → submit → trip appears in list
- [ ] 7.4 Verify status transitions: PLANNED → DISPATCHED → IN_TRANSIT → COMPLETED
- [ ] 7.5 Verify add cost to COMPLETED trip works end to end
- [ ] 7.6 Verify audit log page loads for ADMIN and returns 403 for OPERATOR
- [x] 7.7 Verify `GET /audit-logs?limit=20` returns 200 (pagination coercion fix)
