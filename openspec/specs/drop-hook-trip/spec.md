## ADDED Requirements

### Requirement: TripMode enum distinguishes standard from Drop & Hook trips

The system SHALL define a `TripMode` enum with values `STANDARD` and `DROP_AND_HOOK`. This enum MUST be exported from `@tms/shared`, added to the Prisma schema, and used in TripPlan creation and query DTOs.

#### Scenario: TripMode enum is available in shared package

- **WHEN** a consuming package imports from `@tms/shared`
- **THEN** `TripMode` is available as an exported enum with values `STANDARD` and `DROP_AND_HOOK`

---

### Requirement: TripPlan model has a tripMode field defaulting to STANDARD

The system SHALL add a `tripMode` field of type `TripMode` to the `TripPlan` Prisma model with a default value of `STANDARD`. All existing trip plan rows MUST receive `STANDARD` as their migrated default. No data migration is required.

#### Scenario: New TripPlan without tripMode defaults to STANDARD

- **WHEN** a TripPlan is created without specifying `tripMode`
- **THEN** its `tripMode` field is `STANDARD`

#### Scenario: Existing TripPlans after migration have STANDARD

- **WHEN** the migration is applied to a database with existing trip plan rows
- **THEN** all pre-existing trip plans have `tripMode = STANDARD`

---

### Requirement: TripPlan supports outboundContainerNumber and inboundContainerNumber for DROP_AND_HOOK

The system SHALL store two nullable string fields on `TripPlan`: `outboundContainerNumber` (the empty container dropped at the factory) and `inboundContainerNumber` (the loaded container hooked back). Both fields are plain strings validated as `^[A-Z]{4}\d{7}$` when non-null. There are NO foreign keys to a Container table. For `tripMode = DROP_AND_HOOK`, `outboundContainerNumber` MUST be non-null at creation; `inboundContainerNumber` MAY be null at creation (deferred).

#### Scenario: DROP_AND_HOOK trip requires outboundContainerNumber

- **WHEN** `POST /api/v1/trip-plans` is called with `tripMode: "DROP_AND_HOOK"` and no `outboundContainerNumber`
- **THEN** the API returns `400 Bad Request` with a validation error

#### Scenario: DROP_AND_HOOK trip allows null inboundContainerNumber at creation

- **WHEN** `POST /api/v1/trip-plans` is called with `tripMode: "DROP_AND_HOOK"`, a valid `outboundContainerNumber`, and no `inboundContainerNumber`
- **THEN** the trip plan is created with `inboundContainerNumber = null`

#### Scenario: outboundContainerNumber and inboundContainerNumber must differ when both provided

- **WHEN** `POST /api/v1/trip-plans` is called with `tripMode: "DROP_AND_HOOK"` and `outboundContainerNumber === inboundContainerNumber`
- **THEN** the API returns `400 Bad Request` indicating that outbound and inbound containers must be different

## REMOVED Requirements

### Requirement: Container status auto-transitions on DROP_AND_HOOK TripPlan status changes

**Reason**: Container entity removed. No container status tracking exists.
**Migration**: Remove all `tx.container.update()` calls from `TripPlanService.updateStatus()` (4 status branches: DISPATCHED, IN_TRANSIT, COMPLETED, CANCELLED).

### Requirement: GET /containers?status=LOADED_READY&locationId supports DROP_AND_HOOK dispatch

**Reason**: Container entity removed. No concept of LOADED_READY containers exists.
**Migration**: Remove `getLoadedContainers()` method from `TripPlanService` and the corresponding `GET /trip-plans/containers` controller endpoint.
