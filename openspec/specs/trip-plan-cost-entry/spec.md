## REMOVED Requirements

### Requirement: TripPlanCost stores cost name as snapshot

**Reason**: The `tripCostId` FK field is removed along with the `TripCost` catalog table. The `costName` snapshot column on `TripPlanCost` remains but is now the primary identifier (no catalog to look up). The "snapshot survives catalog deletion" concern is no longer applicable since there is no catalog.
**Migration**: `TripPlanCost` rows retain `costName`, `amount`, and `invoiceNumber`. The `trip_cost_id` column is dropped by migration.

### Requirement: Cost is added to a trip plan via TripCost catalog selection

**Reason**: `POST /api/v1/trip-plans/:id/costs` endpoint is removed. Cost entry happens through the create and edit form cost slots, which submit cost data as part of the trip plan create/update request body. The `TripCost` catalog no longer exists.
**Migration**: Use `POST /api/v1/trip-plans` (create) or `PATCH /api/v1/trip-plans/:id` (edit) to set cost slot values.

### Requirement: Cost selection in the UI uses a dropdown, not free-text input

**Reason**: The dropdown was sourced from the TripCost catalog, which is removed. The UI now uses plain formatted amount text inputs.
**Migration**: See `trip-cost-freeform-entry` spec.

### Requirement: Trip plan response includes cost breakdown with tripCostId

**Reason**: With `tripCostId` removed from `TripPlanCost`, the `costs` array no longer contains that field. See `trip-plan-cost-form` spec for the updated response shape.
**Migration**: Consumers of `costs[].tripCostId` should switch to `costs[].costName`.
