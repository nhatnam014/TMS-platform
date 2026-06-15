## Why

The trip plan module has accumulated several UX and data-model problems: redundant 20'/40'/45' tick columns in the table, container size and service type stored as a hardcoded string and Prisma enum with no management UI, location fields FK-linked instead of stored as plain names, cost slot names hardcoded as form labels with no master-list support, and the "other costs" section limited to a single record. This refactor replaces all four problem areas with properly managed master tables and a modern combobox-driven form.

## What Changes

- **REMOVE** columns 20', 40', 45' from the trip plan list table (redundant with SIZE CONT column)
- **BREAKING** Replace `ServiceType` Prisma enum with a `service_types` master table (`id`, `code` UNIQUE e.g. "SEA-EX", `description`); `TripPlan.serviceType` enum column → `serviceTypeId` FK
- **BREAKING** Replace `TripPlan.containerSize String?` with `container_sizes` master table (`id`, `code` UNIQUE e.g. "40HC", `name`, `isActive`); `TripPlan` gets `containerSizeId` FK
- **BREAKING** Replace `TripPlan` location FK columns (`pickupLocationId`, `loadUnloadLocationId`, `dropoffLocationId`) with plain name strings (`pickupLocationName`, `loadUnloadLocationName`, `dropoffLocationName`); existing `Location` table remains as a suggestion source for combobox
- **ADD** `cost_templates` master table (`id`, `name`, `defaultAmount`, `isActive`) as the suggestion source for all cost slot name fields in the trip plan form
- **ADD** CRUD management pages for service types, container sizes, and cost templates
- **MODIFY** trip plan create/edit form: service type and container size become `<select>` from their master tables; all three location fields and all cost slot name fields become comboboxes with live-search; cost slot selection autofills and locks the amount
- **MODIFY** "chi phí phát sinh khác" section: replace single fixed slot with multiple-record rows (like mooc pattern) backed by `TripPlanCost` table; each row has combobox name + amount + SHĐ
- **MODIFY** Excel import: service type lookup/auto-create by `code`; container size lookup/auto-create by `code`
- **ADD** `GET /api/cost-templates`, `GET /api/service-types`, `GET /api/container-sizes` listing endpoints for form selects and combobox

## Capabilities

### New Capabilities

- `service-type-master`: Master table for service types replacing the Prisma enum; includes full CRUD API and management page
- `container-size-master`: Master table for container sizes replacing the free-text string; includes full CRUD API and management page
- `cost-template-catalog`: Master table of cost name templates with default amounts; includes full CRUD API, management page, and combobox integration in the trip plan form
- `trip-plan-location-denorm`: Location data stored as denormalized name strings on TripPlan instead of FK references; Location table becomes a suggestion-only source

### Modified Capabilities

- `trip-plan-crud`: Table removes 20'/40'/45' columns; form serviceType and containerSize use master table selects; location fields use combobox with live search
- `trip-plan-cost-form`: All 8 fixed cost slot name labels become combobox inputs backed by cost_templates; selecting a template autofills and locks the amount; "chi phí phát sinh khác" becomes multi-row TripPlanCost entry
- `trip-plan-excel-import`: Service type and container size now look up existing records by code and auto-create if not found; location names stored directly

## Impact

- **Database**: 3 new tables (`service_types`, `container_sizes`, `cost_templates`); 5 columns removed from `trip_plans` (3 location FKs, `serviceType` enum, `containerSize` string); 5 new columns added to `trip_plans` (3 location name strings, `serviceTypeId` FK, `containerSizeId` FK); `chiPhiPhatSinhName`/`chiPhiPhatSinhAmount` fixed slots removed (replaced by `TripPlanCost` rows)
- **API**: New modules for service-types, container-sizes, cost-templates; trip-plan DTO and service updated; import parser updated
- **Shared package**: `ServiceType` union type and `SERVICE_TYPE_LABELS` removed; new interfaces for master table rows
- **Frontend**: New pages at `/service-types`, `/container-sizes`, `/cost-templates`; new reusable `Combobox` component; trip-plans page updated throughout
- **Nav sidebar**: 3 new menu items added
- **Seed data**: 4 service types and common container sizes (20GP, 20HC, 40GP, 40HC, 45HC) seeded on migration
