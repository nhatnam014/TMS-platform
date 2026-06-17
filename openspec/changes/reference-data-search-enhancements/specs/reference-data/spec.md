## MODIFIED Requirements

### Requirement: Cost-template amount displays with Vietnamese number format

The cost-templates table SHALL display `defaultAmount` formatted with `toLocaleString("vi-VN")`. Because Prisma serializes `Decimal` columns as JSON strings, the value SHALL be converted to a JS `Number` before formatting.

#### Scenario: Amount displays formatted

- **WHEN** the API returns `defaultAmount: "1000.00"` (string from Prisma Decimal)
- **THEN** the table cell displays "1.000đ"

#### Scenario: Null amount displays dash

- **WHEN** `defaultAmount` is null
- **THEN** the table cell displays "—"
