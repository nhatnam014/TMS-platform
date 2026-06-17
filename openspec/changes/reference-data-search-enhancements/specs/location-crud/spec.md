## MODIFIED Requirements

### Requirement: Location search covers address

The location `findAll` service method SHALL include `address` in the case-insensitive `OR` search clause alongside the existing `name` and `code` fields.

#### Scenario: Search by address

- **WHEN** client sends `GET /api/locations?search=Hanoi`
- **THEN** locations whose `address` contains "Hanoi" (case-insensitive) are returned
