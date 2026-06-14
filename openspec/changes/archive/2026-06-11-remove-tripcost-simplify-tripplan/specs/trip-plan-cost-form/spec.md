## MODIFIED Requirements

### Requirement: Trip plan create form includes a structured cost entry section

The `CreateTripModal` in the trip plans web page SHALL include a cost entry section below the existing route/location fields. The section SHALL render one row per cost slot (8 fixed + 1 free-form). Each fixed slot cell SHALL contain: the cost slot label (display only), a formatted amount text input, and optionally an SHĐ text input. There SHALL be NO dropdown or select input in any cost slot. The free-form slot (CHI PHÍ PHÁT SINH KHÁC) SHALL additionally have a name text input. All fields are optional. Unset slots are not submitted.

#### Scenario: No dropdowns in cost section

- **WHEN** the user opens the CreateTripModal
- **THEN** the cost section contains no `<select>` elements — only text inputs (amount, SHĐ, and free-form name for the last slot)

#### Scenario: Entering amount in a fixed slot submits hardcoded name

- **WHEN** the user enters 500000 in the PHÍ HẠ slot and submits
- **THEN** the POST body includes `phiHaName: "PHÍ HẠ"` and `phiHaAmount: 500000`

#### Scenario: Empty slot is not submitted

- **WHEN** the user leaves a cost slot amount empty
- **THEN** the corresponding name and amount fields are omitted from the POST body

#### Scenario: Cost data is submitted inline with the trip plan create request

- **WHEN** the user fills in two cost slots and submits the form
- **THEN** the form POST includes both slots' hardcoded name, amount, and SHĐ (where applicable) alongside the other trip plan fields

## MODIFIED Requirements

### Requirement: TripPlanCost schema — tripCostId removed

The `TripPlanCost` entity SHALL have `costName String?`, `amount Decimal`, and `invoiceNumber String?` fields. The `tripCostId` FK field and the `TripCost` relation SHALL be removed from the model. The `trip_plan_costs` table SHALL NOT contain a `trip_cost_id` column.

#### Scenario: TripPlanCost row created with only costName, amount, invoiceNumber

- **WHEN** a TripPlanCost row is created by the import service
- **THEN** the row has `costName`, `amount`, and optionally `invoiceNumber` — no `tripCostId`

### Requirement: Trip plan response cost breakdown excludes tripCostId

The `costs` array in `GET /api/v1/trip-plans` responses SHALL contain items with shape `{ id, costName, amount, invoiceNumber }`. The `tripCostId` field SHALL NOT appear in the response.

#### Scenario: TripPlan with costs returns cost array without tripCostId

- **WHEN** a trip plan has two TripPlanCost rows
- **THEN** the response `costs` array items have `{ id, costName, amount, invoiceNumber }` — no `tripCostId` field
