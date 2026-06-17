## ADDED Requirements

### Requirement: Search covers location, SHĐ, cost names, carrier, and service type fields

When `search` query param is provided to `GET /trip-plans`, the backend SHALL match records where any of the following fields contains the search string (case-insensitive partial match):

**Existing fields (unchanged):**

- `tripNumber` (exact numeric match when search is a number)
- `vehiclePlate`, `customer.name`, `outboundContainerNumber`, `inboundContainerNumber`, `notes`

**New fields added:**

- `pickupLocationName`, `loadUnloadLocationName`, `dropoffLocationName`
- `shdNang`, `shdHa`, `shdVeSinh`, `shdVeCong`
- `phiNangName`, `phiHaName`, `phiVeSinhName`, `phiCuocName`, `veCongName`, `chiPhiKhacName`, `chiPhiTraiTuyenName`, `cauDuongName`
- `carrier.name` (via relation), `serviceTypeMaster.code` (via relation), `serviceTypeMaster.description` (via relation)

All string fields SHALL use `mode: insensitive` in the Prisma `contains` filter.

#### Scenario: Search by pickup location name

- **WHEN** client calls `GET /trip-plans?search=Cảng`
- **THEN** trips where `pickupLocationName` contains "cảng" (case-insensitive) are returned

#### Scenario: Search by SHĐ number

- **WHEN** client calls `GET /trip-plans?search=INV-001`
- **THEN** trips where any of shdNang, shdHa, shdVeSinh, shdVeCong contains "INV-001" are returned

#### Scenario: Search by cost name

- **WHEN** client calls `GET /trip-plans?search=PHÍ NÂNG`
- **THEN** trips where phiNangName contains "phí nâng" (case-insensitive) are returned

#### Scenario: Search by carrier name

- **WHEN** client calls `GET /trip-plans?search=Vận tải ABC`
- **THEN** trips where the related carrier's name contains "vận tải abc" (case-insensitive) are returned

#### Scenario: Search by service type code

- **WHEN** client calls `GET /trip-plans?search=FCL`
- **THEN** trips where serviceTypeMaster.code or serviceTypeMaster.description contains "FCL" are returned

#### Scenario: Search combines with other filters

- **WHEN** client calls `GET /trip-plans?search=Cảng&status=PLANNED`
- **THEN** only trips matching both the search term AND the status filter are returned
