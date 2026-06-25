## ADDED Requirements

### Requirement: Exported Excel embeds a branded header block (logo, title, date row)

The "kế hoạch xe" Excel export SHALL prepend an 8-row branded header above the column header row, replacing the prior 4-row header. The header SHALL contain:
- The company logo image (`apps/img/LogisticCompany.png`) anchored to cells A1:E7 (5 columns × 7 rows)
- A report title ("KẾ HOẠCH XE"), in hoa, bold, font size 18, color `#003399`, merged across columns H3:O3 (row 3 only), center-aligned
- A date line merged across columns H5:O5 (row 5 only), font size 11, center-aligned, reading `"From: DD/MM/YYYY  To: DD/MM/YYYY"` using the existing date-fallback logic (explicit `from`/`to` query params if provided, else `MIN(tripDate)` / today)
- Row 8 SHALL be a blank spacer row
- The column header row is row 9 (moved from row 5); data begins at row 10 (moved from row 6)

This supersedes the row numbers referenced in the "31-column template layout" requirement below — that requirement's column *order* and field-mapping rules are unaffected by the header move; only the row positions noted there as "row 1" reflect a pre-existing documentation drift (the export has not had column headers at row 1 since the original branded-header change shipped) and should be read as "the column header row" wherever a literal row number is stale.

#### Scenario: Logo, title, and date appear in the new layout

- **WHEN** the kế hoạch xe Excel file is opened
- **THEN** the logo spans A1:E7, the title "KẾ HOẠCH XE" is centered in a merged cell at row 3 (cols H–O), and a centered From/To date line appears in a merged cell at row 5 (cols H–O), with row 8 blank

#### Scenario: Column headers and data move to rows 9/10

- **WHEN** the export contains 10 TripPlan records
- **THEN** row 9 contains the column headers and rows 10–19 contain the data

## MODIFIED Requirements

### Requirement: Exported Excel matches the actual 31-column template layout

The system SHALL produce a worksheet named "kế hoạch xe" with the following column headers in order, matching the customer's template exactly:

STT, NGÀY, SỐ XE, KHÁCH HÀNG, LOẠI HÌNH, ĐƠN VỊ, SIZE CONT, CONT ĐI, CONT VỀ, 20', 40', 45', Điểm Lấy (R/H), Điểm (Đóng/Rút), Điểm hạ (R/H), PHÍ NÂNG, SHĐ NÂNG, PHÍ HẠ, SHĐ HẠ, PHÍ VỆ SINH, SHĐ, PHÍ CƯỢC, VÉ CỔNG, SHĐ, CHI PHÍ KHÁC/PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN/CHỈ ĐỊNH/BP CAM, CẦU ĐƯỜNG, NGÀY GỬI CT, CHI PHÍ PHÁT SINH KHÁC, NỘI DUNG, GHI CHÚ.

The STT column SHALL be populated from `TripPlan.tripNumber`. When `tripNumber` is `null` (e.g. a trip plan created via the web UI form, which does not set `tripNumber`), the STT cell SHALL fall back to the row's 1-based position in the exported sheet.

Cost columns SHALL be populated from `TripPlanCost` rows, matched by the TripCost catalog item's name. If no TripPlanCost row exists for a given cost name, the cell is blank.

SHĐ columns SHALL be populated from the `invoiceNumber` field of the corresponding TripPlanCost row.

The 20'/40'/45' columns SHALL contain "X" if `containerSize` starts with "20", "40", or "45" respectively; otherwise blank.

#### Scenario: Header row contains the 31 Vietnamese column names

- **WHEN** the export file is opened
- **THEN** row 1 contains the 31 headers in the specified order

#### Scenario: SIZE CONT column is populated

- **WHEN** a TripPlan has `containerSize = "40HC"`
- **THEN** the SIZE CONT cell contains "40HC" and the 40' cell contains "X"

#### Scenario: Cost column shows amount from TripPlanCost

- **WHEN** a TripPlan has a TripPlanCost with costName "PHÍ NÂNG" and amount 1200000
- **THEN** the PHÍ NÂNG cell displays 1200000

#### Scenario: Missing cost cell is blank

- **WHEN** a TripPlan has no TripPlanCost for "PHÍ HẠ"
- **THEN** the PHÍ HẠ cell is empty

#### Scenario: Each data row maps to one TripPlan record

- **WHEN** the export contains 50 TripPlan records
- **THEN** the worksheet has 51 rows (1 header + 50 data)

#### Scenario: STT shows the real tripNumber

- **WHEN** a TripPlan has `tripNumber = 7` and is the 3rd row in the exported sheet
- **THEN** the STT cell displays 7, not 3

#### Scenario: STT falls back to row position when tripNumber is null

- **WHEN** a TripPlan has `tripNumber = null` and is the 3rd row in the exported sheet
- **THEN** the STT cell displays 3
