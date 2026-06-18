## MODIFIED Requirements

### Requirement: Dashboard expiry stats are filtered by an expiry date range

The system SHALL compute expiry stats (`expiringDangKiemXe`, `expiringCaVetXe`, `expiringDangKiemMooc`, `expiringCaVetMooc`) using a fixed server-side window of `hanXxx <= today+29`. The `expiryFrom` and `expiryTo` query parameters are no longer accepted or used.

#### Scenario: Expiry stats use fixed 29-day window regardless of query params

- **WHEN** the client calls `GET /dashboard/stats?tripFrom=2026-06-01&tripTo=2026-06-30`
- **THEN** expiry counts reflect records with `hanXxx <= today+29`, not the trip date range

#### Scenario: No expiryFrom/expiryTo params required

- **WHEN** the client calls `GET /dashboard/stats` with no query params
- **THEN** expiry counts reflect records with `hanXxx <= today+29`

### Requirement: Dashboard stats include four granular expiry fields

The system SHALL return `expiringDangKiemXe`, `expiringCaVetXe`, `expiringDangKiemMooc`, and `expiringCaVetMooc` as separate numeric fields using a fixed `<= today+29` window. `expiringDangKiemXe` and `expiringCaVetXe` count distinct non-null `bienSo` values (not raw row count). `expiringDangKiemMooc` and `expiringCaVetMooc` count VehicleRecordMooc rows.

#### Scenario: Separate counts for xe and mooc đăng kiểm

- **WHEN** 4 VehicleRecords (distinct bienSo) have `hanDangKiem <= today+29` and 2 VehicleRecordMoocs have `hanDangKiem <= today+29`
- **THEN** `expiringDangKiemXe` equals 4 and `expiringDangKiemMooc` equals 2

#### Scenario: Counts are independent across expiry types

- **WHEN** 3 records have `hanCaVet <= today+29` and 5 records have `hanDangKiem <= today+29`
- **THEN** `expiringCaVetXe` equals 3 and `expiringDangKiemXe` equals 5

## REMOVED Requirements

### Requirement: Dashboard expiry stats accept expiryFrom and expiryTo query parameters

**Reason**: Expiry warning window is now fixed server-side (`<= today+29`). Parameterizing it added complexity without user value, and caused the expiry cards to change when users adjusted the trip date filter.
**Migration**: Remove `expiryFrom`/`expiryTo` from any calls to `GET /dashboard/stats`. The server always uses the fixed window.
