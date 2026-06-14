## Requirements

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

The `CreateTripModal` in the trip plans web page SHALL include a cost entry section below the existing route/location fields. The section SHALL render one row per cost slot (8 fixed + 1 free-form). Each fixed slot cell SHALL contain: the cost slot label (display only), a formatted amount text input, and optionally an SHĐ text input. There SHALL be NO dropdown or select input in any cost slot. The free-form slot (CHI PHÍ PHÁT SINH KHÁC) SHALL additionally have a name text input. All fields are optional. Unset slots are not submitted.

#### Scenario: No dropdowns in cost section

- **WHEN** the user opens the CreateTripModal
- **THEN** the cost section contains no `<select>` elements — only text inputs (amount, SHĐ, and free-form name for the last slot)

#### Scenario: Entering amount in a fixed slot submits hardcoded name

- **WHEN** the user enters 500000 in the PHÍ HẠ slot and submits
- **THEN** the POST body includes `phiHaName: "PHÍ HẠ"` and `phiHaAmount: 500000`

#### Scenario: Empty slot is not submitted

- **WHEN** the user leaves a cost slot amount empty
- **THEN** the corresponding name and amount fields are omitted from the POST body

#### Scenario: Cost data is submitted inline with the trip plan create request

- **WHEN** the user fills in two cost slots and submits the form
- **THEN** the form POST includes both slots' hardcoded name, amount, and SHĐ (where applicable) alongside the other trip plan fields

---

### Requirement: TripPlanCost schema — tripCostId removed

The `TripPlanCost` entity SHALL have `costName String?`, `amount Decimal`, and `invoiceNumber String?` fields. The `tripCostId` FK field and the `TripCost` relation SHALL be removed from the model. The `trip_plan_costs` table SHALL NOT contain a `trip_cost_id` column.

#### Scenario: TripPlanCost row created with only costName, amount, invoiceNumber

- **WHEN** a TripPlanCost row is created by the import service
- **THEN** the row has `costName`, `amount`, and optionally `invoiceNumber` — no `tripCostId`

---

### Requirement: Trip plan response cost breakdown excludes tripCostId

The `costs` array in `GET /api/v1/trip-plans` responses SHALL contain items with shape `{ id, costName, amount, invoiceNumber }`. The `tripCostId` field SHALL NOT appear in the response.

#### Scenario: TripPlan with costs returns cost array without tripCostId

- **WHEN** a trip plan has two TripPlanCost rows
- **THEN** the response `costs` array items have `{ id, costName, amount, invoiceNumber }` — no `tripCostId` field

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
