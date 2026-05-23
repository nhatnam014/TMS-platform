## Why

Customers, carriers, and locations are foreign-key prerequisites for creating trip plans. Currently they can only be populated via database seeding — there is no UI to add or edit them. Operators are blocked from onboarding new customers or updating carrier details without direct database access.

## What Changes

- Add `POST /customers`, `PATCH /customers/:id` endpoints to create and update customers
- Add `POST /carriers`, `PATCH /carriers/:id` endpoints to create and update carriers
- Add `POST /locations`, `PATCH /locations/:id` endpoints to create and update locations
- All mutations are soft-deletable via `isActive: false` (no hard DELETE)
- Add new shared DTO types for create/update of each entity
- Add `CUSTOMER`, `CARRIER`, `LOCATION` to `ENTITY_TYPES` for audit logging
- Add three new frontend pages: `/customers`, `/carriers`, `/locations`
- Update `/customers`, `/carriers`, `/locations` list endpoints to return only `isActive: true` records by default
- Add sidebar navigation links for the three new pages (visible to all authenticated roles)
- All mutations are available to OPERATOR and ADMIN roles (no role restriction beyond authentication)

## Capabilities

### New Capabilities

- `customer-crud`: Create and update customers; soft-deactivate; management page at `/customers`
- `carrier-crud`: Create and update carriers; soft-deactivate; management page at `/carriers`
- `location-crud`: Create and update locations with locationType; soft-deactivate; management page at `/locations`

### Modified Capabilities

- `reference-data`: List endpoints (`GET /customers`, `GET /carriers`, `GET /locations`) now filter to `isActive: true` records only, so deactivated entities no longer appear in trip-plan dropdowns

## Impact

- `apps/api/src/modules/customer/` — new DTO files, extended controller and service
- `apps/api/src/modules/carrier/` — new DTO files, extended controller and service
- `apps/api/src/modules/location/` — new DTO files, extended controller and service
- `packages/shared/src/index.ts` — new `CreateCustomerDto`, `UpdateCustomerDto`, `CreateCarrierDto`, `UpdateCarrierDto`, `CreateLocationDto`, `UpdateLocationDto`; extend `ENTITY_TYPES`
- `apps/web/src/app/(authenticated)/customers/page.tsx` — new file
- `apps/web/src/app/(authenticated)/carriers/page.tsx` — new file
- `apps/web/src/app/(authenticated)/locations/page.tsx` — new file
- `apps/web/src/components/nav-sidebar.tsx` — add three nav links
- Existing trip-plan create modal unaffected (dropdowns already use `{id, name}` shape from list endpoints)
