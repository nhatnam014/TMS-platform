## ADDED Requirements

### Requirement: YardMove soft delete via isActive field

The `YardMove` DB model SHALL have an `isActive Boolean @default(true)` column. `GET /yard-moves` SHALL only return records where `isActive = true`. `PATCH /yard-moves/:id` with `{ "isActive": false }` SHALL soft-delete the record.

#### Scenario: Newly created yard move is active by default

- **WHEN** a yard move is created via `POST /yard-moves`
- **THEN** the record is saved with `isActive = true`

#### Scenario: Soft-deleted yard move excluded from list

- **WHEN** `PATCH /yard-moves/:id` is called with `{ "isActive": false }`
- **THEN** the yard move's `isActive` is set to `false`
- **THEN** subsequent `GET /yard-moves` responses do NOT include this record

#### Scenario: Soft delete a PENDING yard move

- **WHEN** an authenticated user soft-deletes a yard move with status `PENDING`
- **THEN** the record's `isActive` becomes `false` and it disappears from the list

#### Scenario: Record not found

- **WHEN** `PATCH /yard-moves/:id` is called with a non-existent `id`
- **THEN** the response is `404 Not Found`
