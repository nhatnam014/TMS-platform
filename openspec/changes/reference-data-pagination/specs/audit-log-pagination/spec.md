## MODIFIED Requirements

### Requirement: Audit-log page size defaults to 10

The audit-log API default `limit` SHALL be 10 (changed from 50). The frontend SHALL use `limit=10` (not hardcoded 50).

### Requirement: Audit-log frontend shows pagination UI

The audit-logs page SHALL show a pagination bar with record range label, prev/next buttons, and page number buttons (same pattern as other pages). Previously only a total count badge was shown.

#### Scenario: Pagination bar renders

- **WHEN** there are more than 10 audit-log records
- **THEN** the pagination bar appears below the table with correct range label and page buttons
