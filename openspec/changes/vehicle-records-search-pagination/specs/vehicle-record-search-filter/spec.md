## ADDED Requirements

### Requirement: Search across vehicle and mooc fields

The `GET /vehicle-records` endpoint SHALL accept a `search` query parameter. When provided, only records WHERE at least one of the following contains the search string (case-insensitive) SHALL be returned:

- `VehicleRecord.tenTaiXe`
- `VehicleRecord.sdt`
- `VehicleRecord.loaiXe`
- `VehicleRecord.bienSo`
- any `VehicleRecordMooc.soMooc` belonging to the record

#### Scenario: Search matches driver name

- **WHEN** client calls `GET /vehicle-records?search=nguyen`
- **THEN** only records where tenTaiXe contains "nguyen" (case-insensitive) OR other fields match are returned

#### Scenario: Search matches mooc number

- **WHEN** client calls `GET /vehicle-records?search=M123`
- **THEN** records that own a mooc with soMooc containing "M123" are returned

#### Scenario: No match

- **WHEN** search term matches no field in any record
- **THEN** response `data` is empty and `meta.total = 0`

### Requirement: Expiry date range filter with scope and type

The `GET /vehicle-records` endpoint SHALL accept `expiryFrom`, `expiryTo`, `expiryScope` (xe|mooc|all, default all), and `expiryType` (dangkiem|cavet|all, default all) query parameters. When `expiryFrom` or `expiryTo` is provided, only records matching the expiry condition SHALL be returned.

Expiry filter logic:

- scope=xe, type=dangkiem → `VehicleRecord.hanDangKiem` IN [from, to]
- scope=xe, type=cavet → `VehicleRecord.hanCaVet` IN [from, to]
- scope=xe, type=all → `VehicleRecord.hanDangKiem` IN range OR `VehicleRecord.hanCaVet` IN range
- scope=mooc, type=dangkiem → any mooc's `hanDangKiem` IN range
- scope=mooc, type=cavet → any mooc's `hanCaVet` IN range
- scope=mooc, type=all → any mooc's (hanDangKiem OR hanCaVet) IN range
- scope=all, type=dangkiem → xe ĐK OR mooc ĐK in range
- scope=all, type=all → xe (ĐK OR CV) OR mooc (ĐK OR CV) in range

#### Scenario: Filter by vehicle dangkiem in range

- **WHEN** client calls `GET /vehicle-records?expiryFrom=2026-06-01&expiryTo=2026-06-30&expiryScope=xe&expiryType=dangkiem`
- **THEN** only records where `VehicleRecord.hanDangKiem` falls within June 2026 are returned

#### Scenario: Filter includes mooc expiry

- **WHEN** client calls `GET /vehicle-records?expiryFrom=2026-07-01&expiryTo=2026-07-31&expiryScope=mooc&expiryType=cavet`
- **THEN** only records that have at least one mooc with `hanCaVet` in July 2026 are returned

#### Scenario: Scope=all matches either xe or mooc

- **WHEN** client calls with scope=all, type=all, and a date range
- **THEN** records where the vehicle OR any of its moocs has hanDangKiem OR hanCaVet in range are returned

#### Scenario: Search and expiry filter combine

- **WHEN** both `search` and expiry params are provided
- **THEN** only records matching BOTH the search condition AND the expiry condition are returned

### Requirement: Frontend search and filter UI

The vehicle records page SHALL render:

- A search text input with placeholder "Tìm tên tài xế, SĐT, loại xe, biển số, số mooc"
- An expiry scope selector: Tất cả / Xe / Mooc
- An expiry type selector: Tất cả / Đăng kiểm / Cà vẹt
- Two date inputs: Từ (expiryFrom) and Đến (expiryTo)
- Filters apply on input change (debounced or on blur/enter for text; immediate for selectors and dates)

#### Scenario: User types in search box

- **WHEN** user types a search term
- **THEN** the table reloads with page reset to 1 and only matching records shown

#### Scenario: User selects expiry scope and date range

- **WHEN** user selects "Xe", type "Đăng kiểm", and sets expiryFrom/To dates
- **THEN** table shows only records whose vehicle hanDangKiem is within the chosen range

### Requirement: Frontend mooc row display respects search match source

When a search term is active and a record matched ONLY because of a mooc's soMooc (not because of vehicle fields), the table SHALL display only the mooc rows whose soMooc contains the search term. If the vehicle itself matched (any of tenTaiXe, sdt, loaiXe, bienSo), all moocs SHALL be shown.

#### Scenario: Vehicle matched by bienSo — show all moocs

- **WHEN** search="BS001" and vehicle bienSo="BS001" has 3 moocs
- **THEN** all 3 moocs are displayed in the table

#### Scenario: Vehicle matched only via soMooc — show only matching moocs

- **WHEN** search="M123" and vehicle bienSo="XY789" has moocs [M123, M456, M789]
- **THEN** only the M123 mooc row is displayed for this vehicle
