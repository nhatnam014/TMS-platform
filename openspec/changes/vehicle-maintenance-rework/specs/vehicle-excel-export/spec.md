## MODIFIED Requirements

### Requirement: Bảo dưỡng xe export groups records by loaiXe from VehicleRecord

The system SHALL provide a bảo dưỡng xe Excel export at `POST /api/export/vehicle-maintenance` (or equivalent) that sources data from `vehicle_records` (not the old maintenance table). Records SHALL be grouped by `loaiXe`, with each selected `loaiXe` value producing one worksheet. The column set per sheet SHALL be: STT, SỐ XE (bienSo), Tài xế (tenTaiXe), PHONE (sdt), NGÀY LÀM (ngayLam), LOẠI XE (loaiXe), ĐƠN VỊ SỬA CHỮA (donViSuaChua), KM CÒN LẦN 1 ... KM CÒN LẦN {maxN}, ID (vehicleRecordId).

`maxN` SHALL be determined per sheet as `MAX(round_number)` across all km rounds of vehicles in that loaiXe group. If no vehicle in the group has any km rounds, the sheet SHALL still render 4 empty km columns (LẦN 1 through LẦN 4).

#### Scenario: Export produces one sheet per selected loaiXe

- **WHEN** user selects SHACMAN and CHENGLONG and requests export
- **THEN** the resulting `.xlsx` contains exactly two worksheets named "SHACMAN" and "CHENGLONG"

#### Scenario: Km columns scale to max round in group

- **WHEN** the SHACMAN group has a vehicle with 6 km rounds
- **THEN** the SHACMAN sheet has km columns LẦN 1 through LẦN 6; vehicles in that group with fewer rounds have empty cells for missing rounds

#### Scenario: Group with no km data gets 4 empty km columns

- **WHEN** the CHENGLONG group has vehicles but none have any km rounds
- **THEN** the CHENGLONG sheet renders columns LẦN 1 through LẦN 4, all cells empty

#### Scenario: ID column contains VehicleRecord.id

- **WHEN** the export file is generated
- **THEN** the last column header is "ID" and each cell contains the `VehicleRecord.id` (cuid string) in light grey text

---

### Requirement: LoaiXe selector popup before export

The system SHALL present a modal/popup when the user initiates a bảo dưỡng xe export, listing all distinct `loaiXe` values sourced from `vehicle_records`. The user MAY select individual values or use a "Tất cả" (select all) option. The export SHALL proceed only after the user confirms the selection.

#### Scenario: Popup lists available loaiXe values

- **WHEN** user clicks "Xuất Excel" on the bảo dưỡng xe page or export page
- **THEN** a popup appears listing distinct loaiXe values from vehicle_records as checkboxes

#### Scenario: Tất cả selects all loaiXe values

- **WHEN** user clicks "Tất cả" in the popup
- **THEN** all loaiXe checkboxes are selected

#### Scenario: Export only includes selected loaiXe sheets

- **WHEN** user selects only SHACMAN and clicks "Xuất đã chọn"
- **THEN** the exported file contains only the SHACMAN sheet, not sheets for other loaiXe values

#### Scenario: Popup data comes from vehicle_records distinct loaiXe

- **WHEN** `GET /api/vehicle-records/distinct-loai-xe` is called
- **THEN** the response is an array of distinct non-null loaiXe strings sorted ascending, sourced from `vehicle_records`
