## ADDED Requirements

### Requirement: Cost is added to a trip plan via TripCost catalog selection

The system SHALL provide `POST /api/v1/trip-plans/:id/costs` accepting `{ tripCostId: string, amount: number, invoiceNumber?: string }`. The endpoint MUST:

1. Create a `TripPlanCost` row with the provided tripCostId, amount, and invoiceNumber (SHĐ).
2. In the same transaction, update the parent `TripPlan` row setting `tripCostName` to the selected TripCost's name and `tripCostAmount` to the provided amount.

#### Scenario: Successful cost addition writes junction and denormalized fields

- **WHEN** a user calls `POST /api/v1/trip-plans/:id/costs` with `{ "tripCostId": "<id>", "amount": 1200000 }`
- **THEN** a TripPlanCost row is created
- **THEN** the TripPlan row's `tripCostName` is set to the selected TripCost's name
- **THEN** the TripPlan row's `tripCostAmount` is set to 1200000

#### Scenario: Adding a second cost overwrites denormalized fields on TripPlan

- **WHEN** a user adds a second cost to a trip plan that already has one
- **THEN** the TripPlan's `tripCostName` and `tripCostAmount` reflect the most recently added cost

#### Scenario: Unknown tripCostId is rejected

- **WHEN** the provided `tripCostId` does not exist in the TripCost catalog
- **THEN** the API returns HTTP 404

#### Scenario: Amount must be positive

- **WHEN** the provided `amount` is 0 or negative
- **THEN** the API returns HTTP 400

#### Scenario: Unknown tripPlanId is rejected

- **WHEN** the provided trip plan id does not exist
- **THEN** the API returns HTTP 404

---

### Requirement: Cost selection in the UI uses a dropdown, not free-text input

The cost entry modal on the trip plans page SHALL replace the free-text cost type input with a `<select>` element populated from `GET /api/trip-costs`. The form SHALL collect: cost type (select), amount (number input), and SHĐ / invoice number (text input). Description field is removed.

#### Scenario: Dropdown lists active TripCost catalog items

- **WHEN** the cost modal opens
- **THEN** the select element contains one option per TripCost item returned by `GET /api/trip-costs`

#### Scenario: SHĐ is a plain text input

- **WHEN** the user enters an invoice number
- **THEN** the value is sent as a plain string in the `invoiceNumber` field (no validation or formatting applied)

#### Scenario: Form submits with tripCostId, amount, invoiceNumber

- **WHEN** the user selects a cost type, enters an amount, and submits
- **THEN** the form posts `{ tripCostId, amount, invoiceNumber? }` to `POST /api/trip-plans/:id/costs`

---

### Requirement: TripPlanCost rows are permanently deleted when TripCost is deleted

When a TripCost catalog item is hard-deleted, all associated TripPlanCost rows SHALL be deleted via database cascade (onDelete: Cascade on the FK). The parent TripPlan rows SHALL remain intact with their existing `tripCostName` and `tripCostAmount` values.

#### Scenario: Cascade delete removes junction rows

- **WHEN** a TripCost item is deleted
- **THEN** all TripPlanCost rows with that `tripCostId` are permanently removed from the database

#### Scenario: TripPlan rows survive TripCost deletion

- **WHEN** a TripCost item is deleted
- **THEN** TripPlan rows that referenced that cost via TripPlanCost are not deleted
- **THEN** the TripPlan's `tripCostName` and `tripCostAmount` retain their last-written values

---

### Requirement: Trip plan response includes cost breakdown

The `GET /api/v1/trip-plans` and `GET /api/v1/trip-plans/:id` responses SHALL include a `costs` array on each TripPlan, where each element is `{ id, tripCostId, costName: TripCost.name, amount, invoiceNumber }`.

#### Scenario: TripPlan with costs returns cost array

- **WHEN** a trip plan has two TripPlanCost rows
- **THEN** the response includes `"costs": [{ "id": "...", "tripCostId": "...", "costName": "PHÍ NÂNG", "amount": 1200000, "invoiceNumber": null }, ...]`

#### Scenario: TripPlan with no costs returns empty array

- **WHEN** a trip plan has no associated costs
- **THEN** the response includes `"costs": []`
