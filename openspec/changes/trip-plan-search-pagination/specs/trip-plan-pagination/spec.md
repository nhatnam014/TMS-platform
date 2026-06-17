## MODIFIED Requirements

### Requirement: Trip plans list uses 10 records per page

The frontend SHALL request `limit=10` per page (changed from 20). The displayed item range ("Hiển thị X–Y / Z") SHALL be calculated using a page size of 10.

#### Scenario: First page shows records 1–10

- **WHEN** user loads the trip plans page with no filters
- **THEN** the first page shows at most 10 records, and the range label shows "1–10 / total"

#### Scenario: Second page shows records 11–20

- **WHEN** user navigates to page 2
- **THEN** records 11–20 are shown and the range label shows "11–20 / total"
