## MODIFIED Requirements

### Requirement: TripPlanCost stores cost name as snapshot

The `TripPlanCost` entity SHALL have a `costName String?` field that stores the name of the cost type at the time the record is created. The `tripCostId` field SHALL be nullable. When a `TripCost` catalog item is deleted, associated `TripPlanCost` rows SHALL have their `tripCostId` set to `NULL` (SetNull) but the row and its `costName`, `amount`, and `invoiceNumber` values SHALL be preserved.

#### Scenario: Adding a cost writes costName snapshot

- **WHEN** a user calls `POST /api/v1/trip-plans/:id/costs` with a valid `tripCostId`
- **THEN** the created `TripPlanCost` row has `cost_name` set to the TripCost item's `name` at the time of the call

#### Scenario: Deleting a TripCost sets tripCostId to NULL but preserves the row

- **WHEN** a `TripCost` item is hard-deleted after a `TripPlanCost` row references it
- **THEN** the `TripPlanCost` row remains in the database with `trip_cost_id = NULL` and its original `cost_name`, `amount`, and `invoice_number` intact

#### Scenario: Cost response includes costName even when tripCostId is null

- **WHEN** `GET /api/v1/trip-plans/:id` is called and a cost row has `tripCostId = null`
- **THEN** the cost item in the response has `tripCostId: null` and `costName` retains the snapshot string

---

### Requirement: Cost is added to a trip plan via TripCost catalog selection

The system SHALL provide `POST /api/v1/trip-plans/:id/costs` accepting `{ tripCostId: string, amount: number, invoiceNumber?: string }`. The endpoint MUST:

1. Look up the TripCost item by `tripCostId`.
2. Create a `TripPlanCost` row with the provided `tripCostId`, `amount`, `invoiceNumber`, and the TripCost's `name` as `costName` snapshot.
3. In the same transaction, update the parent `TripPlan` row setting `tripCostName` to the selected TripCost's name and `tripCostAmount` to the provided amount.

#### Scenario: Successful cost addition writes junction row with costName

- **WHEN** a user calls `POST /api/v1/trip-plans/:id/costs` with `{ "tripCostId": "<id>", "amount": 1200000 }`
- **THEN** a TripPlanCost row is created with `costName` = the TripCost's name
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

### Requirement: Trip plan response includes cost breakdown

The `GET /api/v1/trip-plans` and `GET /api/v1/trip-plans/:id` responses SHALL include a `costs` array on each TripPlan, where each element is `{ id, tripCostId, costName, amount, invoiceNumber }`. `tripCostId` may be `null` if the catalog item was deleted; `costName` SHALL always contain the snapshot value.

#### Scenario: TripPlan with costs returns cost array including costName

- **WHEN** a trip plan has two TripPlanCost rows
- **THEN** the response includes `"costs": [{ "id": "...", "tripCostId": "...", "costName": "PHÍ NÂNG", "amount": 1200000, "invoiceNumber": null }, ...]`

#### Scenario: TripPlan with orphaned cost (catalog item deleted) returns costName from snapshot

- **WHEN** a trip plan has a TripPlanCost row where `tripCostId` is null
- **THEN** the response includes that cost with `"tripCostId": null` and `"costName"` retaining its snapshot value

#### Scenario: TripPlan with no costs returns empty array

- **WHEN** a trip plan has no associated TripPlanCost rows
- **THEN** the response includes `"costs": []`
