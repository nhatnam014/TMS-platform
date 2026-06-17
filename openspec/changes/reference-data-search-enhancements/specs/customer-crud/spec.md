## MODIFIED Requirements

### Requirement: Customer search covers phone, email, and taxCode

The customer `findAll` service method SHALL include `phone`, `email`, and `taxCode` in the case-insensitive `OR` search clause alongside the existing `name` and `code` fields.

#### Scenario: Search by phone number

- **WHEN** client sends `GET /api/customers?search=0912`
- **THEN** customers whose `phone` contains "0912" are returned

#### Scenario: Search by email

- **WHEN** client sends `GET /api/customers?search=@gmail`
- **THEN** customers whose `email` contains "@gmail" are returned

#### Scenario: Search by tax code

- **WHEN** client sends `GET /api/customers?search=010234`
- **THEN** customers whose `taxCode` contains "010234" are returned
