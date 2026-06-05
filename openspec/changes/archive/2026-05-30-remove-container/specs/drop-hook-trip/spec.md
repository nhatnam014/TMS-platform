## MODIFIED Requirements

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
