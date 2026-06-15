## 1. Database Migration

- [x] 1.1 Create `service_types` table in Prisma schema (id, code UNIQUE, description, isActive, timestamps)
- [x] 1.2 Create `container_sizes` table in Prisma schema (id, code UNIQUE, name, isActive, timestamps)
- [x] 1.3 Create `cost_templates` table in Prisma schema (id, name, defaultAmount Decimal nullable, isActive, timestamps)
- [x] 1.4 Add `serviceTypeId` FK column to `TripPlan` (nullable temporarily), drop `serviceType` enum column; add `containerSizeId` FK column (nullable), drop `containerSize` String column
- [x] 1.5 Replace three location FK columns on `TripPlan` with `pickupLocationName`, `loadUnloadLocationName`, `dropoffLocationName` String? columns
- [x] 1.6 Remove `chiPhiPhatSinhName` and `chiPhiPhatSinhAmount` columns from `TripPlan`
- [x] 1.7 Write Prisma migration SQL: seed 4 service types, data-migrate existing `serviceType` enum values to `serviceTypeId`, then make `serviceTypeId` NOT NULL
- [x] 1.8 Write Prisma migration SQL: seed 5 container sizes (20GP, 20HC, 40GP, 40HC, 45HC), data-migrate matching `containerSize` string values to `containerSizeId`
- [x] 1.9 Write Prisma migration SQL: data-migrate location names from joined Location table into new string columns; data-migrate `chiPhiPhatSinh` values into `TripPlanCost` rows
- [x] 1.10 Run `pnpm prisma migrate dev` and verify migration applies cleanly

## 2. Shared Package Updates

- [x] 2.1 Remove `ServiceType` union type and `SERVICE_TYPE_LABELS` constant from `@tms/shared`
- [x] 2.2 Add `ServiceTypeRow { id, code, description, isActive }`, `ContainerSizeRow { id, code, name, isActive }`, `CostTemplateRow { id, name, defaultAmount, isActive }` interfaces to `@tms/shared`
- [x] 2.3 Update `CreateTripPlanDto` and `UpdateTripPlanDto`: replace `serviceType` with `serviceTypeId`, replace `containerSize` with `containerSizeId`, replace location id fields with location name string fields, remove `chiPhiPhatSinh` fields, add `otherCosts` array field
- [x] 2.4 Update `TripPlanRow` response interface to reflect new fields
- [x] 2.5 Rebuild shared package (`pnpm build` in packages/shared)

## 3. API — Master Table Modules

- [x] 3.1 Create `service-types` NestJS module (module, controller, service, DTO) with GET/POST/PATCH/DELETE endpoints
- [x] 3.2 Add DELETE protection in `service-types` service: return 409 if any TripPlan references the service type
- [x] 3.3 Create `container-sizes` NestJS module (module, controller, service, DTO) with GET/POST/PATCH/DELETE endpoints
- [x] 3.4 Add DELETE protection in `container-sizes` service: return 409 if any TripPlan references the container size
- [x] 3.5 Create `cost-templates` NestJS module (module, controller, service, DTO) with GET/POST/PATCH/DELETE endpoints; GET supports optional `?q=` search param
- [x] 3.6 Register all three new modules in `app.module.ts`

## 4. API — Trip Plan Module Updates

- [x] 4.1 Update `TripPlanService.create()`: accept `serviceTypeId`, `containerSizeId`, location name strings, `otherCosts` array; create TripPlanCost rows for `otherCosts`
- [x] 4.2 Update `TripPlanService.update()`: same field changes as create
- [x] 4.3 Update `TripPlanService.findAll()`: join `service_types` and `container_sizes` for display; replace location FK joins with direct name string fields; update `serviceType` filter to use `serviceTypeCode` param matching `service_types.code`
- [x] 4.4 Update `TripPlanService.findOne()`: same join/field changes
- [x] 4.5 Update `TripPlanController`: update filter query params, remove deprecated `serviceType` enum param

## 5. API — Excel Import Updates

- [x] 5.1 Update `kehoach-xe.parser.ts`: replace `parseServiceType()` with `lookupOrCreateServiceType(code, tx)` that queries `service_types` by normalized code and creates if missing; emit warning on creation
- [x] 5.2 Update `kehoach-xe.parser.ts`: add `lookupOrCreateContainerSize(code, tx)` for SIZE CONT column; emit warning on creation
- [x] 5.3 Update `kehoach-xe.parser.ts`: store location columns as `pickupLocationName`, `loadUnloadLocationName`, `dropoffLocationName` strings (remove Location FK lookup/creation for location columns)
- [x] 5.4 Update import service to pass `serviceTypeId` and `containerSizeId` to `TripPlan.create()` instead of old enum/string fields

## 6. Frontend — Shared Combobox Component

- [x] 6.1 Create `apps/web/src/components/Combobox.tsx`: props `{ options: { value, label, amount? }[], value, onChange, onAmountAutofill?, placeholder }`. Shows dropdown on focus, filters on type, closes on blur/Escape, calls `onAmountAutofill` with `amount` when option selected
- [x] 6.2 Add lock/unlock amount behavior: parent controls `amountLocked` state based on whether a template was selected; locked amount input has `readOnly` and visual indicator

## 7. Frontend — Master Table Management Pages

- [x] 7.1 Create `apps/web/src/app/(authenticated)/service-types/page.tsx`: CRUD page for service types (table + create modal + edit modal + delete with error handling)
- [x] 7.2 Create `apps/web/src/app/(authenticated)/container-sizes/page.tsx`: CRUD page for container sizes
- [x] 7.3 Create `apps/web/src/app/(authenticated)/cost-templates/page.tsx`: CRUD page for cost templates (includes Default Amount field)
- [x] 7.4 Add nav sidebar links for `/service-types` (Loại dịch vụ), `/container-sizes` (Size cont), `/cost-templates` (Danh mục chi phí) in `nav-sidebar.tsx`

## 8. Frontend — Trip Plans Page Updates

- [x] 8.1 Update table: remove 20', 40', 45' columns; update LOẠI HÌNH column to show service type code/description; update SIZE CONT column to show containerSize code; update location columns to show name strings; update CHI PHÍ PHÁT SINH column to show sum or first `costs[]` item amount
- [x] 8.2 Update `CreateTripModal`: replace `serviceType` select with API-fetched `<select>` from `/api/service-types`; replace `containerSize` text input with `<select>` from `/api/container-sizes`
- [x] 8.3 Update `CreateTripModal`: replace location `<select>` elements with `Combobox` components fetching from `/api/locations`; submit `pickupLocationName` etc. string fields
- [x] 8.4 Update `CreateTripModal`: replace 8 cost slot label+input pairs with `Combobox`+amount-input pairs; wire `onAmountAutofill` to lock/unlock amount; fetch options from `/api/cost-templates`
- [x] 8.5 Update `CreateTripModal`: replace single `chiPhiPhatSinh` row with multi-row section (mooc pattern); each row has Combobox name + amount + SHĐ + × button; "+ Thêm chi phí" appends row; collect as `otherCosts[]` in submit
- [x] 8.6 Update `EditTripModal`: apply all the same changes as Create (8.2–8.5); pre-fill `otherCosts` rows from `trip.costs[]` array
- [x] 8.7 Update filter bar in trip plans page: replace `serviceType` enum select with options fetched from `/api/service-types`; use `serviceTypeCode` query param
- [x] 8.8 Remove `sizeTick()` helper function and its three call sites from `trip-plans/page.tsx`
