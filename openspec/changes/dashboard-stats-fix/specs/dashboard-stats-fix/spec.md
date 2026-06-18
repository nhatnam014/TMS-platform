## ADDED Requirements

### Requirement: Vehicle active count reflects unique license plates only

The system SHALL compute `vehiclesActive` by counting distinct non-null `bienSo` values across all `VehicleRecord` rows. Records with a null `bienSo` SHALL be excluded from this count.

#### Scenario: Records without a license plate are not counted

- **WHEN** 10 VehicleRecord rows exist, 3 of which have `bienSo = null`
- **THEN** `vehiclesActive` equals 7 (only rows with a non-null bienSo)

#### Scenario: Duplicate license plates count as one vehicle

- **WHEN** 5 VehicleRecord rows share the same `bienSo` value "51C-12345"
- **THEN** `vehiclesActive` counts that plate once, not 5 times

### Requirement: Dashboard stats include moocsActive count

The system SHALL return a `moocsActive` field in the `DashboardStats` response representing the total count of `VehicleRecordMooc` rows.

#### Scenario: Mooc count reflects all mooc records

- **WHEN** 12 VehicleRecordMooc rows exist
- **THEN** `moocsActive` equals 12

### Requirement: Dashboard provides urgent expiry counts anchored to today

The system SHALL return four `urgent*` fields in `DashboardStats`, each representing items whose expiry date is on or before the end of the current calendar day (server time). These counts are independent of the trip date filter.

Fields:
- `urgentDangKiemXe`: count of distinct non-null `bienSo` in VehicleRecord where `hanDangKiem <= today`
- `urgentCaVetXe`: count of distinct non-null `bienSo` in VehicleRecord where `hanCaVet <= today`
- `urgentDangKiemMooc`: count of VehicleRecordMooc rows where `hanDangKiem <= today`
- `urgentCaVetMooc`: count of VehicleRecordMooc rows where `hanCaVet <= today`

#### Scenario: Urgent counts include past-overdue items

- **WHEN** a VehicleRecord has `hanDangKiem = 2026-01-01` and today is 2026-06-18
- **THEN** that vehicle is included in `urgentDangKiemXe`

#### Scenario: Urgent counts include items expiring today

- **WHEN** a VehicleRecord has `hanDangKiem = 2026-06-18` and today is 2026-06-18
- **THEN** that vehicle is included in `urgentDangKiemXe`

#### Scenario: Urgent counts exclude future-expiring items

- **WHEN** a VehicleRecord has `hanDangKiem = 2026-06-19` and today is 2026-06-18
- **THEN** that vehicle is NOT included in `urgentDangKiemXe`

#### Scenario: Urgent counts are not affected by the trip date filter

- **WHEN** the client calls `GET /dashboard/stats?tripFrom=2026-01-01&tripTo=2026-01-31`
- **THEN** `urgentDangKiemXe` still counts vehicles with `hanDangKiem <= today` (2026-06-18)

### Requirement: Dashboard expiry warning window is fixed to today+29 days

The system SHALL compute `expiringDangKiemXe`, `expiringCaVetXe`, `expiringDangKiemMooc`, `expiringCaVetMooc` using a fixed window of `hanXxx <= today+29`, regardless of any query parameters. This covers already-expired records plus those expiring within the next 29 days.

#### Scenario: Warning counts include already-expired items

- **WHEN** a VehicleRecord has `hanDangKiem = 2026-05-01` and today is 2026-06-18
- **THEN** that vehicle is included in `expiringDangKiemXe`

#### Scenario: Warning counts include items expiring within 29 days

- **WHEN** a VehicleRecord has `hanDangKiem = 2026-07-17` and today is 2026-06-18
- **THEN** that vehicle is included in `expiringDangKiemXe`

#### Scenario: Warning counts exclude items expiring beyond 29 days

- **WHEN** a VehicleRecord has `hanDangKiem = 2026-07-18` and today is 2026-06-18
- **THEN** that vehicle is NOT included in `expiringDangKiemXe`

### Requirement: Dashboard "Cần xử lý hôm nay" section displays all four urgent expiry items

The dashboard UI SHALL display `urgentDangKiemXe`, `urgentDangKiemMooc`, `urgentCaVetXe`, and `urgentCaVetMooc` as inline items in the "Cần xử lý hôm nay" section alongside the existing "Chuyến đang chờ điều xe" item.

#### Scenario: Five items rendered inline in the alert section

- **WHEN** the dashboard loads with urgent expiry data
- **THEN** the "Cần xử lý hôm nay" section renders five items: Xe hết hạn ĐK, Mooc hết hạn ĐK, Xe hết hạn cà vẹt, Mooc hết hạn cà vẹt, Chuyến đang chờ

### Requirement: Dashboard "Tổng quan vận hành" includes Mooc đang hoạt động stat card

The dashboard UI SHALL render a "Mooc đang hoạt động" StatCard displaying `moocsActive` as the fifth card in the "Tổng quan vận hành" section, after "Xe đang hoạt động".

#### Scenario: Mooc card displays correct count

- **WHEN** `moocsActive` equals 14
- **THEN** the "Mooc đang hoạt động" stat card displays 14
