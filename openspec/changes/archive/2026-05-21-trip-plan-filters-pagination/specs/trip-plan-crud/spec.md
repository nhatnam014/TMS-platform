## MODIFIED Requirements

### Requirement: List trip plans with filters and pagination
The `GET /trip-plans` endpoint SHALL accept an optional `search` query parameter in addition to all existing filter parameters.

#### Scenario: List with search parameter
- **WHEN** a client sends `GET /trip-plans?search=<term>`
- **THEN** the server SHALL apply an OR clause matching `search` against trip number (if integer), vehicle license plate, customer name, outbound container number, inbound container number, and notes
- **THEN** the response SHALL still return a `PaginatedResponse<TripPlanRow>` with `{ data, meta }` shape

#### Scenario: Backwards compatibility — no search param
- **WHEN** a client sends `GET /trip-plans` without a `search` param
- **THEN** the server SHALL behave identically to before this change (no regression)

#### Scenario: Search combined with all existing filters
- **WHEN** a client sends `GET /trip-plans?search=foo&status=PLANNED&customerId=<id>&page=2`
- **THEN** all filter conditions SHALL be applied together (AND logic)
- **THEN** the response `meta` SHALL reflect the filtered total count
