## 1. Database Schema

- [x] 1.1 Add `containerSize String?`, `description String?`, `tripCostName String?`, `tripCostAmount Decimal?` fields to `TripPlan` model in `schema.prisma`
- [x] 1.2 Remove old `TripCost` model and `CostType` enum from `schema.prisma`
- [x] 1.3 Add new `TripCost` catalog model (`id`, `name` unique, `isActive`, timestamps) to `schema.prisma`
- [x] 1.4 Add `TripPlanCost` junction model (`id`, `tripPlanId` FK, `tripCostId` FK with `onDelete: Cascade`, `amount Decimal`, `invoiceNumber String?`, `createdAt`) with indexes
- [x] 1.5 Update `TripPlan` model relations: replace `costs TripCost[]` with `costs TripPlanCost[]`
- [x] 1.6 Run `npx prisma migrate dev --name trip-plan-cost-overhaul` to generate and apply migration

## 2. Shared Types (@tms/shared)

- [x] 2.1 Remove `CostType` type and `COST_TYPE_LABELS` export from `packages/shared/src/index.ts`
- [x] 2.2 Add `TripCostDto` interface: `{ id: string; name: string; isActive: boolean }`
- [x] 2.3 Add `CreateTripCostDto` interface: `{ name: string }`
- [x] 2.4 Add `UpdateTripCostDto` interface: `{ name?: string; isActive?: boolean }`
- [x] 2.5 Add `AddTripPlanCostDto` interface: `{ tripCostId: string; amount: number; invoiceNumber?: string }`
- [x] 2.6 Update `CreateTripPlanDto` interface: add `containerSize?: string`, `description?: string` fields
- [x] 2.7 Update `TripPlanRow` response interface in shared: add `containerSize`, `description`, `tripCostName`, `tripCostAmount`, `costs: TripPlanCostItem[]`
- [x] 2.8 Add `TripPlanCostItem` interface: `{ id: string; tripCostId: string; costName: string; amount: number; invoiceNumber?: string | null }`

## 3. TripCost API Module

- [x] 3.1 Create `apps/api/src/modules/trip-cost/` directory with `trip-cost.module.ts`, `trip-cost.controller.ts`, `trip-cost.service.ts`
- [x] 3.2 Implement `TripCostService`: `findAll()`, `create(dto)` with unique name check (409 on duplicate), `update(id, dto)`, `hardDelete(id)` — 404 on not found
- [x] 3.3 Implement `TripCostController`: `GET /trip-costs`, `POST /trip-costs` (ADMIN only), `PATCH /trip-costs/:id` (ADMIN only), `DELETE /trip-costs/:id` (ADMIN only)
- [x] 3.4 Register `TripCostModule` in `apps/api/src/app.module.ts`

## 4. TripPlan API Updates

- [x] 4.1 Update `CreateTripPlanDto` in `apps/api/src/modules/trip-plan/dto/create-trip-plan.dto.ts`: add `containerSize`, `description` optional fields
- [x] 4.2 Update `TripPlanService.create()` to persist `containerSize` and `description`
- [x] 4.3 Update `TripPlanService.findAll()` Prisma query: include `costs` relation with nested `tripCost { name }`, and include `containerSize`, `description`, `tripCostName`, `tripCostAmount` in select/return
- [x] 4.4 Replace `AddTripCostDto` in trip-plan DTO: change body shape to `{ tripCostId, amount, invoiceNumber? }` (remove old costType/description fields)
- [x] 4.5 Update `TripPlanService.addCost()`: look up `TripCost` by `tripCostId` (404 if not found), create `TripPlanCost` row, update `TripPlan.tripCostName` and `TripPlan.tripCostAmount` in a single Prisma transaction
- [x] 4.6 Remove any remaining references to `CostType` enum in trip-plan service and controller

## 5. Import Parser Rewrite

- [x] 5.1 Rewrite `ParsedTripPlanRow` interface in `kehoach-xe.parser.ts`: add `containerSize`, `description`, remove old cost fields, add `costs: { costName: string; amount: number; invoiceNumber?: string }[]`
- [x] 5.2 Rewrite `parseKeHoachXe()` column map to use actual template headers (col 5 = LOẠI HÌNH, col 7 = SIZE CONT, col 8 = CONT ĐI, col 13 = Điểm Lấy, etc.)
- [x] 5.3 Add `parseServiceType()` helper: maps "SEA - EX" → SEA_EXPORT, "SEA - IM" → SEA_IMPORT, "NEO - EX" → NEO_EXPORT, "NEO - IM" → NEO_IMPORT; defaults to SEA_EXPORT with warning
- [x] 5.4 Parse individual cost columns (cols 16–29): for each non-zero amount, push `{ costName, amount, invoiceNumber }` into the row's `costs` array
- [x] 5.5 Update `ImportService.importTripPlans()`: after creating TripPlan, for each cost in `parsedRow.costs`, find-or-create TripCost catalog item by name, create TripPlanCost row; wrap per-row in a transaction

## 6. Export Builder Rewrite

- [x] 6.1 Rewrite `buildKeHoachXe()` in `kehoach-xe.builder.ts` to use the 31-column header layout matching the template
- [x] 6.2 Populate SIZE CONT column from `tp.containerSize`
- [x] 6.3 Populate 20'/40'/45' tick columns derived from `containerSize` prefix
- [x] 6.4 Populate cost columns (PHÍ NÂNG through CHI PHÍ PHÁT SINH) by looking up each TripPlan's `costs` array by cost name
- [x] 6.5 Populate SHĐ columns from `invoiceNumber` of the matching TripPlanCost row
- [x] 6.6 Populate NỘI DUNG column from `tp.description`

## 7. Web UI — Trip Cost Catalog Page

- [x] 7.1 Create `apps/web/src/app/(authenticated)/trip-costs/page.tsx` with a list table (columns: Name, Active, Actions)
- [x] 7.2 Implement create form/modal: name text input, calls `POST /api/trip-costs`
- [x] 7.3 Implement inline edit: rename and toggle isActive via `PATCH /api/trip-costs/:id`
- [x] 7.4 Implement delete with confirmation warning (mentions cascade), calls `DELETE /api/trip-costs/:id`
- [x] 7.5 Add "Chi phí" link to `apps/web/src/components/nav-sidebar.tsx`

## 8. Web UI — Trip Plan Page Updates

- [x] 8.1 Update `TripPlanRow` interface in `trip-plans/page.tsx` to include `containerSize`, `description`, `tripCostName`, `tripCostAmount`, `costs` array, and all location fields
- [x] 8.2 Rewrite the table to show all 31 Excel columns; wrap table container in `overflow-x: auto`
- [x] 8.3 Add derived 20'/40'/45' tick columns computed from `containerSize`
- [x] 8.4 Add cost columns: for each of the 9 cost types, look up the matching cost from `costs` array by name and display amount; show SHĐ in adjacent column
- [x] 8.5 Update `CreateTripModal`: add `containerSize` text input, `description` text input, `outboundContainerNumber` text input, `inboundContainerNumber` text input to the form
- [x] 8.6 Rewrite `CostModal`: replace `costType` select (was CostType enum) with a select populated from `GET /api/trip-costs`; change body sent to `{ tripCostId, amount, invoiceNumber }`; remove description field
- [x] 8.7 Make the "+ Chi phí" button available on all non-CANCELLED trips (not just COMPLETED)
- [x] 8.8 Run `npm run type-check` and resolve any TypeScript errors from CostType removal

## 9. Cleanup & Verification

- [x] 9.1 Grep codebase for remaining references to `CostType` or `COST_TYPE_LABELS` and remove them
- [x] 9.2 Run `npm run lint` and fix any lint errors
- [x] 9.3 Run `npm run type-check` across the monorepo and confirm zero errors
- [ ] 9.4 Start dev server and manually verify: create trip plan with containerSize, add cost via select dropdown, verify tripCostName/tripCostAmount written to trip plan row, verify table shows all columns with scroll
- [ ] 9.5 Verify import: upload the "TMS template - VIET CODE.xlsx" and confirm rows are created with correct serviceType, containerSize, and TripPlanCost rows for non-empty cost columns
- [ ] 9.6 Verify export: download export and confirm 31 columns match the template layout
