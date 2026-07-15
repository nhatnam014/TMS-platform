## ADDED Requirements

### Requirement: TripPlan stores 7 additional amount-only revenue/cost fields

The `TripPlan` entity SHALL have 7 new nullable `Decimal(15,2)` columns: LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE. Unlike the existing 8 fixed cost slots, these fields have no companion name or SHĐ (invoice number) column — each is a single amount value with a fixed, non-editable label.

| Field      | DB column           |
| ---------- | -------------------- |
| LƯƠNG      | `luong_amount`        |
| CƯỚC       | `cuoc_amount`          |
| DOANH THU  | `doanh_thu_amount`     |
| PHỤ THU    | `phu_thu_amount`       |
| CHI PHÍ    | `chi_phi_amount`       |
| TIỀN DẦU   | `tien_dau_amount`      |
| NEO XE     | `neo_xe_amount`        |

#### Scenario: Trip plan created with the new fields is persisted

- **WHEN** a trip plan is created with `{ luongAmount: 3000000, doanhThuAmount: 15000000 }`
- **THEN** the `trip_plans` row has `luong_amount = 3000000` and `doanh_thu_amount = 15000000`

#### Scenario: Trip plan created without the new fields stores NULLs

- **WHEN** a trip plan is created without any of the 7 new fields
- **THEN** all 7 new columns on the row are NULL

---

### Requirement: CreateTripPlanDto/UpdateTripPlanDto accept the 7 new fields as optional positive numbers

`POST /api/v1/trip-plans` and `PUT /api/v1/trip-plans/:id` SHALL accept `luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount` as optional numeric fields, validated the same way as the existing fixed-slot amount fields (e.g. `phiNangAmount`): optional, numeric, and rejected if zero or negative.

#### Scenario: Create with partial new fields

- **WHEN** a request body includes `cuocAmount` and `tienDauAmount` but omits the other 5 new fields
- **THEN** the API returns HTTP 201 and only `cuoc_amount` and `tien_dau_amount` are populated

#### Scenario: Zero or negative amount is rejected

- **WHEN** a request body includes `neoXeAmount: 0` or a negative value
- **THEN** the API returns HTTP 400

#### Scenario: Update persists a new field on an existing trip plan

- **WHEN** `PUT /api/v1/trip-plans/:id` is called with `{ phuThuAmount: 200000 }` on an existing row
- **THEN** the row's `phu_thu_amount` is updated to `200000` and other fields are unchanged

---

### Requirement: Trip plan create/edit form includes 7 new amount-only cost slots

The `CreateTripModal`/`EditTripModal` cost section (the "Chi phí chuyến" grid) SHALL be extended with 7 new cells appended immediately after the CẦU ĐƯỜNG cell, in this fixed order: LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE. Each new cell SHALL contain only the field's label (display only, not editable) and a formatted amount text input — no name input and no SHĐ input, unlike the 8 existing fixed slots. All 7 fields are optional. Unset fields are not submitted.

#### Scenario: 7 new cells appear after CẦU ĐƯỜNG

- **WHEN** the user opens the CreateTripModal or EditTripModal
- **THEN** the cost section shows LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE cells, in that order, immediately after the CẦU ĐƯỜNG cell

#### Scenario: New cells have no name or SHĐ input

- **WHEN** the user inspects one of the 7 new cost cells
- **THEN** it contains only a label and a single amount text input — no name input, no SHĐ input

#### Scenario: Entering an amount submits the corresponding field

- **WHEN** the user enters 3000000 in the LƯƠNG cell and submits
- **THEN** the POST/PUT body includes `luongAmount: 3000000`

#### Scenario: Empty new field is not submitted

- **WHEN** the user leaves one of the 7 new cost cells empty
- **THEN** the corresponding field is omitted from the POST/PUT body

#### Scenario: Edit form pre-fills existing values

- **WHEN** the user opens the EditTripModal for a trip plan with `doanhThuAmount = 15000000`
- **THEN** the DOANH THU cell is pre-filled with the formatted value `15,000,000`
