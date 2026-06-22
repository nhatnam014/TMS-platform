## ADDED Requirements

### Requirement: VehicleMaintenanceKmRound data model

The system SHALL introduce a `vehicle_maintenance_km_rounds` table linked to `vehicle_records` via a non-nullable FK. Each row represents one km checkpoint (round) for a vehicle. The table SHALL enforce uniqueness on `(vehicle_record_id, round_number)` so that upserts by import are idempotent. The old `vehicle_maintenance_records` table SHALL be dropped; `VehicleRecord` gains two nullable columns: `don_vi_sua_chua` (String) and `ngay_lam` (Date).

#### Scenario: Schema migration applies cleanly

- **WHEN** the Prisma migration runs on a fresh or existing database
- **THEN** `vehicle_maintenance_km_rounds` exists with columns `id`, `vehicle_record_id`, `round_number` (Int), `km_con` (Decimal 10,2), `created_at`, `updated_at`; `vehicle_records` has new columns `don_vi_sua_chua` and `ngay_lam`; `vehicle_maintenance_records` does not exist

#### Scenario: Unique constraint prevents duplicate rounds per vehicle

- **WHEN** an insert is attempted with a `vehicle_record_id` and `round_number` combination that already exists
- **THEN** the database raises a unique constraint violation

---

### Requirement: List km rounds for a vehicle

The system SHALL provide `GET /api/vehicle-maintenance/:vehicleRecordId/km-rounds` that returns all km rounds for the given vehicle record, ordered by `round_number` ascending.

#### Scenario: Returns rounds in order

- **WHEN** a vehicle has km rounds with round_number 1, 3, 2 (inserted out of order)
- **THEN** the response array is `[{roundNumber: 1, ...}, {roundNumber: 2, ...}, {roundNumber: 3, ...}]`

#### Scenario: Returns empty array for vehicle with no rounds

- **WHEN** a vehicle record exists but has no km rounds
- **THEN** the response is `[]`

#### Scenario: Returns 404 for unknown vehicle record id

- **WHEN** the vehicleRecordId does not exist in `vehicle_records`
- **THEN** the API returns HTTP 404

---

### Requirement: Batch upsert km rounds for a vehicle

The system SHALL provide `PUT /api/vehicle-maintenance/:vehicleRecordId/km-rounds` that accepts an array of `{roundNumber: Int, kmCon: Decimal}` objects and performs an upsert for each: insert if `(vehicleRecordId, roundNumber)` is new, update `kmCon` if it already exists. Rounds not present in the payload are left unchanged.

#### Scenario: Create multiple rounds in one request

- **WHEN** a PUT request is made with `[{roundNumber: 1, kmCon: 250000}, {roundNumber: 2, kmCon: 260000}]` for a vehicle with no existing rounds
- **THEN** both rounds are created and returned

#### Scenario: Update existing round

- **WHEN** a PUT request is made with `[{roundNumber: 1, kmCon: 255000}]` for a vehicle that already has round 1 with kmCon 250000
- **THEN** round 1's kmCon is updated to 255000; other rounds are untouched

#### Scenario: Mixed create and update in one request

- **WHEN** a PUT request contains round 1 (exists) and round 3 (new)
- **THEN** round 1 is updated and round 3 is created; round 2 (if existing) is untouched

---

### Requirement: Delete a single km round

The system SHALL provide `DELETE /api/vehicle-maintenance/:vehicleRecordId/km-rounds/:roundNumber` that removes the specific round. If the round does not exist, return HTTP 404.

#### Scenario: Delete existing round

- **WHEN** DELETE is called with a valid vehicleRecordId and roundNumber
- **THEN** that round is removed; other rounds for the vehicle are unaffected

#### Scenario: Delete non-existent round returns 404

- **WHEN** DELETE is called with a roundNumber that does not exist for the vehicle
- **THEN** the API returns HTTP 404

---

### Requirement: Update vehicle maintenance fields (donViSuaChua, ngayLam)

The system SHALL provide `PATCH /api/vehicle-maintenance/:vehicleRecordId` that updates `donViSuaChua` and/or `ngayLam` fields on the `VehicleRecord`. The endpoint MUST NOT modify any other vehicle record fields.

#### Scenario: Update donViSuaChua

- **WHEN** a PATCH request is made with `{donViSuaChua: "Gara ABC"}`
- **THEN** `don_vi_sua_chua` on the vehicle record is updated; `ngay_lam` and all other fields remain unchanged

#### Scenario: Update ngayLam

- **WHEN** a PATCH request is made with `{ngayLam: "2026-05-11"}`
- **THEN** `ngay_lam` on the vehicle record is updated

#### Scenario: Unknown vehicleRecordId returns 404

- **WHEN** a PATCH request targets a vehicleRecordId that does not exist
- **THEN** the API returns HTTP 404

---

### Requirement: Get full maintenance profile for a vehicle

The system SHALL provide `GET /api/vehicle-maintenance/:vehicleRecordId` that returns the vehicle record's `donViSuaChua`, `ngayLam`, and the full ordered `kmRounds` array.

#### Scenario: Returns combined maintenance profile

- **WHEN** GET is called for a vehicle that has donViSuaChua set and 3 km rounds
- **THEN** the response contains `{donViSuaChua, ngayLam, kmRounds: [{roundNumber, kmCon}, ...]}`
