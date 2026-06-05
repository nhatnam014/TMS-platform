## ADDED Requirements

### Requirement: TripPlan stores 9 fixed cost slots as name+amount snapshots

The `TripPlan` entity SHALL have 20 new nullable columns representing 9 fixed cost slots. Each slot MUST store a name snapshot (`String?`) and an amount (`Decimal(15,2)?`). Slots with an associated invoice number (SHĐ) MUST additionally store a `String?` SHĐ column. All columns are optional.

The 9 slots and their columns:

| Slot                                       | name col                  | amount col                  | shd col       |
| ------------------------------------------ | ------------------------- | --------------------------- | ------------- |
| PHÍ NÂNG                                   | `phi_nang_name`           | `phi_nang_amount`           | `shd_nang`    |
| PHÍ HẠ                                     | `phi_ha_name`             | `phi_ha_amount`             | `shd_ha`      |
| PHÍ VỆ SINH                                | `phi_ve_sinh_name`        | `phi_ve_sinh_amount`        | `shd_ve_sinh` |
| PHÍ CƯỢC                                   | `phi_cuoc_name`           | `phi_cuoc_amount`           | —             |
| VÉ CỔNG                                    | `ve_cong_name`            | `ve_cong_amount`            | `shd_ve_cong` |
| CHI PHÍ KHÁC / PHÍ ĐỨT TEM                 | `chi_phi_khac_name`       | `chi_phi_khac_amount`       | —             |
| CHI PHÍ TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM     | `chi_phi_trai_tuyen_name` | `chi_phi_trai_tuyen_amount` | —             |
| CẦU ĐƯỜNG                                  | `cau_duong_name`          | `cau_duong_amount`          | —             |
| CHI PHÍ PHÁT SINH KHÁC (THANH LÝ - CHI HỘ) | `chi_phi_phat_sinh_name`  | `chi_phi_phat_sinh_amount`  | —             |

#### Scenario: Trip plan created with cost slots is persisted

- **WHEN** a trip plan is created with `{ phiNangName: "PHÍ NÂNG", phiNangAmount: 1200000, shdNang: "HD001" }`
- **THEN** the `trip_plans` row has `phi_nang_name = "PHÍ NÂNG"`, `phi_nang_amount = 1200000`, `shd_nang = "HD001"`

#### Scenario: Trip plan created without any cost slots stores NULLs

- **WHEN** a trip plan is created without any cost slot fields
- **THEN** all 20 cost-slot columns on the row are NULL

#### Scenario: Deleting a TripCost catalog item does not affect stored slot data

- **WHEN** a TripCost catalog item is deleted after a trip plan was saved referencing its name
- **THEN** the TripPlan row's cost columns retain their snapshot values unchanged

---

### Requirement: CreateTripPlanDto accepts optional cost slot fields

`POST /api/v1/trip-plans` SHALL accept all 9 cost slot fields as optional in the request body. Amount fields are numeric (`number`); name and SHĐ fields are strings.

#### Scenario: Create with partial cost slots

- **WHEN** a request body includes `phiNangName`, `phiNangAmount`, and `shdNang` but omits all other slots
- **THEN** the API returns HTTP 201 and only the PHÍ NÂNG columns are populated

#### Scenario: Cost slot without amount is accepted

- **WHEN** a request body includes only `phiNangName` without `phiNangAmount`
- **THEN** the API returns HTTP 201 and `phi_nang_name` is stored; `phi_nang_amount` is NULL

#### Scenario: Negative or zero cost amounts are rejected

- **WHEN** a request body includes `phiNangAmount: 0` or a negative value
- **THEN** the API returns HTTP 400

---

### Requirement: Trip plan create form includes a structured cost entry section

The `CreateTripModal` in the trip plans web page SHALL include a cost entry section below the existing route/location fields. The section SHALL render one row per cost slot, each containing:

- A dropdown (`<select>`) populated from `GET /api/trip-costs` (active items only), with a blank/empty option.
- An amount number input. When a TripCost item is selected and that item has a non-null `amount`, the amount input SHALL auto-fill with the catalog value (editable by user).
- An SHĐ text input (for slots that have one).

All fields are optional. Unselected slots are not submitted.

#### Scenario: Dropdowns are populated from TripCost catalog

- **WHEN** the CreateTripModal opens
- **THEN** each cost slot dropdown contains one option per active TripCost item returned by `GET /api/trip-costs`, plus a blank/empty first option

#### Scenario: Selecting a TripCost item auto-fills the amount

- **WHEN** the user selects a TripCost item that has `amount: 1200000`
- **THEN** the amount input for that slot is set to `1200000` (user can still override)

#### Scenario: Selecting the blank option clears the slot

- **WHEN** the user selects the blank option in a cost slot dropdown
- **THEN** the name and amount fields for that slot are cleared and not submitted

#### Scenario: Cost data is submitted inline with the trip plan create request

- **WHEN** the user fills in two cost slots and submits the form
- **THEN** the form POST includes both slots' name, amount, and SHĐ (where applicable) alongside the other trip plan fields

---

### Requirement: Trip plan response includes all fixed cost slot fields

`GET /api/v1/trip-plans` and `GET /api/v1/trip-plans/:id` responses SHALL include all 9 fixed cost slot fields. Null slots are returned as `null`.

#### Scenario: Response includes cost slot fields

- **WHEN** a trip plan has `phi_nang_amount = 1200000` and all other slots NULL
- **THEN** the response JSON contains `phiNangAmount: 1200000` and all other slot fields as `null`

---

### Requirement: Trip plan create form includes NGÀY GỬI CT and NỘI DUNG fields

The `CreateTripModal` SHALL expose the existing `documentSentDate` (NGÀY GỬI CT, date input) and `description` (NỘI DUNG, text input) fields that are already on the schema but were not in the original create form.

#### Scenario: NGÀY GỬI CT is submitted with the create request

- **WHEN** the user fills in the NGÀY GỬI CT date field and submits
- **THEN** the POST body includes `documentSentDate` and it is persisted on the TripPlan row

#### Scenario: NỘI DUNG is submitted with the create request

- **WHEN** the user fills in the NỘI DUNG text field and submits
- **THEN** the POST body includes `description` and it is persisted on the TripPlan row
