## ADDED Requirements

### Requirement: Cost-template API returns paginated response

`GET /cost-templates` SHALL accept `page` and `limit` alongside the existing `q` query param and return `PaginatedResponse<T>`. Default: page=1, limit=10.

### Requirement: Cost-template frontend shows pagination UI

The cost-templates page SHALL show a pagination bar.

### Requirement: Cost-template amount input formats live as user types

The `defaultAmount` input in both create and edit modals SHALL format the value in Vietnamese number format (thousands separator `.`) as the user types, using the same `fmtInput`/`stripNonDigits` pattern already used in the trip-plans page. The stored value SHALL be the raw integer (no separators).

#### Scenario: User types 1000

- **WHEN** user types "1000" in the defaultAmount input
- **THEN** the input displays "1.000" and the saved value is 1000

#### Scenario: Table shows formatted amount

- **WHEN** a cost template row has `defaultAmount = 50000`
- **THEN** the table column displays "50.000đ"
