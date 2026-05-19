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

### Requirement: TripPlan supports outboundContainerId and inboundContainerId for DROP_AND_HOOK
The system SHALL add two nullable foreign key fields to `TripPlan`: `outboundContainerId` (the empty container dropped at the factory) and `inboundContainerId` (the loaded container hooked back). Both fields reference `Container.id`. For `tripMode = DROP_AND_HOOK`, `outboundContainerId` MUST be non-null at creation; `inboundContainerId` MAY be null at creation (deferred matching).

#### Scenario: DROP_AND_HOOK trip requires outboundContainerId
- **WHEN** `POST /api/v1/trip-plans` is called with `tripMode: "DROP_AND_HOOK"` and no `outboundContainerId`
- **THEN** the API returns `400 Bad Request` with a validation error

#### Scenario: DROP_AND_HOOK trip allows null inboundContainerId at creation
- **WHEN** `POST /api/v1/trip-plans` is called with `tripMode: "DROP_AND_HOOK"`, a valid `outboundContainerId`, and no `inboundContainerId`
- **THEN** the trip plan is created with `inboundContainerId = null`

#### Scenario: outboundContainerId and inboundContainerId must differ when both provided
- **WHEN** `POST /api/v1/trip-plans` is called with `tripMode: "DROP_AND_HOOK"` and `outboundContainerId === inboundContainerId`
- **THEN** the API returns `400 Bad Request` indicating that outbound and inbound containers must be different

---

### Requirement: Container status auto-transitions on DROP_AND_HOOK TripPlan status changes
The system SHALL update container status as a side effect within the same Prisma transaction when `TripPlanService.updateStatus()` is called on a `DROP_AND_HOOK` trip. The mapping is:

| Trip status → | Container effect |
|---|---|
| `DISPATCHED` | `outboundContainer.status` → `EMPTY_IN_TRANSIT` |
| `IN_TRANSIT` | `outboundContainer.status` → `EMPTY_AT_YARD` |
| `COMPLETED` | `inboundContainer.status` → `DELIVERED` |
| `CANCELLED` | `outboundContainer.status` → `EMPTY_AVAILABLE` |

For `STANDARD` trips, no container status transitions are triggered.

#### Scenario: DISPATCHED sets outbound container to EMPTY_IN_TRANSIT
- **WHEN** a DROP_AND_HOOK TripPlan transitions to `DISPATCHED`
- **THEN** the `outboundContainer.status` becomes `EMPTY_IN_TRANSIT` in the same transaction

#### Scenario: IN_TRANSIT sets outbound container to EMPTY_AT_YARD
- **WHEN** a DROP_AND_HOOK TripPlan transitions to `IN_TRANSIT`
- **THEN** the `outboundContainer.status` becomes `EMPTY_AT_YARD` in the same transaction

#### Scenario: COMPLETED sets inbound container to DELIVERED
- **WHEN** a DROP_AND_HOOK TripPlan with a non-null `inboundContainerId` transitions to `COMPLETED`
- **THEN** the `inboundContainer.status` becomes `DELIVERED` in the same transaction

#### Scenario: CANCELLED returns outbound container to EMPTY_AVAILABLE
- **WHEN** a DROP_AND_HOOK TripPlan transitions to `CANCELLED`
- **THEN** the `outboundContainer.status` becomes `EMPTY_AVAILABLE` in the same transaction

#### Scenario: STANDARD trip status change does not affect any container
- **WHEN** a TripPlan with `tripMode = STANDARD` transitions to any status
- **THEN** no container status fields are modified

---

### Requirement: GET /containers?status=LOADED_READY&locationId supports DROP_AND_HOOK dispatch
The system SHALL support a filtered container list query for dispatchers to find loaded containers available to hook. This is satisfied by the `container-status` spec's filter requirement. The TripPlanService MUST expose a `findLoadedReady(locationId: string)` method that queries `Container` where `status = LOADED_READY` AND `currentLocationId = locationId`.

#### Scenario: findLoadedReady returns only LOADED_READY containers at the factory
- **WHEN** `TripPlanService.findLoadedReady("<factory-id>")` is called
- **THEN** only containers with `status = LOADED_READY` and `currentLocationId = <factory-id>` are returned

#### Scenario: findLoadedReady returns empty list when no containers are ready
- **WHEN** no containers at the given factory have `status = LOADED_READY`
- **THEN** an empty array is returned
