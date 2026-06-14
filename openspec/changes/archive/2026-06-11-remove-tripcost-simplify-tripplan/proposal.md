## Why

The TripCost catalog (a separate lookup table for cost types) has been deemed unnecessary by the client — cost names are short, stable strings that users prefer to enter directly rather than managing through a catalog UI. The current trip plans action buttons (status transitions, add-cost) are being replaced by a simpler Edit/Delete flow so that all trip data is managed in one place.

## What Changes

- **REMOVED** TripCost CRUD module: API module, controller, service, DTOs, and the `/trip-costs` frontend page are deleted.
- **REMOVED** "Danh mục chi phí" nav sidebar link.
- **REMOVED** All action buttons on the trip plans table (status transition buttons, cancel button, "+ Chi phí" button). Only "Sửa" (Edit) and "Xóa" (Delete) remain.
- **REMOVED** `CostModal` component (add-cost-after-creation flow is gone).
- **REMOVED** `POST /api/v1/trip-plans/:id/costs` endpoint (addCost).
- **MODIFIED** Trip plan creation form (CreateTripModal): the "Chi phí chuyến" section removes the TripCost selection dropdown from each cost slot. Users type amounts directly. Amount inputs display live Vietnamese thousand-separator formatting (1000 → 1.000).
- **ADDED** EditTripModal: identical layout to CreateTripModal, pre-filled with the trip's existing data, includes a Status dropdown (all statuses selectable). Submits via `PATCH /api/v1/trip-plans/:id`.
- **ADDED** `PATCH /api/v1/trip-plans/:id` (full update endpoint) accepting all CreateTripPlanDto fields plus an optional `status` field.
- **ADDED** Delete trip confirmation flow: clicking "Xóa" asks for confirmation before calling `DELETE /api/v1/trip-plans/:id`.
- **MODIFIED** Excel import for trip plans (`importTripPlans`): removes the `TripCost.findFirst` / `TripCost.create` catalog step; creates `TripPlanCost` rows with `costName` directly.
- **DATABASE** Drop `trip_costs` table; drop `trip_cost_id` column from `trip_plan_costs`. `TripPlanCost.costName` (already a snapshot string) becomes the sole cost identifier.
- **KEPT** `PATCH /api/v1/trip-plans/:id/status` (`updateStatus`) — unchanged, reserved for future use.

## Capabilities

### New Capabilities

- `trip-plan-edit`: Full edit of an existing trip plan via a pre-filled modal form, including status change.
- `trip-plan-delete`: Delete a trip plan with a confirmation step.
- `trip-cost-freeform-entry`: Cost slots in the trip plan form accept a free-form amount (no catalog lookup), with live thousand-separator formatting.

### Modified Capabilities

- `trip-plan-crud`: Delete endpoint now exists in UI; new full-update endpoint added; addCost endpoint removed.
- `trip-plan-cost-entry`: TripCost catalog lookup removed; costName typed directly.
- `trip-plan-cost-form`: Selection dropdowns removed; replaced by plain amount + SHĐ inputs.
- `trip-cost-catalog`: Entire capability removed — no CRUD, no table, no nav link.
- `trip-plan-excel-import`: Import no longer creates TripCost catalog rows; inserts TripPlanCost with costName directly.

## Impact

- `apps/api/src/modules/trip-cost/` — deleted entirely
- `apps/api/src/app.module.ts` — TripCostModule import removed
- `apps/api/src/modules/trip-plan/trip-plan.controller.ts` — addCost route removed; update route added
- `apps/api/src/modules/trip-plan/trip-plan.service.ts` — addCost method removed; update method added
- `apps/api/src/modules/trip-plan/dto/` — AddTripPlanCostDto removed; UpdateTripPlanDto added
- `apps/api/src/modules/import/import.service.ts` — tripCost find/create logic removed
- `packages/shared/src/index.ts` — AddTripPlanCostDto updated (drop tripCostId); UpdateTripPlanDto added
- `packages/db/prisma/schema.prisma` — TripCost model removed; TripPlanCost.tripCostId removed
- `apps/web/src/app/(authenticated)/trip-costs/page.tsx` — deleted
- `apps/web/src/app/(authenticated)/trip-plans/page.tsx` — major refactor
- `apps/web/src/components/nav-sidebar.tsx` — "Danh mục chi phí" link removed
