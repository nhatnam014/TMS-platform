## REMOVED Requirements

### Requirement: ContainerStatus enum defines the container lifecycle

**Reason**: Container entity removed. Container status is no longer a tracked concept.
**Migration**: Remove `ContainerStatus` export from `packages/shared/src/index.ts` and remove the `ContainerStatus` enum from `packages/db/prisma/schema.prisma`.

### Requirement: Container model has a status field

**Reason**: Container model is deleted entirely.
**Migration**: Drop `containers` table via Prisma migration.

### Requirement: Container model has a factoryZone field

**Reason**: Container model is deleted entirely.
**Migration**: Drop `containers` table via Prisma migration.

### Requirement: Container model has a currentLocationId field

**Reason**: Container model is deleted entirely. `Location.containersHere` reverse relation is also removed.
**Migration**: Drop `containers` table via Prisma migration. Remove `containersHere` from `Location` model in schema.

### Requirement: GET /containers supports filtering by status and locationId

**Reason**: Container entity removed. The `GET /api/v1/containers` endpoint no longer exists.
**Migration**: Delete `apps/api/src/modules/container/` directory. Remove `ContainerModule` from `app.module.ts`.
