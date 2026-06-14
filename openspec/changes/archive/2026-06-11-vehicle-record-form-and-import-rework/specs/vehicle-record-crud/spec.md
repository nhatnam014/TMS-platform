## MODIFIED Requirements

### Requirement: Web UI — create/edit form with dynamic mooc list

The system SHALL provide a modal form for creating and editing vehicle records. The modal SHALL be ~820px wide (capped at 95vw) and organized into three horizontal sections to minimize vertical scrolling.

**Section row 1 — two columns side by side:**

- **Tài xế** (left):
  - Searchable dropdown "Chọn tài xế" populated from `GET /api/drivers`, displaying each driver as `"{fullName} — {phone}"`
  - After a driver is selected: `tenTaiXe` and `sdt` inputs are populated from the driver and become **disabled**
  - If no driver is selected: `tenTaiXe` (text, optional) and `sdt` (text, optional) inputs are enabled for free-text entry
  - Re-selecting a driver from the dropdown overwrites the previous autofill; there is no clear/reset button

- **Thông tin xe** (right, wider):
  - Searchable dropdown "Chọn xe" populated from `GET /api/vehicles`, displaying each vehicle as `"{licensePlate} — {vehicleType}"`
  - After a vehicle is selected: `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, `hanCaVet` inputs are populated and become **disabled**
  - If no vehicle is selected: all five inputs are enabled (loại xe text, biển số text, three date inputs optional)
  - Re-selecting a vehicle overwrites all five autofilled fields

**Section row 2 — Mooc (full width):**
Dynamic list of mooc rows. Each mooc row displays all four inputs on a single horizontal line: Số mooc (text), Hạn ĐK (date, optional), Hạn BH (date, optional), Hạn CV (date, optional), and a remove button [×]. A "+ Thêm mooc" button appears below the list to add a new blank row.

**Section row 3 — Ghi chú (full width):**
A single textarea for notes (optional).

All field names, data types, nullability rules, and form submission payload remain unchanged. The POST/PATCH body always contains the text values (`tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, dates) regardless of whether they were entered manually or autofilled from a dropdown.

#### Scenario: Add mooc row

- **WHEN** user clicks "+ Thêm mooc"
- **THEN** a new blank mooc row appears with fields soMooc, hanDangKiem, hanBaoHiem, hanCaVet on a single horizontal line

#### Scenario: Remove mooc row

- **WHEN** user clicks the [×] button on a mooc row
- **THEN** that mooc row is removed from the form

#### Scenario: Save with empty mooc list

- **WHEN** user submits the form with no mooc rows
- **THEN** the record is created/updated with `moocs: []`

#### Scenario: Driver and vehicle sections are side by side

- **WHEN** the user opens the create or edit modal on a desktop viewport (≥ 820px)
- **THEN** the Tài xế and Thông tin xe sections are visible simultaneously in a single horizontal row without any horizontal scrollbar

#### Scenario: Form fits in viewport without vertical scroll for simple records

- **WHEN** the user opens the modal with zero or one mooc
- **THEN** the entire form is visible without vertical scrolling

#### Scenario: Driver dropdown autofills and locks tên TX + SĐT

- **WHEN** the user selects a driver from the Chọn tài xế dropdown
- **THEN** tenTaiXe and sdt inputs are populated from the driver and become disabled

#### Scenario: Vehicle dropdown autofills and locks five vehicle fields

- **WHEN** the user selects a vehicle from the Chọn xe dropdown
- **THEN** loaiXe, bienSo, hanDangKiem, hanBaoHiem, and hanCaVet inputs are populated from the vehicle and become disabled

#### Scenario: Submitting form with dropdown selections sends text values

- **WHEN** the user selects a driver and vehicle from dropdowns and submits the form
- **THEN** the API request body contains `tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, and date fields as plain text/date strings — no driverId or vehicleId is sent
