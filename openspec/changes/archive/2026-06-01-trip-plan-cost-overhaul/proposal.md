## Why

The current TripPlan entity is missing fields required by the customer's operational Excel template ("kế hoạch xe"): container size (SIZE CONT), free-text description (NỘI DUNG), and a denormalized cost name/amount. The existing `TripCost` model is a hardcoded enum-based per-trip cost record with no standalone CRUD, making cost types impossible to manage. The redesign introduces a manageable TripCost catalog, a proper M:N junction, and aligns the full-stack (schema → API → UI → import/export) with the 31-column Excel template.

## What Changes

- **BREAKING** Remove `CostType` enum from `schema.prisma` and `@tms/shared`; replace with free-text `TripCost` catalog entity
- **BREAKING** Rename/replace `TripCost` model (per-trip cost record) with `TripPlanCost` junction model
- Add `TripCost` master catalog model (id, name, isActive) with full CRUD API + UI page
- Add `TripPlanCost` junction (tripPlanId, tripCostId FK with cascade delete, amount, invoiceNumber/SHĐ)
- Add 4 new fields to `TripPlan`: `containerSize`, `description`, `tripCostName`, `tripCostAmount`
- When a TripCost catalog item is hard-deleted, all associated `TripPlanCost` rows are permanently cascade-deleted; the TripPlan row itself is unaffected
- When a cost is added to a TripPlan, the service writes `tripCostName` + `tripCostAmount` directly onto the TripPlan row (denormalized per customer requirement)
- TripPlan list view updated to show all 31 Excel columns with horizontal scroll
- TripPlan create form updated to include containerSize, description, container numbers, and all location fields
- Cost entry in the UI uses a select dropdown (choosing from TripCost catalog) + amount input + SHĐ text input
- Import parser (`kehoach-xe.parser.ts`) fixed to match actual template column names, parse `serviceType` from LOẠI HÌNH, parse SIZE CONT and NỘI DUNG, and parse individual cost columns (cols 16–29) into TripPlanCost rows
- Export builder (`kehoach-xe.builder.ts`) aligned to match the template's 31-column layout

## Capabilities

### New Capabilities

- `trip-cost-catalog`: CRUD management for TripCost master catalog items (name, isActive). Powers the select dropdown in trip plan cost entry.
- `trip-plan-cost-entry`: Adding costs to a trip plan via M:N junction (TripPlanCost). Cascade delete when TripCost is deleted. Denormalized write of costName + amount onto TripPlan.

### Modified Capabilities

- `trip-plan-crud`: TripPlan entity gains `containerSize`, `description`, `tripCostName`, `tripCostAmount`. Create form and list view updated to match all 31 Excel columns.
- `trip-plan-excel-import`: Parser rewritten to match actual "kế hoạch xe" column names, parse serviceType, SIZE CONT, NỘI DUNG, and individual cost columns.
- `trip-plan-excel-export`: Builder rewritten to output all 31 columns matching the template layout.

## Impact

- `packages/db/prisma/schema.prisma`: new migration, schema changes
- `packages/shared/src/index.ts`: remove CostType, add TripCost/TripPlanCost DTOs
- `apps/api/src/modules/trip-plan/`: service, controller, DTO updates
- `apps/api/src/modules/` — new `trip-cost/` module (controller, service, module)
- `apps/api/src/modules/import/parsers/kehoach-xe.parser.ts`
- `apps/api/src/modules/export/builders/kehoach-xe.builder.ts`
- `apps/api/src/app.module.ts`: register TripCostModule
- `apps/web/src/app/(authenticated)/trip-plans/page.tsx`
- `apps/web/src/app/(authenticated)/trip-costs/page.tsx` (new)
- `apps/web/src/components/nav-sidebar.tsx`: add Trip Costs link
