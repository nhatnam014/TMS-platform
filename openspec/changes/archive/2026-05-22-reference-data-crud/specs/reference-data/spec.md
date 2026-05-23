## MODIFIED Requirements

### Requirement: List customers endpoint
The API SHALL expose `GET /customers` returning all **active** customers (`isActive: true`) ordered by `name`. Each item includes `id`, `code`, and `name`. The endpoint requires JWT authentication.

#### Scenario: Returns only active customers
- **WHEN** an authenticated request is made to `GET /customers`
- **THEN** the response is `200 OK` with an array of `{ id, code, name }` where all returned customers have `isActive: true`, sorted by `name`

#### Scenario: Deactivated customer not returned
- **WHEN** a customer has `isActive: false`
- **THEN** that customer does NOT appear in the `GET /customers` response

#### Scenario: Empty list when no active customers exist
- **WHEN** no active customers exist
- **THEN** the response is `200 OK` with an empty array `[]`

---

### Requirement: List carriers endpoint
The API SHALL expose `GET /carriers` returning all **active** carriers (`isActive: true`) ordered by `name`. Each item includes `id`, `code`, and `name`. The endpoint requires JWT authentication.

#### Scenario: Returns only active carriers
- **WHEN** an authenticated request is made to `GET /carriers`
- **THEN** the response is `200 OK` with an array of `{ id, code, name }` where all returned carriers have `isActive: true`, sorted by `name`

#### Scenario: Deactivated carrier not returned
- **WHEN** a carrier has `isActive: false`
- **THEN** that carrier does NOT appear in the `GET /carriers` response

---

### Requirement: List locations endpoint
The API SHALL expose `GET /locations` returning all **active** locations (`isActive: true`) ordered by `name`. Each item includes `id`, `code`, `name`, and `locationType`. The endpoint requires JWT authentication.

#### Scenario: Returns only active locations
- **WHEN** an authenticated request is made to `GET /locations`
- **THEN** the response is `200 OK` with an array of `{ id, code, name, locationType }` where all returned locations have `isActive: true`, sorted by `name`

#### Scenario: Deactivated location not returned
- **WHEN** a location has `isActive: false`
- **THEN** that location does NOT appear in the `GET /locations` response
