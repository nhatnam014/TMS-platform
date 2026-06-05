## Why

The customer maintains a physical "Quản lý xe" Excel sheet that tracks vehicle–driver–trailer assignments as a flat, standalone record. The existing `vehicles` and `drivers` modules enforce relational integrity that does not match this workflow. A new independent module is needed to digitize this sheet exactly as-is, with no cross-table constraints.

## What Changes

- **New** standalone `VehicleRecord` module (API + UI) that mirrors the "quản lý xe" Excel sheet structure.
- **New** `VehicleRecordMooc` child entity — each vehicle record can have one or more moocs, each with its own set of compliance dates.
- **New** page `/vehicle-records` in the web app with full CRUD and a dynamic multi-mooc form.
- **New** sidebar navigation item "Quản lý xe" added to the authenticated layout.
- **No changes** to existing `vehicles`, `drivers`, `trailers`, or any related modules.
- All fields except `id`, `createdAt`, `updatedAt` are nullable — matching the Excel where blank cells are common.
- All CRUD operations produce audit log entries.

## Capabilities

### New Capabilities

- `vehicle-record-crud`: Standalone CRUD for vehicle records — create, read, update, delete a record that holds driver info (name, phone), vehicle info (type, plate, 3 compliance dates), notes, and an ordered list of moocs each with their own 3 compliance dates.

### Modified Capabilities

<!-- none -->

## Impact

- **DB**: Two new Prisma models (`VehicleRecord`, `VehicleRecordMooc`) with a new migration.
- **API**: New NestJS module `vehicle-record` with controller, service, DTOs.
- **Web**: New Next.js page at `app/(authenticated)/vehicle-records/page.tsx`.
- **Navigation**: `nav-sidebar.tsx` updated with new menu entry.
- **Audit**: Uses existing `AuditService` — no changes to audit module.
- **No breaking changes** to any existing endpoint or page.
