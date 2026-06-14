## MODIFIED Requirements

### Requirement: Admin can bulk-import trip plans from Excel

The system SHALL provide `POST /api/v1/import/trip-plans` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file. The endpoint MUST parse the "kế hoạch xe" sheet and, for each cost column with a non-zero value, create a `TripPlanCost` row with `costName` set directly to the cost column's label (e.g. "PHÍ NÂNG"). The endpoint MUST NOT look up or create any `TripCost` catalog entries. No warnings SHALL be emitted for cost names that are not in any catalog (the catalog no longer exists).

All other import behavior (column mapping, reference entity auto-creation, 400 on invalid file) is unchanged.

#### Scenario: Cost columns create TripPlanCost rows without catalog lookup

- **WHEN** an admin uploads a valid "kế hoạch xe" Excel file with PHÍ NÂNG = 500000
- **THEN** a TripPlanCost row is created with `costName = "PHÍ NÂNG"`, `amount = 500000` — no TripCost row is created or looked up

#### Scenario: No "Chi phí mới tự tạo" warnings in import result

- **WHEN** an admin imports a file with cost column values
- **THEN** the `warnings` array does NOT contain any "Chi phí mới tự tạo" messages

#### Scenario: TripPlanCost rows have no tripCostId

- **WHEN** the import creates TripPlanCost rows
- **THEN** those rows have `costName` set and `tripCostId` does not exist on the model (column was dropped)
