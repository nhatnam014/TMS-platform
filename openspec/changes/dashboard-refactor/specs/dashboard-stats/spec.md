## ADDED Requirements

### Requirement: Dashboard stats are filtered by a trip date range

The system SHALL accept `tripFrom` and `tripTo` query parameters on `GET /dashboard/stats`. All trip-related aggregate counts (total trips, waiting, in-transit) SHALL be computed over the given date range. When both parameters are omitted, the endpoint SHALL default to today's date for both bounds.

#### Scenario: Stats filtered by custom trip date range

- **WHEN** the client calls `GET /dashboard/stats?tripFrom=2026-06-01&tripTo=2026-06-30`
- **THEN** `totalTrips`, `tripsWaiting`, and `tripsInTransit` reflect counts where `tripDate` falls between 2026-06-01 and 2026-06-30 inclusive

#### Scenario: Stats default to today when no trip range is provided

- **WHEN** the client calls `GET /dashboard/stats` with no query params
- **THEN** trip aggregate counts reflect only trips where `tripDate` equals today

### Requirement: Dashboard expiry stats are filtered by an expiry date range

The system SHALL accept `expiryFrom` and `expiryTo` query parameters on `GET /dashboard/stats`. The four expiry stat fields SHALL count records whose respective expiry date falls within `[expiryFrom, expiryTo]`. When omitted, the endpoint SHALL default to today through today+30 days.

#### Scenario: Expiry stats filtered by custom expiry range

- **WHEN** the client calls `GET /dashboard/stats?expiryFrom=2026-08-01&expiryTo=2026-08-31`
- **THEN** `expiringDangKiemXe`, `expiringCaVetXe`, `expiringDangKiemMooc`, `expiringCaVetMooc` count records expiring in August 2026 only

#### Scenario: Expiry stats default to next 30 days when no expiry range is provided

- **WHEN** the client calls `GET /dashboard/stats` with no expiry params
- **THEN** expiry counts reflect records expiring between today and today+30 days

### Requirement: Dashboard stats include tripsWaiting

The system SHALL include a `tripsWaiting` field in the stats response representing the count of trip plans whose status is `PLANNED` or `DISPATCHED` within the trip date range.

#### Scenario: Waiting count includes both PLANNED and DISPATCHED

- **WHEN** 3 trips on a given date have status PLANNED and 2 have status DISPATCHED
- **THEN** `tripsWaiting` equals 5 for that date range

### Requirement: Dashboard stats include four granular expiry fields

The system SHALL return `expiringDangKiemXe`, `expiringCaVetXe`, `expiringDangKiemMooc`, and `expiringCaVetMooc` as separate numeric fields. These replace the former single `expiringCompliance` field.

`expiringDangKiemXe` counts VehicleRecord rows where `hanDangKiem` is within the expiry range.
`expiringCaVetXe` counts VehicleRecord rows where `hanCaVet` is within the expiry range.
`expiringDangKiemMooc` counts VehicleRecordMooc rows where `hanDangKiem` is within the expiry range.
`expiringCaVetMooc` counts VehicleRecordMooc rows where `hanCaVet` is within the expiry range.

#### Scenario: Separate counts for xe and mooc đăng kiểm

- **WHEN** 4 VehicleRecords have `hanDangKiem` in range and 2 VehicleRecordMoocs have `hanDangKiem` in range
- **THEN** `expiringDangKiemXe` equals 4 and `expiringDangKiemMooc` equals 2

#### Scenario: Counts are independent across expiry types

- **WHEN** 3 records have `hanCaVet` in range and 5 records have `hanDangKiem` in range
- **THEN** `expiringCaVetXe` equals 3 and `expiringDangKiemXe` equals 5

## REMOVED Requirements

### Requirement: Dashboard stats include tripsCompleted

**Reason**: Operators do not need a completed-trip count on the dashboard; the pie chart provides status distribution more clearly.
**Migration**: Use `GET /dashboard/trips-trend` for trend data or filter trip plans page by status.

### Requirement: Dashboard stats include vehiclesInMaintenance

**Reason**: This field was always hardcoded to 0 and was never implemented.
**Migration**: No migration needed; field is removed.

### Requirement: Dashboard stats include expiringCompliance

**Reason**: Replaced by four granular fields (`expiringDangKiemXe`, `expiringCaVetXe`, `expiringDangKiemMooc`, `expiringCaVetMooc`) and bảo hiểm is excluded from stat cards.
**Migration**: Consumers must use the four new granular fields.
