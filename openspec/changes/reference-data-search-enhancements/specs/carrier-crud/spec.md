## MODIFIED Requirements

### Requirement: Carrier search covers phone

The carrier `findAll` service method SHALL include `phone` in the case-insensitive `OR` search clause alongside the existing `name` and `code` fields.

#### Scenario: Search by phone number

- **WHEN** client sends `GET /api/carriers?search=0912`
- **THEN** carriers whose `phone` contains "0912" are returned
