## 1. YardMove Backend — DB Migration

- [x] 1.1 Add `isActive Boolean @default(true) @map("is_active")` to `YardMove` model in `packages/db/prisma/schema.prisma`
- [x] 1.2 Run `npx prisma migrate dev --name add-yard-move-is-active` to generate and apply the migration

## 2. YardMove Backend — API

- [x] 2.1 Create `apps/api/src/modules/yard-move/dto/update-yard-move.dto.ts` with all fields from `CreateYardMoveDto` made optional plus `isActive?: boolean`
- [x] 2.2 Add `update(id, dto)` method to `YardMoveService` that patches the record and filters `findAll` by `isActive: true`
- [x] 2.3 Add `@Patch(':id')` route to `YardMoveController` calling `yardMoveService.update(id, dto)`

## 3. UI — Customers Page

- [x] 3.1 Add `confirmDeleteId` state and confirmation dialog component in `apps/web/src/app/(authenticated)/customers/page.tsx`
- [x] 3.2 Rename "Deactivate"/"Vô hiệu hóa" button label to "Xoá" and apply red/danger style (`color: #ef4444, border-color: #ef4444`)
- [x] 3.3 Wire "Xoá" button to set `confirmDeleteId`, wire dialog confirm to call `handleDeactivate`

## 4. UI — Carriers Page

- [x] 4.1 Add `confirmDeleteId` state and confirmation dialog component in `apps/web/src/app/(authenticated)/carriers/page.tsx`
- [x] 4.2 Rename "Deactivate"/"Vô hiệu hóa" button label to "Xoá" and apply red/danger style
- [x] 4.3 Wire "Xoá" button to set `confirmDeleteId`, wire dialog confirm to call `handleDeactivate`

## 5. UI — Locations Page

- [x] 5.1 Add `confirmDeleteId` state and confirmation dialog component in `apps/web/src/app/(authenticated)/locations/page.tsx`
- [x] 5.2 Rename "Deactivate"/"Vô hiệu hóa" button label to "Xoá" and apply red/danger style
- [x] 5.3 Wire "Xoá" button to set `confirmDeleteId`, wire dialog confirm to call `handleDeactivate`

## 6. UI — Vehicles Page

- [x] 6.1 Add `confirmDeleteId` state and confirmation dialog in `apps/web/src/app/(authenticated)/vehicles/page.tsx`
- [x] 6.2 Wrap existing MAINTENANCE and ACTIVE transition buttons in `{false && ...}` to hide them
- [x] 6.3 Replace the DECOMMISSIONED transition button with a red "Xoá" button that opens the confirmation dialog
- [x] 6.4 Wire dialog confirm to call `PATCH /vehicles/:id` with `{ status: "DECOMMISSIONED" }`

## 7. UI — Drivers Page

- [x] 7.1 Add `confirmDeleteId` state and confirmation dialog in `apps/web/src/app/(authenticated)/drivers/page.tsx`
- [x] 7.2 Wrap existing "Unassign" and "Assign" buttons in `{false && ...}` to hide them
- [x] 7.3 Add a red "Xoá" button that opens the confirmation dialog
- [x] 7.4 Wire dialog confirm to call `PATCH /drivers/:id` with `{ status: "TERMINATED" }`

## 8. UI — Yard Moves Page

- [x] 8.1 Add `confirmDeleteId` state and confirmation dialog in `apps/web/src/app/(authenticated)/yard-moves/page.tsx`
- [x] 8.2 Wrap existing status-transition buttons ("Bắt đầu", "Hoàn thành", "Hủy") in `{false && ...}`
- [x] 8.3 Wrap existing "+ Chi phí" cost button in `{false && ...}`
- [x] 8.4 Add `editMove` state + Edit modal with fields: date, containerNumber, fromZone, toZone, locationId, notes (pre-filled from selected row)
- [x] 8.5 Add "Sửa" button per row that opens the Edit modal
- [x] 8.6 Wire Edit modal submit to call `PATCH /api/yard-moves/:id` with updated fields
- [x] 8.7 Add red "Xoá" button per row that opens the confirmation dialog
- [x] 8.8 Wire dialog confirm to call `PATCH /api/yard-moves/:id` with `{ isActive: false }`
