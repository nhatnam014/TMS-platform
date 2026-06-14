## 1. Database — Remove TripCost, drop tripCostId

- [x] 1.1 In `packages/db/prisma/schema.prisma`: remove the `TripCost` model entirely and remove the `tripCostId` field and `tripCost` relation from `TripPlanCost`
- [x] 1.2 Run `pnpm db:migrate` (or `pnpm --filter @tms/db db:migrate`) to generate and apply the migration that drops `trip_costs` table and `trip_cost_id` column from `trip_plan_costs`
- [x] 1.3 Run `pnpm db:generate` (or `pnpm --filter @tms/db db:generate`) to regenerate the Prisma client

## 2. Shared types — Update DTOs

- [x] 2.1 In `packages/shared/src/index.ts`: remove `tripCostId` from `AddTripPlanCostDto` and add `costName: string` in its place
- [x] 2.2 In `packages/shared/src/index.ts`: add `UpdateTripPlanDto` interface (all fields from `CreateTripPlanDto` made optional, plus optional `status: TripStatus`)
- [x] 2.3 In `packages/shared/src/index.ts`: remove `TripCostOption` interface if it exists; remove `tripCostId` from `TripPlanCostItem` interface

## 3. Backend — Remove TripCost module

- [x] 3.1 Delete the entire directory `apps/api/src/modules/trip-cost/`
- [x] 3.2 In `apps/api/src/app.module.ts`: remove the `TripCostModule` import and its entry from the `imports` array

## 4. Backend — Refactor trip-plan service and controller

- [x] 4.1 In `apps/api/src/modules/trip-plan/dto/add-trip-plan-cost.dto.ts`: replace `tripCostId: string` with `costName: string`; remove the `@IsNotEmpty()` / `@IsString()` decorators referencing `tripCostId`
- [x] 4.2 Create `apps/api/src/modules/trip-plan/dto/update-trip-plan.dto.ts`: use `PartialType(CreateTripPlanDto)` extended with an optional `status` field validated as a `TripStatus` enum value
- [x] 4.3 In `apps/api/src/modules/trip-plan/trip-plan.service.ts`: remove the `addCost()` method entirely
- [x] 4.4 In `apps/api/src/modules/trip-plan/trip-plan.service.ts`: add an `update(id: string, dto: UpdateTripPlanDto)` method that finds the trip plan (404 if not found) and updates all provided fields including optional `status`
- [x] 4.5 In `apps/api/src/modules/trip-plan/trip-plan.controller.ts`: remove the `POST /:id/costs` route and its `addCost` handler
- [x] 4.6 In `apps/api/src/modules/trip-plan/trip-plan.controller.ts`: add `PATCH /:id` route calling `tripPlanService.update(id, dto)` with the new `UpdateTripPlanDto`

## 5. Backend — Simplify import service

- [x] 5.1 In `apps/api/src/modules/import/import.service.ts`: in `importTripPlans`, remove the `tripCost.findFirst` / `tripCost.create` block; replace the `TripPlanCost.create` call to use `costName: costItem.costName` directly (no `tripCostId`)

## 6. Frontend — Remove TripCost CRUD

- [x] 6.1 Delete `apps/web/src/app/(authenticated)/trip-costs/page.tsx`
- [x] 6.2 In `apps/web/src/components/nav-sidebar.tsx`: remove the `{ href: "/trip-costs", label: "Danh mục chi phí" }` entry

## 7. Frontend — Refactor CreateTripModal cost section

- [x] 7.1 In `apps/web/src/app/(authenticated)/trip-plans/page.tsx`: remove the `TripCostOption` interface and `costOptions` / `setCostOptions` state; remove the `fetch("/api/trip-costs")` call from the `useEffect` in `CreateTripModal`
- [x] 7.2 Remove the `selectCostSlot` helper function and the `costSelectOpts` variable
- [x] 7.3 Replace each cost slot's `<select>` + disabled `<input type="number">` pair with a single `<input type="text">` amount field using live formatting: on `onChange`, strip non-digit characters and display with `toLocaleString("vi-VN")`
- [x] 7.4 Update `CostSlotState` to remove the `id` and `name` fields (only `amount: string` and `shd: string` remain for fixed slots)
- [x] 7.5 In `handleSubmit`, hardcode each slot's `*Name` to its label string constant (e.g. `phiNangName: phiNang.amount ? "PHÍ NÂNG" : undefined`); remove all `phiNang.id ?` guards — use amount presence check instead
- [x] 7.6 Keep the `chiPhiPhatSinh` slot as-is (free-form name + amount) but apply live formatting to its amount input

## 8. Frontend — Add EditTripModal

- [x] 8.1 In `apps/web/src/app/(authenticated)/trip-plans/page.tsx`: create an `EditTripModal` component that accepts a `TripPlanRow` prop; initialise all form state from the passed row (pre-fill date, vehicle, customer, carrier, locations, container fields, cost slot amounts, SHĐ, description, notes)
- [x] 8.2 Add a Status `<select>` field to `EditTripModal` pre-filled with the current trip status (options: all 5 statuses with their Vietnamese labels)
- [x] 8.3 Cost slots in `EditTripModal` use the same live-formatting amount inputs as the refactored `CreateTripModal`; pre-fill amount from `trip.phiNangAmount` etc. (format the number on init)
- [x] 8.4 `handleSubmit` in `EditTripModal` calls `PATCH /api/trip-plans/:id` with all fields (same shape as create, plus `status`)
- [x] 8.5 On success, call `onDone()` to close the modal and refresh the list

## 9. Frontend — Replace action buttons with Sửa / Xóa

- [x] 9.1 In the trip plans table rows: remove the status transition buttons (`next` button), the "Hủy" cancel button, and the "+ Chi phí" button
- [x] 9.2 Add a "Sửa" button that sets `editingTrip` state to the current row (triggers `EditTripModal`)
- [x] 9.3 Add a "Xóa" button that calls `window.confirm(...)` and on confirmation calls `DELETE /api/trip-plans/:id`; on success refresh the list
- [x] 9.4 Remove `CostModal` component and `costModalTripId` state entirely
- [x] 9.5 Add `editingTrip: TripPlanRow | null` state and render `<EditTripModal trip={editingTrip} ... />` when non-null

## 10. Verification

- [x] 10.1 Run `pnpm type-check` and confirm zero TypeScript errors
- [ ] 10.2 Start `pnpm dev`; open the trip plans page and verify only "Sửa" and "Xóa" appear in action column
- [ ] 10.3 Click "Sửa" on a trip — verify form opens pre-filled with correct data; edit a field and save; verify list updates
- [ ] 10.4 Click "Xóa" on a trip — verify confirmation prompt; confirm and verify row disappears
- [ ] 10.5 Open "Tạo chuyến" modal — verify no dropdowns in cost section; type an amount and verify live formatting (e.g. 1500000 → "1.500.000")
- [ ] 10.6 Verify "Danh mục chi phí" nav link is gone and `/trip-costs` returns 404
- [ ] 10.7 Upload a trip plan Excel file via import — verify no "Chi phí mới tự tạo" warnings in result
