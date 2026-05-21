## 1. Containers Page

- [x] 1.1 Create `apps/web/src/app/(authenticated)/containers/page.tsx` as a `"use client"` component that fetches `GET /api/containers?limit=100` on mount
- [x] 1.2 Render a table with columns: Container Number, Size/Type, Status (badge), Current Location, Factory Zone
- [x] 1.3 Add a status filter `<select>` dropdown that re-fetches with `?status=<value>` when changed
- [x] 1.4 Implement color-coded status badges (EMPTY_AVAILABLE/EMPTY_IN_TRANSIT → grey, EMPTY_AT_YARD → yellow, BEING_LOADED → orange, LOADED_READY → green, LOADED_IN_TRANSIT → blue, DELIVERED → muted)
- [x] 1.5 Handle loading, empty, and error states

## 2. Yard Moves Page

- [x] 2.1 Create `apps/web/src/app/(authenticated)/yard-moves/page.tsx` as a `"use client"` component that fetches `GET /api/yard-moves?limit=100` on mount
- [x] 2.2 Render a table with columns: Date, Container, From Zone, To Zone, Location, Status (badge), Actions
- [x] 2.3 Implement `CreateYardMoveModal` component: fetches containers + locations on open, form fields (date, containerId, fromZone, toZone, locationId, notes), POSTs to `/api/yard-moves` on submit, refreshes list on success
- [x] 2.4 Implement inline status transition buttons per row: PENDING → "Bắt đầu" + "Hủy", IN_PROGRESS → "Hoàn thành" + "Hủy", terminal states → no buttons; each calls `PATCH /api/yard-moves/:id/status`
- [x] 2.5 Implement `CostModal` component for yard moves: type select (YARD_HANDLING/FORKLIFT/OVERTIME/OTHER), amount input, note textarea; visible for IN_PROGRESS and COMPLETED moves; POSTs to `/api/yard-moves/:id/costs`
- [x] 2.6 Handle loading, empty, error states, and action errors

## 3. Navigation

- [x] 3.1 Add "Phương tiện container" link `{ href: "/containers", label: "Container" }` to `BASE_NAV_ITEMS` in `apps/web/src/components/nav-sidebar.tsx`
- [x] 3.2 Add "Điều phối bãi" link `{ href: "/yard-moves", label: "Lệnh bãi" }` to `BASE_NAV_ITEMS` in `apps/web/src/components/nav-sidebar.tsx`

## 4. Verification

- [x] 4.1 Run `npm run type-check` and fix any type errors
- [ ] 4.2 Manually verify containers page loads and status filter works
- [ ] 4.3 Manually verify yard move create, status transitions, and cost add work end-to-end
