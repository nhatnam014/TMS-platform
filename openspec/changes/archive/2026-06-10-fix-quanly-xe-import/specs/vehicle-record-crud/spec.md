## MODIFIED Requirements

### Requirement: List vehicle records

The system SHALL return all vehicle records ordered by creation date ascending, each including its full list of associated moocs. Ascending order ensures that records imported from an Excel file appear in the same top-to-bottom sequence as their source rows.

#### Scenario: List returns records with moocs

- **WHEN** a GET request is made to `/api/vehicle-records`
- **THEN** the response is a JSON array where each item contains vehicle-level fields and a `moocs` array (possibly empty)

#### Scenario: List returns empty array when no records exist

- **WHEN** a GET request is made to `/api/vehicle-records` and no records have been created
- **THEN** the response is an empty JSON array `[]`

#### Scenario: List order matches Excel import order

- **WHEN** N records are imported from an Excel file whose rows run from top to bottom in order 1..N
- **THEN** the list endpoint returns those records in the same order (index 0 = first Excel row, index N-1 = last Excel row)
