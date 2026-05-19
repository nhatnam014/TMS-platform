## ADDED Requirements

### Requirement: ContainerStatus enum defines the container lifecycle
The system SHALL define a `ContainerStatus` enum with values: `EMPTY_AVAILABLE`, `EMPTY_IN_TRANSIT`, `EMPTY_AT_YARD`, `BEING_LOADED`, `LOADED_READY`, `LOADED_IN_TRANSIT`, `DELIVERED`. This enum MUST be exported from `@tms/shared` and used in both the Prisma schema and API DTOs.

#### Scenario: ContainerStatus enum is available in shared package
- **WHEN** a consuming package imports from `@tms/shared`
- **THEN** `ContainerStatus` is available as an exported enum with all seven values

---

### Requirement: Container model has a status field
The system SHALL add a `status` field of type `ContainerStatus` to the `Container` Prisma model with a default value of `EMPTY_AVAILABLE`. All existing container rows MUST receive `EMPTY_AVAILABLE` as their migrated default value.

#### Scenario: New container defaults to EMPTY_AVAILABLE
- **WHEN** a `Container` record is created without specifying a status
- **THEN** its `status` field is `EMPTY_AVAILABLE`

#### Scenario: Existing containers after migration have EMPTY_AVAILABLE
- **WHEN** the migration `add_drop_hook_yard_move` is applied to a database with existing container rows
- **THEN** all pre-existing containers have `status = EMPTY_AVAILABLE`

---

### Requirement: Container model has a factoryZone field
The system SHALL add a nullable `factoryZone` field of type `String` to the `Container` model. Valid zone values are `STAGING_DROP`, `LOADING_DOCK`, and `STAGING_READY`. These values MUST be defined as a `FactoryZone` constant object in `@tms/shared` and validated as an enum check in the DTO layer.

#### Scenario: factoryZone is nullable and optional
- **WHEN** a container record is created without providing `factoryZone`
- **THEN** the `factoryZone` field is `null`

#### Scenario: Invalid factoryZone is rejected at API layer
- **WHEN** a request sets `factoryZone` to a value not in `["STAGING_DROP", "LOADING_DOCK", "STAGING_READY"]`
- **THEN** the API returns `400 Bad Request` with a validation error

---

### Requirement: Container model has a currentLocationId field
The system SHALL add a nullable `currentLocationId` foreign key to the `Container` model referencing the `Location` table. This field represents the factory or depot where the container is physically located.

#### Scenario: currentLocationId is nullable
- **WHEN** a container record is created without providing `currentLocationId`
- **THEN** the field is `null`

#### Scenario: Invalid currentLocationId is rejected at database level
- **WHEN** a `currentLocationId` referencing a non-existent `Location` id is inserted
- **THEN** the database returns a foreign key constraint violation

---

### Requirement: GET /containers supports filtering by status and locationId
The system SHALL accept query parameters `status` (ContainerStatus) and `locationId` (string) on `GET /api/v1/containers`. When provided, only containers matching ALL supplied filters MUST be returned.

#### Scenario: Filter returns only LOADED_READY containers at a given factory
- **WHEN** `GET /api/v1/containers?status=LOADED_READY&locationId=<factory-id>` is called
- **THEN** the response contains only containers with `status = LOADED_READY` and `currentLocationId = <factory-id>`

#### Scenario: Filter with only status returns matching containers regardless of location
- **WHEN** `GET /api/v1/containers?status=EMPTY_AT_YARD` is called without `locationId`
- **THEN** the response contains all containers with `status = EMPTY_AT_YARD` across all locations

#### Scenario: No filters returns all containers
- **WHEN** `GET /api/v1/containers` is called without query parameters
- **THEN** all containers are returned regardless of status or location
