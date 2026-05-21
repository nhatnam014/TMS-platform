## ADDED Requirements

### Requirement: List customers endpoint
The API SHALL expose `GET /customers` returning all customers ordered by `name`. Each item includes `id`, `code`, and `name`. The endpoint requires JWT authentication.

#### Scenario: Returns all customers
- **WHEN** an authenticated request is made to `GET /customers`
- **THEN** the response is `200 OK` with an array of `{ id, code, name }` sorted by `name`

#### Scenario: Empty list when no customers exist
- **WHEN** no customers exist in the database
- **THEN** the response is `200 OK` with an empty array `[]`

---

### Requirement: List carriers endpoint
The API SHALL expose `GET /carriers` returning all carriers ordered by `name`. Each item includes `id`, `code`, and `name`. The endpoint requires JWT authentication.

#### Scenario: Returns all carriers
- **WHEN** an authenticated request is made to `GET /carriers`
- **THEN** the response is `200 OK` with an array of `{ id, code, name }` sorted by `name`

---

### Requirement: List locations endpoint
The API SHALL expose `GET /locations` returning all locations ordered by `name`. Each item includes `id`, `code`, `name`, and `locationType`. The endpoint requires JWT authentication.

#### Scenario: Returns all locations
- **WHEN** an authenticated request is made to `GET /locations`
- **THEN** the response is `200 OK` with an array of `{ id, code, name, locationType }` sorted by `name`
