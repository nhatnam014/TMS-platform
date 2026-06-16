## REMOVED Requirements

### Requirement: Vehicle CRUD

**Reason**: The Vehicle table and all associated business logic are being removed from the system. Vehicle data is now stored as plain string fields (`vehiclePlate`) on TripPlan, and compliance data is managed through VehicleRecord. There is no longer a managed Vehicle entity.

**Migration**:
- Delete `apps/api/src/modules/vehicle/` directory (controller, service, module, DTOs)
- Remove `VehicleModule` from `app.module.ts`
- Delete `apps/web/src/app/(authenticated)/vehicles/page.tsx`
- Remove the "Phương tiện" nav link from `nav-sidebar.tsx`
- Remove `CreateVehicleDto`, `UpdateVehicleDto`, `VehicleType`, `VehicleStatus` from `@tms/shared`
- Remove `ENTITY_TYPES.VEHICLE` from `@tms/shared`
- Drop `vehicle_trailers`, `trailers`, `vehicles` tables via Prisma migration
- Run data migration before dropping: copy `vehicles.license_plate` into `trip_plans.vehicle_plate` for all existing TripPlan rows
