## Context

The TMS trip plan module currently has:

- `ServiceType` as a Prisma enum (`SEA_EXPORT`, `SEA_IMPORT`, `NEO_EXPORT`, `NEO_IMPORT`) mirrored as a TypeScript union type in `@tms/shared`
- `TripPlan.containerSize` as a nullable free-text `String?`
- Three location fields stored as FK references to the `Location` table (`pickupLocationId`, `loadUnloadLocationId`, `dropoffLocationId`)
- Eight fixed cost slots as hardcoded label+amount+SHĐ columns on `TripPlan` (`phiNangName/Amount`, etc.) plus a single "chi phí phát sinh khác" slot
- `TripPlanCost` M:N table already in schema but unused by the form UI (only used by Excel import)
- Table displaying three redundant tick columns (20', 40', 45') derived from `containerSize`

The Excel import parser hardcodes service type mapping strings and stores container size as a raw string. Both must be changed to lookup/auto-create against master tables.

## Goals / Non-Goals

**Goals:**

- Replace `ServiceType` enum with a managed `service_types` table, preserving all existing data
- Replace `containerSize` string with a managed `container_sizes` table
- Store location data as denormalized name strings on `TripPlan` (no FK constraint)
- Introduce `cost_templates` as a suggestion-only catalog for cost slot comboboxes
- Provide CRUD management pages for all three new master tables
- Implement a reusable `Combobox` component with live search, selection, and autofill-lock behavior
- Change "chi phí phát sinh khác" from a single fixed slot to multiple `TripPlanCost` rows
- Update Excel import to lookup/auto-create `service_types` and `container_sizes` by code

**Non-Goals:**

- Changing the 8 fixed cost slot columns on `TripPlan` schema (they remain as denormalized name+amount columns)
- Adding FK integrity for cost template names (cost names are free strings in TripPlan; templates are suggestions only)
- Changing location master table structure (Location table is unchanged)
- Mobile-responsive trip plan form

## Decisions

### Decision 1: ServiceType enum → DB table (not a config overlay)

**Chosen**: Replace the Prisma `ServiceType` enum entirely with a `service_types` table. `TripPlan.serviceType` column becomes `serviceTypeId FK → service_types.id`.

**Why**: The user needs full CRUD (add new service types). An enum cannot be extended from UI. A config overlay table on top of the enum would add complexity without enabling true extensibility.

**Alternative considered**: Keep enum, add a `service_type_config` display table. Rejected because it prevents adding new types from UI and requires dual maintenance.

**Migration**: Seed 4 records on migration using existing enum values. Update existing `TripPlan` rows via a data migration that maps `serviceType` enum value → new `serviceTypeId`. Remove `ServiceType` enum from Prisma schema after migration.

---

### Decision 2: Location fields → denormalized name strings

**Chosen**: Replace `pickupLocationId/loadUnloadLocationId/dropoffLocationId` FK columns with `pickupLocationName/loadUnloadLocationName/dropoffLocationName String?` columns. The `Location` table remains unchanged as the combobox suggestion source.

**Why**: User explicitly requested no ID linking for locations in TripPlan. Avoids orphan-reference issues when location records are renamed or deleted. Combobox shows Location names for selection convenience but stores the chosen (or typed) name string.

**Alternative considered**: Keep FK + add a redundant name snapshot. Rejected as unnecessarily complex and inconsistent.

**Trade-off**: Loses referential integrity — location name changes in master do not propagate to existing trip plans (acceptable: trip plans are historical records). Trip plan list can no longer be filtered by `locationId` FK; filtering by location name string is the replacement.

---

### Decision 3: CostTemplate as suggestion-only (no FK in TripPlan)

**Chosen**: `cost_templates` table provides `name` and `defaultAmount` for combobox suggestions. When a template is selected, the name and amount are copied into the fixed cost slot fields on `TripPlan`. No FK relationship is stored.

**Why**: Consistent with the existing cost slot design (denormalized snapshots). Avoids cascade issues if a template is deleted. Cost records on historical trip plans remain immutable.

**Autofill-lock behavior**: When a user selects a template from the combobox, the amount field is populated from `defaultAmount` and set to read-only. If the user types a free-form name (no template selected), the amount field is editable.

---

### Decision 4: "Chi phí phát sinh khác" → TripPlanCost rows

**Chosen**: Remove the `chiPhiPhatSinhName/chiPhiPhatSinhAmount` fixed columns from `TripPlan`. Use the existing `TripPlanCost` table for multiple "other cost" rows. Each row: `costName` (combobox), `amount`, `invoiceNumber` (SHĐ).

**Why**: `TripPlanCost` already exists and is already used by Excel import. Reusing it avoids schema duplication and supports unlimited rows naturally.

**Impact on existing data**: Existing `chiPhiPhatSinh` values must be migrated to `TripPlanCost` rows during the Prisma migration.

---

### Decision 5: Combobox component — inline, no external library

**Chosen**: Build a simple inline React combobox component (`Combobox.tsx`) using native DOM (no headless UI or select2 library). Behavior: click or focus opens dropdown with all options; typing filters options in real time; selecting an option populates name and optionally locks amount; clicking outside closes dropdown.

**Why**: Existing codebase uses no component library (pure inline styles). Adding a dependency for a single component is disproportionate.

---

### Decision 6: Excel import auto-create for ServiceType and ContainerSize

**Chosen**: Import parser looks up `service_types` by `code` (normalized, e.g. "SEA-EX"). If not found, creates a new record. Same for `container_sizes` by `code`. Both operations run inside the existing import transaction.

**Why**: Maintains zero-friction import for new service/container codes. Consistent with existing behavior for Customer, Carrier, Location, Vehicle.

**Code mapping for service types**:
| Excel LOẠI HÌNH | `code` stored |
|---|---|
| "SEA - EX" / "SEA-EX" | "SEA-EX" |
| "SEA - IM" / "SEA-IM" | "SEA-IM" |
| "NEO - EX" / "NEO-EX" | "NEO-EX" |
| "NEO - IM" / "NEO-IM" | "NEO-IM" |

---

### Decision 7: Shared package — remove ServiceType union type

**Chosen**: Remove `ServiceType` union type and `SERVICE_TYPE_LABELS` constant from `@tms/shared`. Replace with a `ServiceTypeRow` interface `{ id, code, description }`. Frontend fetches service type list from API instead of using a hardcoded constant.

**Why**: The source of truth moves to the database. Hardcoded constants would diverge from DB state.

## Risks / Trade-offs

- **Large migration scope** → Mitigation: execute in a single Prisma migration with explicit data migrations for ServiceType FK and chiPhiPhatSinh rows. Test on a copy of production data before deploy.
- **Loss of location FK integrity** → Mitigation: Acceptable per business requirement. Trip plans are append-heavy historical records, not relational reporting targets.
- **Excel column indices shift** → The removal of 20'/40'/45' columns from the UI table does NOT change the Excel template column layout; parser column indices remain unchanged (those tick columns were derived, never in the template).
- **Existing chiPhiPhatSinh data** → Migrated to TripPlanCost rows. If `chiPhiPhatSinhName` is NULL, the TripPlanCost row still uses amount with a default costName "CHI PHÍ PHÁT SINH KHÁC".
- **ServiceType filter in API** → `GET /api/trip-plans?serviceType=SEA_EXPORT` must change to use `serviceTypeId` or `serviceType.code`. Frontend filter bar must be updated accordingly.

## Migration Plan

1. **Prisma migration file** — single migration:
   a. Create `service_types` table, seed 4 rows
   b. Add `service_type_id` column to `trip_plans` (nullable temporarily)
   c. Data-migrate: `UPDATE trip_plans SET service_type_id = (SELECT id FROM service_types WHERE code = mapped_code(service_type))`
   d. Make `service_type_id` NOT NULL, drop old `service_type` enum column
   e. Create `container_sizes` table, seed common sizes
   f. Add `container_size_id` column to `trip_plans` (nullable)
   g. Data-migrate: `UPDATE trip_plans SET container_size_id = (SELECT id FROM container_sizes WHERE code = container_size)` where container_size matches a seeded code
   h. Drop `container_size` string column (non-matching values are lost — acceptable as data was free-text)
   i. Add `pickup_location_name`, `load_unload_location_name`, `dropoff_location_name` String? columns
   j. Data-migrate: copy joined location names from Location table into new string columns
   k. Drop `pickup_location_id`, `load_unload_location_id`, `dropoff_location_id` FK columns
   l. Migrate `chi_phi_phat_sinh_name`/`chi_phi_phat_sinh_amount` → insert into `trip_plan_costs`
   m. Drop `chi_phi_phat_sinh_name` and `chi_phi_phat_sinh_amount` columns
   n. Create `cost_templates` table

2. **Deploy order**: API first (with backwards-compatible defaults), then frontend.

3. **Rollback**: Standard Prisma rollback migration. Data loss risk only for non-matched `containerSize` free-text values (acceptable).

## Open Questions

- None — all design decisions were resolved during exploration with stakeholder.
