## ADDED Requirements

### Requirement: Service-types list supports text search

The system SHALL accept a `search` query parameter on `GET /api/service-types`. When provided, results SHALL be filtered to rows where `code` or `description` contains the search string (case-insensitive).

#### Scenario: Search by code

- **WHEN** client sends `GET /api/service-types?search=SEA`
- **THEN** only service types whose `code` contains "SEA" are returned

#### Scenario: Search by description

- **WHEN** client sends `GET /api/service-types?search=export`
- **THEN** service types whose `description` contains "export" (case-insensitive) are returned

### Requirement: Service-types list supports isActive filter

The system SHALL accept an `isActive` query parameter on `GET /api/service-types`. When provided as `"true"` or `"false"`, results SHALL be filtered accordingly.

#### Scenario: Filter active only

- **WHEN** client sends `GET /api/service-types?isActive=true`
- **THEN** only service types with `isActive = true` are returned

#### Scenario: No filter returns all

- **WHEN** `isActive` is omitted
- **THEN** all service types (active and inactive) are returned

### Requirement: Container-sizes list supports text search

The system SHALL accept a `search` query parameter on `GET /api/container-sizes`. When provided, results SHALL be filtered to rows where `code` or `name` contains the search string (case-insensitive).

#### Scenario: Search by code

- **WHEN** client sends `GET /api/container-sizes?search=40`
- **THEN** only container sizes whose `code` contains "40" are returned

#### Scenario: Search by name

- **WHEN** client sends `GET /api/container-sizes?search=General`
- **THEN** container sizes whose `name` contains "General" are returned

### Requirement: Container-sizes list supports isActive filter

The system SHALL accept an `isActive` query parameter on `GET /api/container-sizes`. Same semantics as service-types.

#### Scenario: Filter inactive only

- **WHEN** client sends `GET /api/container-sizes?isActive=false`
- **THEN** only container sizes with `isActive = false` are returned

### Requirement: Service-types and container-sizes pages show search + status filter

Both pages SHALL display a text search input and a status filter dropdown ("Tất cả" / "Đang hoạt động" / "Ngừng hoạt động"). Changing either filter SHALL reset pagination to page 1.

#### Scenario: User filters by status on service-types page

- **WHEN** user selects "Đang hoạt động"
- **THEN** the page fetches `GET /api/service-types?isActive=true&page=1&limit=10`
