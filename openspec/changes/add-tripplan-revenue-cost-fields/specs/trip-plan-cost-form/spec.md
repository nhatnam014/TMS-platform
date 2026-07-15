## ADDED Requirements

### Requirement: TripPlan stores 7 additional revenue/cost fields, each with an editable name and SHĐ

The `TripPlan` entity SHALL have 7 new nullable `Decimal(15,2)` amount columns, 7 new nullable `String` name columns, and 7 new nullable `String` SHĐ (invoice number) columns: LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE. Like the 4 SHĐ-bearing existing fixed cost slots (`phiNang`, `phiHa`, `phiVeSinh`, `veCong`), each of these 7 has a full name + amount + SHĐ triple.

| Field      | DB amount column      | DB name column      | DB SHĐ column        |
| ---------- | ---------------------- | -------------------- | ---------------------- |
| LƯƠNG      | `luong_amount`          | `luong_name`          | `shd_luong`             |
| CƯỚC       | `cuoc_amount`            | `cuoc_name`            | `shd_cuoc`               |
| DOANH THU  | `doanh_thu_amount`       | `doanh_thu_name`       | `shd_doanh_thu`          |
| PHỤ THU    | `phu_thu_amount`         | `phu_thu_name`         | `shd_phu_thu`            |
| CHI PHÍ    | `chi_phi_amount`         | `chi_phi_name`         | `shd_chi_phi`            |
| TIỀN DẦU   | `tien_dau_amount`        | `tien_dau_name`        | `shd_tien_dau`           |
| NEO XE     | `neo_xe_amount`          | `neo_xe_name`          | `shd_neo_xe`             |

#### Scenario: Trip plan created with the new fields is persisted

- **WHEN** a trip plan is created with `{ luongAmount: 3000000, luongName: "Lương tài xế", shdLuong: "HD-001", doanhThuAmount: 15000000 }`
- **THEN** the `trip_plans` row has `luong_amount = 3000000`, `luong_name = "Lương tài xế"`, `shd_luong = "HD-001"`, and `doanh_thu_amount = 15000000`

#### Scenario: Trip plan created without the new fields stores NULLs

- **WHEN** a trip plan is created without any of the 7 new amount/name/SHĐ fields
- **THEN** all 21 new columns on the row are NULL

---

### Requirement: CreateTripPlanDto/UpdateTripPlanDto accept the 7 new amount, name, and SHĐ fields

`POST /api/v1/trip-plans` and `PUT /api/v1/trip-plans/:id` SHALL accept `luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount` as optional numeric fields, validated the same way as the existing fixed-slot amount fields (e.g. `phiNangAmount`): optional, numeric, and rejected if zero or negative. It SHALL also accept `luongName`/`cuocName`/`doanhThuName`/`phuThuName`/`chiPhiName`/`tienDauName`/`neoXeName` and `shdLuong`/`shdCuoc`/`shdDoanhThu`/`shdPhuThu`/`shdChiPhi`/`shdTienDau`/`shdNeoXe` as optional string fields, validated the same way as the existing fixed-slot name/SHĐ fields (e.g. `phiNangName`/`shdNang`): optional, string, no format restriction.

#### Scenario: Create with partial new fields

- **WHEN** a request body includes `cuocAmount` and `tienDauAmount` but omits the other 5 new amount fields
- **THEN** the API returns HTTP 201 and only `cuoc_amount` and `tien_dau_amount` are populated

#### Scenario: Zero or negative amount is rejected

- **WHEN** a request body includes `neoXeAmount: 0` or a negative value
- **THEN** the API returns HTTP 400

#### Scenario: Update persists a new field on an existing trip plan

- **WHEN** `PUT /api/v1/trip-plans/:id` is called with `{ phuThuAmount: 200000, phuThuName: "Phụ thu cuối tuần", shdPhuThu: "HD-045" }` on an existing row
- **THEN** the row's `phu_thu_amount` is updated to `200000`, `phu_thu_name` is updated to `"Phụ thu cuối tuần"`, `shd_phu_thu` is updated to `"HD-045"`, and other fields are unchanged

#### Scenario: Name and SHĐ can be set independently of amount

- **WHEN** `PUT /api/v1/trip-plans/:id` is called with `{ luongName: "Lương tháng", shdLuong: "HD-002" }` only
- **THEN** the row's `luong_name` and `shd_luong` are updated and `luong_amount` is unchanged

---

### Requirement: Trip plan create/edit form includes 7 new cost slots with select-or-type name and SHĐ input

The `CreateTripModal`/`EditTripModal` cost section (the "Chi phí chuyến" grid) SHALL be extended with 7 new cells appended immediately after the CẦU ĐƯỜNG cell, in this fixed order: LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE. Each new cell SHALL render the same cost-slot UI the 8 existing fixed slots use: a `Combobox` for the name (select from the `CostTemplate` catalog, or type free text), a formatted amount text input, and an SHĐ text input — full parity with the 4 SHĐ-bearing existing slots. All 7 fields (name, amount, SHĐ) are optional. Unset fields are not submitted. Selecting a `CostTemplate` option with a `defaultAmount` autofills the amount field, same as the existing slots' behavior.

#### Scenario: 7 new cells appear after CẦU ĐƯỜNG

- **WHEN** the user opens the CreateTripModal or EditTripModal
- **THEN** the cost section shows LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE cells, in that order, immediately after the CẦU ĐƯỜNG cell

#### Scenario: New cells have a name combobox, an amount input, and an SHĐ input

- **WHEN** the user inspects one of the 7 new cost cells
- **THEN** it contains a `Combobox` for the name, a single amount text input, and an SHĐ text input

#### Scenario: Selecting a cost template name autofills the amount

- **WHEN** the user selects a `CostTemplate` option with `defaultAmount = 3000000` in the LƯƠNG cell's combobox
- **THEN** the LƯƠNG amount field is autofilled with `3,000,000` and becomes read-only until the name is changed

#### Scenario: Typing a custom name is accepted

- **WHEN** the user types a name into the CƯỚC cell's combobox that doesn't match any `CostTemplate` option
- **THEN** that free-typed text is accepted as the value and the amount field remains editable

#### Scenario: Entering an amount submits the corresponding field

- **WHEN** the user enters 3000000 in the LƯƠNG amount field and submits
- **THEN** the POST/PUT body includes `luongAmount: 3000000`

#### Scenario: Entering a name submits the corresponding field

- **WHEN** the user types "Cước vận chuyển" in the CƯỚC cell's combobox and submits
- **THEN** the POST/PUT body includes `cuocName: "Cước vận chuyển"`

#### Scenario: Entering an SHĐ submits the corresponding field

- **WHEN** the user types "HD-100" into the NEO XE cell's SHĐ input and submits
- **THEN** the POST/PUT body includes `shdNeoXe: "HD-100"`

#### Scenario: Empty new field is not submitted

- **WHEN** the user leaves one of the 7 new cost cells' name, amount, and SHĐ empty
- **THEN** the corresponding fields are omitted from the POST/PUT body

#### Scenario: Edit form pre-fills existing values

- **WHEN** the user opens the EditTripModal for a trip plan with `doanhThuAmount = 15000000`, `doanhThuName = "Doanh thu chuyến"`, `shdDoanhThu = "HD-050"`
- **THEN** the DOANH THU cell's amount is pre-filled with `15,000,000`, the combobox is pre-filled with `"Doanh thu chuyến"`, and the SHĐ input is pre-filled with `"HD-050"`
