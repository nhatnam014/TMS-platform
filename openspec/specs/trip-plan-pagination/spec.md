## ADDED Requirements

### Requirement: Server-side pagination on trip plans list
The trip plans page SHALL display records in pages of 20, with controls to navigate between pages.

#### Scenario: Default page size
- **WHEN** the user first opens the trip plans page
- **THEN** the list SHALL show the first 20 records
- **THEN** the pagination controls SHALL show total record count and current page

#### Scenario: Pagination controls render
- **WHEN** the total result count exceeds 20
- **THEN** pagination controls SHALL appear below the table with: "← Trước" (Previous), page number buttons, "Sau →" (Next), and a label "Hiển thị X–Y / Z chuyến"

#### Scenario: Navigate to next page
- **WHEN** the user clicks "Sau →" or a page number button
- **THEN** the list SHALL reload showing the corresponding page of results
- **THEN** the active page button SHALL be visually highlighted

#### Scenario: Previous/Next disabled at boundaries
- **WHEN** the user is on page 1
- **THEN** "← Trước" SHALL be visually disabled and not clickable
- **WHEN** the user is on the last page
- **THEN** "Sau →" SHALL be visually disabled and not clickable

#### Scenario: Filter change resets to page 1
- **WHEN** the user changes any filter control while on page N > 1
- **THEN** the page SHALL reset to 1 before fetching

#### Scenario: Single page (no pagination controls)
- **WHEN** the total result count is 20 or fewer
- **THEN** no pagination controls SHALL be rendered
