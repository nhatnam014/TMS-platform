## ADDED Requirements

### Requirement: Filter bar on trip plans page
The trip plans page SHALL display a filter bar above the table with controls for date range, status, customer, carrier, service type, and text search.

#### Scenario: Filter bar renders on page load
- **WHEN** an authenticated user navigates to `/trip-plans`
- **THEN** the page SHALL display a filter bar with: Date From input, Date To input, Status dropdown, Customer dropdown, Carrier dropdown, Service Type dropdown, Search text input, and a "Xóa bộ lọc" (Clear) button

#### Scenario: Customer and carrier dropdowns populated
- **WHEN** the page loads
- **THEN** the Customer dropdown SHALL be populated from `GET /api/customers`
- **THEN** the Carrier dropdown SHALL be populated from `GET /api/carriers`
- **THEN** both dropdowns SHALL include a blank "Tất cả" option as the default

#### Scenario: Applying a filter triggers reload
- **WHEN** the user changes any filter control value
- **THEN** the trip list SHALL reload with the new filter applied
- **THEN** the current page SHALL reset to 1

#### Scenario: Debounced search input
- **WHEN** the user types in the search input
- **THEN** the trip list SHALL NOT reload on every keystroke
- **THEN** the trip list SHALL reload 400ms after the user stops typing

#### Scenario: Clear filters button
- **WHEN** at least one filter is active (non-default value)
- **THEN** the "Xóa bộ lọc" button SHALL be visible
- **WHEN** the user clicks "Xóa bộ lọc"
- **THEN** all filter controls SHALL reset to their default (blank/all) values
- **THEN** the trip list SHALL reload with no filters applied

#### Scenario: Filters combine (AND logic)
- **WHEN** the user sets status = COMPLETED and customer = "SAILUN"
- **THEN** only trips matching BOTH conditions SHALL appear in the list
