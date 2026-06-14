## REMOVED Requirements

### Requirement: TripCost catalog CRUD

**Reason**: The TripCost catalog table is removed at client request. Cost names are entered directly in the trip plan form. No catalog management UI, API, or database table is needed.
**Migration**: All existing `TripCostName` values are already stored as `costName` snapshots on `TripPlanCost` rows. The `trip_costs` table is dropped by migration. The `/trip-costs` page and "Danh mục chi phí" nav link are removed.

### Requirement: TripCost catalog API endpoints

**Reason**: Same as above — catalog is removed.
**Migration**: `GET /api/v1/trip-costs`, `POST /api/v1/trip-costs`, `PATCH /api/v1/trip-costs/:id`, `DELETE /api/v1/trip-costs/:id` are all removed. Clients should remove any calls to these endpoints.
