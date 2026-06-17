## MODIFIED Requirements

### Requirement: Audit-log viewer supports date-range filter UI

The audit-logs frontend page SHALL display two date inputs (dateFrom / dateTo). When either value changes, the page SHALL append `&dateFrom=<value>` and/or `&dateTo=<value>` to the fetch URL and reset pagination to page 1.

#### Scenario: User sets a date range

- **WHEN** user sets dateFrom to "2025-01-01" and dateTo to "2025-01-31"
- **THEN** the page fetches `GET /api/audit-logs?dateFrom=2025-01-01&dateTo=2025-01-31&page=1&limit=10`

#### Scenario: User clears a date

- **WHEN** user clears the dateFrom input
- **THEN** `dateFrom` is omitted from the query string
