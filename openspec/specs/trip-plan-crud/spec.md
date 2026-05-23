## ADDED Requirements

### Requirement: Trip plans page is a fully interactive client component
The trip plans page (`/trip-plans`) SHALL be a `"use client"` component that fetches data via the proxy API, renders an action column per row, and updates the list after each mutation without a full page reload.

#### Scenario: Page loads and displays trips
- **WHEN** an authenticated user navigates to `/trip-plans`
- **THEN** the page fetches `GET /api/trip-plans?limit=50` and renders the list with status badges and action buttons

#### Scenario: Page shows loading state
- **WHEN** the initial fetch is in flight
- **THEN** a loading indicator is displayed

#### Scenario: Page shows empty state
- **WHEN** no trips exist
- **THEN** the page displays an empty state message

---

### Requirement: Create trip plan via modal form
The trip plans page SHALL provide a "Tạo chuyến" button that opens a modal form. On submit, the form SHALL call `POST /api/trip-plans` and refresh the list on success.

The form SHALL include:
- Trip date (required)
- Service type — select from `ServiceType` values (required)
- Vehicle — dropdown populated from `GET /api/vehicles` (required)
- Customer — dropdown populated from `GET /api/customers` (required)
- Carrier — dropdown populated from `GET /api/carriers` (optional)
- Pickup location — dropdown from `GET /api/locations` (optional)
- Load/unload location — dropdown from `GET /api/locations` (optional)
- Drop-off location — dropdown from `GET /api/locations` (optional)
- Notes (optional)

#### Scenario: Successful trip creation
- **WHEN** the user fills required fields and submits
- **THEN** `POST /api/trip-plans` is called, the modal closes, and the list refreshes

#### Scenario: Validation prevents empty required fields
- **WHEN** the user submits without filling required fields
- **THEN** the form shows inline validation errors and does not submit

#### Scenario: API error on create
- **WHEN** the API returns an error
- **THEN** the modal displays the error message and stays open

---

### Requirement: Status transition buttons per row
Each trip row SHALL display a context-aware action button showing only the next valid status transition. The valid transitions are:

- `PLANNED` → button: "Điều xe" → `DISPATCHED`
- `DISPATCHED` → button: "Xuất phát" → `IN_TRANSIT`
- `IN_TRANSIT` → button: "Hoàn thành" → `COMPLETED`
- Any non-terminal status → secondary button: "Hủy" → `CANCELLED`
- `COMPLETED` or `CANCELLED` → no status transition buttons

On click, the button SHALL call `PATCH /api/trip-plans/:id/status` and refresh the list.

#### Scenario: PLANNED trip shows Dispatch button
- **WHEN** a trip has status `PLANNED`
- **THEN** the action column shows a "Điều xe" button and a "Hủy" button

#### Scenario: Status update succeeds
- **WHEN** the user clicks a status button
- **THEN** `PATCH /api/trip-plans/:id/status` is called and the row reflects the new status after list refresh

#### Scenario: Status update fails
- **WHEN** the API returns an error on status update
- **THEN** an error toast or inline message is shown; the list is not modified

---

### Requirement: Add cost to a completed trip
Each COMPLETED trip row SHALL show an "Add Cost" button ("+ Chi phí") that opens a cost modal. On submit, the modal SHALL call `POST /api/trip-plans/:id/costs`.

The cost form SHALL include:
- Cost type — select from `CostType` values (required)
- Amount — numeric (required, > 0)
- Invoice number (optional)
- Description (optional)

#### Scenario: Add cost to completed trip
- **WHEN** user clicks "+ Chi phí" on a COMPLETED trip and submits a valid cost
- **THEN** `POST /api/trip-plans/:id/costs` is called and the modal closes

#### Scenario: Cost form validates amount
- **WHEN** user submits with amount = 0 or empty
- **THEN** validation error is shown and form does not submit

---

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
