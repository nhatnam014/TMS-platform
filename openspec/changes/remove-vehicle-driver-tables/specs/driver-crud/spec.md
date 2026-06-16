## REMOVED Requirements

### Requirement: Driver CRUD

**Reason**: The Driver table and all associated business logic are being removed from the system. Driver data (name, phone) is now stored directly as plain text fields on VehicleRecord and is no longer a managed entity.

**Migration**:
- Delete `apps/api/src/modules/driver/` directory (controller, service, module, DTOs)
- Remove `DriverModule` from `app.module.ts`
- Delete `apps/web/src/app/(authenticated)/drivers/page.tsx`
- Remove the "Tài xế" nav link from `nav-sidebar.tsx`
- Remove `CreateDriverDto`, `UpdateDriverDto`, `DriverStatus` from `@tms/shared`
- Remove `ENTITY_TYPES.DRIVER` from `@tms/shared`
- Drop `drivers` table via Prisma migration (after removing the `vehicleId` FK from TripPlan and the `vehicleId` FK on Driver → Vehicle)
