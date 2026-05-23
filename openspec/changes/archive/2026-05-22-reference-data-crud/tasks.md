## 1. Shared Types

- [x] 1.1 Add `CreateCustomerDto`, `UpdateCustomerDto` interfaces to `packages/shared/src/index.ts`
- [x] 1.2 Add `CreateCarrierDto`, `UpdateCarrierDto` interfaces to `packages/shared/src/index.ts`
- [x] 1.3 Add `CreateLocationDto`, `UpdateLocationDto` interfaces to `packages/shared/src/index.ts`
- [x] 1.4 Add `CUSTOMER`, `CARRIER`, `LOCATION` keys to `ENTITY_TYPES` constant in `packages/shared/src/index.ts`

## 2. Backend — Customer

- [x] 2.1 Create `apps/api/src/modules/customer/dto/create-customer.dto.ts` with `class-validator` decorators (`code` required, `name` required, optional fields)
- [x] 2.2 Create `apps/api/src/modules/customer/dto/update-customer.dto.ts` with all fields optional (including `isActive`)
- [x] 2.3 In `customer.service.ts`, update `findAll()` to add `where: { isActive: true }`
- [x] 2.4 In `customer.service.ts`, add `create(dto)`: wrap in `$transaction`, create record, call `auditService.log` with `CREATE` action, handle Prisma `P2002` as `409 ConflictException`
- [x] 2.5 In `customer.service.ts`, add `update(id, dto)`: find record (throw `404` if not found), wrap in `$transaction`, update record, call `auditService.log` with `UPDATE` action, handle `P2002` as `409`
- [x] 2.6 In `customer.controller.ts`, add `@Post()` mapped to `create(dto)` with `@ApiOperation` and `@Body() dto: CreateCustomerDto`
- [x] 2.7 In `customer.controller.ts`, add `@Patch(':id')` mapped to `update(id, dto)` with `@ApiOperation` and `@Body() dto: UpdateCustomerDto`

## 3. Backend — Carrier

- [x] 3.1 Create `apps/api/src/modules/carrier/dto/create-carrier.dto.ts` (`code` required, `name` required, `phone` optional)
- [x] 3.2 Create `apps/api/src/modules/carrier/dto/update-carrier.dto.ts` with all fields optional (including `isActive`)
- [x] 3.3 In `carrier.service.ts`, update `findAll()` to add `where: { isActive: true }`
- [x] 3.4 In `carrier.service.ts`, add `create(dto)` with audit log and `P2002` handling
- [x] 3.5 In `carrier.service.ts`, add `update(id, dto)` with `404` guard, audit log, and `P2002` handling
- [x] 3.6 In `carrier.controller.ts`, add `@Post()` for `create`
- [x] 3.7 In `carrier.controller.ts`, add `@Patch(':id')` for `update`

## 4. Backend — Location

- [x] 4.1 Create `apps/api/src/modules/location/dto/create-location.dto.ts` (`code` required, `name` required, `locationType` required enum, optional fields)
- [x] 4.2 Create `apps/api/src/modules/location/dto/update-location.dto.ts` with all fields optional (including `isActive`)
- [x] 4.3 In `location.service.ts`, update `findAll()` to add `where: { isActive: true }`
- [x] 4.4 In `location.service.ts`, add `create(dto)` with audit log and `P2002` handling
- [x] 4.5 In `location.service.ts`, add `update(id, dto)` with `404` guard, audit log, and `P2002` handling
- [x] 4.6 In `location.controller.ts`, add `@Post()` for `create`
- [x] 4.7 In `location.controller.ts`, add `@Patch(':id')` for `update`

## 5. Frontend — Customers Page

- [x] 5.1 Create `apps/web/src/app/(authenticated)/customers/page.tsx` as `"use client"` component that fetches `GET /api/customers` and renders a table (columns: code, name, phone, email, actions)
- [x] 5.2 Add create modal with fields: code (required), name (required), address, phone, email, taxCode — calls `POST /api/customers` on submit
- [x] 5.3 Add edit modal pre-filled from row data — calls `PATCH /api/customers/:id` on submit
- [x] 5.4 Add "Vô hiệu hóa" button per row that calls `PATCH /api/customers/:id` with `{ isActive: false }` after inline confirmation
- [x] 5.5 Show API errors inline in modals; refresh list after successful mutation

## 6. Frontend — Carriers Page

- [x] 6.1 Create `apps/web/src/app/(authenticated)/carriers/page.tsx` as `"use client"` component that fetches `GET /api/carriers` and renders a table (columns: code, name, phone, actions)
- [x] 6.2 Add create modal with fields: code (required), name (required), phone — calls `POST /api/carriers` on submit
- [x] 6.3 Add edit modal pre-filled from row data — calls `PATCH /api/carriers/:id` on submit
- [x] 6.4 Add "Vô hiệu hóa" button per row that calls `PATCH /api/carriers/:id` with `{ isActive: false }` after inline confirmation

## 7. Frontend — Locations Page

- [x] 7.1 Create `apps/web/src/app/(authenticated)/locations/page.tsx` as `"use client"` component that fetches `GET /api/locations` and renders a table (columns: code, name, type, address, actions)
- [x] 7.2 Add `locationType` filter dropdown above the table (client-side filter on loaded data)
- [x] 7.3 Add create modal with fields: code (required), name (required), locationType select (required), address, latitude, longitude — calls `POST /api/locations` on submit
- [x] 7.4 Add edit modal pre-filled from row data — calls `PATCH /api/locations/:id` on submit
- [x] 7.5 Add "Vô hiệu hóa" button per row that calls `PATCH /api/locations/:id` with `{ isActive: false }` after inline confirmation

## 8. Frontend — Navigation

- [x] 8.1 Add `{ href: "/customers", label: "Khách hàng" }`, `{ href: "/carriers", label: "Hãng xe" }`, `{ href: "/locations", label: "Địa điểm" }` to `BASE_NAV_ITEMS` in `apps/web/src/components/nav-sidebar.tsx`

## 9. Verification

- [x] 9.1 Run `npx tsc --noEmit -p apps/web/tsconfig.json` and fix any type errors
- [x] 9.2 Run `npx tsc --noEmit -p apps/api/tsconfig.json` and fix any type errors
- [ ] 9.3 Manually verify: create a customer, edit it, deactivate it — confirm it disappears from trip-plan create modal dropdown
