## MODIFIED Requirements

### Requirement: TripPlan stores 8 fixed cost slots as name+amount snapshots

The `TripPlan` entity SHALL have 18 nullable columns representing **8 fixed cost slots** (down from 9 — the `chiPhiPhatSinh` slot is removed). Each slot stores a name snapshot (`String?`) and an amount (`Decimal(15,2)?`). Slots with SHĐ additionally store a `String?` SHĐ column.

The `chi_phi_phat_sinh_name` and `chi_phi_phat_sinh_amount` columns SHALL be removed from `trip_plans`. Existing data in those columns SHALL be migrated to `TripPlanCost` rows (see design.md migration plan).

The 8 remaining slots and their columns:

| Slot                                   | name col                  | amount col                  | shd col       |
| -------------------------------------- | ------------------------- | --------------------------- | ------------- |
| PHÍ NÂNG                               | `phi_nang_name`           | `phi_nang_amount`           | `shd_nang`    |
| PHÍ HẠ                                 | `phi_ha_name`             | `phi_ha_amount`             | `shd_ha`      |
| PHÍ VỆ SINH                            | `phi_ve_sinh_name`        | `phi_ve_sinh_amount`        | `shd_ve_sinh` |
| PHÍ CƯỢC                               | `phi_cuoc_name`           | `phi_cuoc_amount`           | —             |
| VÉ CỔNG                                | `ve_cong_name`            | `ve_cong_amount`            | `shd_ve_cong` |
| CHI PHÍ KHÁC / PHÍ ĐỨT TEM             | `chi_phi_khac_name`       | `chi_phi_khac_amount`       | —             |
| CHI PHÍ TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM | `chi_phi_trai_tuyen_name` | `chi_phi_trai_tuyen_amount` | —             |
| CẦU ĐƯỜNG                              | `cau_duong_name`          | `cau_duong_amount`          | —             |

#### Scenario: Trip plan created with 8 cost slots persisted

- **WHEN** a trip plan is created with `{ phiNangName: "PHÍ NÂNG", phiNangAmount: 1200000, shdNang: "HD001" }`
- **THEN** the `trip_plans` row has `phi_nang_name = "PHÍ NÂNG"`, `phi_nang_amount = 1200000`, `shd_nang = "HD001"`

#### Scenario: chi_phi_phat_sinh columns do not exist

- **WHEN** inspecting the `trip_plans` table schema after migration
- **THEN** columns `chi_phi_phat_sinh_name` and `chi_phi_phat_sinh_amount` are absent

---

### Requirement: CreateTripPlanDto accepts 8 fixed cost slot fields and TripPlanCost rows

`POST /api/trip-plans` SHALL accept the 8 fixed cost slot fields as optional in the request body. The `chiPhiPhatSinhName` and `chiPhiPhatSinhAmount` fields SHALL NOT be accepted (removed). The body SHALL additionally accept an optional `otherCosts` array of `{ costName?: string, amount: number, invoiceNumber?: string }` objects which create `TripPlanCost` rows.

#### Scenario: Create with partial cost slots

- **WHEN** a request body includes `phiNangName`, `phiNangAmount`, and `shdNang` only
- **THEN** the API returns HTTP 201 and only the PHÍ NÂNG columns are populated

#### Scenario: Create with otherCosts array creates TripPlanCost rows

- **WHEN** a request body includes `otherCosts: [{ costName: "Phí đặc biệt", amount: 100000 }]`
- **THEN** the API returns HTTP 201 and one `TripPlanCost` row is created with `costName = "Phí đặc biệt"`, `amount = 100000`

#### Scenario: chiPhiPhatSinh fields are not accepted

- **WHEN** a request body includes `chiPhiPhatSinhName` or `chiPhiPhatSinhAmount`
- **THEN** those fields are ignored (not stored — no matching column exists)

---

### Requirement: Trip plan create and edit form uses combobox for cost slot names and multi-row other costs

The `CreateTripModal` and `EditTripModal` in the trip plans web page SHALL implement the following cost section behavior:

**Fixed cost slots (8 slots in 2×4 grid):**
Each slot cell SHALL contain:

- A `Combobox` component for the cost name field, backed by `GET /api/cost-templates` with live-search filtering
- When a template with `defaultAmount` is selected: amount field is populated and set read-only
- When no template is selected (free-text): amount field is editable
- An optional SHĐ plain text input (for PHÍ NÂNG, PHÍ HẠ, PHÍ VỆ SINH, VÉ CỔNG)

**Chi phí phát sinh section (multi-row):**
The section SHALL render a list of editable rows backed by the `otherCosts` array state. Each row contains:

- A `Combobox` for cost name (same cost-template live-search behavior)
- An amount number input (formatted, editable always — no lock behavior for other-cost rows)
- An SHĐ text input
- A × remove button

A "+ Thêm chi phí" button appends a new empty row. There is no maximum row limit.

On form submit, `otherCosts` rows are included in the POST/PATCH body alongside the 8 fixed slot fields.

#### Scenario: Selecting template in fixed slot autofills and locks amount

- **WHEN** the user selects "PHÍ HẠ" template with defaultAmount 200000 in the PHÍ HẠ slot
- **THEN** the PHÍ HẠ name field shows "PHÍ HẠ", amount shows 200,000 and is read-only

#### Scenario: Free text in fixed slot keeps amount editable

- **WHEN** the user types "Phí đặc biệt" in a cost slot without selecting a template
- **THEN** the amount field for that slot remains editable

#### Scenario: Other cost row is submitted as TripPlanCost

- **WHEN** the user adds one other-cost row with name "Phí xếp dỡ" and amount 80000 and submits
- **THEN** the POST body includes `otherCosts: [{ costName: "Phí xếp dỡ", amount: 80000 }]`

#### Scenario: Empty other-cost rows are not submitted

- **WHEN** the user clicks "+ Thêm chi phí" but leaves the row empty
- **THEN** the empty row is excluded from the `otherCosts` array in the POST body

#### Scenario: Edit modal pre-fills TripPlanCost rows as other-cost rows

- **WHEN** the user opens EditTripModal for a trip plan with 2 TripPlanCost rows
- **THEN** the chi phí phát sinh section shows 2 pre-filled rows with their costName and amount

---

### Requirement: Trip plan response includes 8 fixed cost slot fields and TripPlanCost array

`GET /api/trip-plans` and `GET /api/trip-plans/:id` responses SHALL include all 8 fixed cost slot fields and a `costs` array. The `chiPhiPhatSinhName` and `chiPhiPhatSinhAmount` fields SHALL NOT appear in the response. Null slots are returned as `null`.

#### Scenario: Response includes 8 cost slot fields without chiPhiPhatSinh

- **WHEN** `GET /api/trip-plans` is called
- **THEN** each item contains `phiNangName`, `phiNangAmount` … `cauDuongName`, `cauDuongAmount` but NOT `chiPhiPhatSinhName` or `chiPhiPhatSinhAmount`

#### Scenario: Response costs array includes other-cost rows

- **WHEN** a trip plan has 2 TripPlanCost rows
- **THEN** the response `costs` array contains 2 items with `{ id, costName, amount, invoiceNumber }`

---

## REMOVED Requirements

### Requirement: TripPlan stores 9th fixed cost slot — CHI PHÍ PHÁT SINH KHÁC

**Reason**: The CHI PHÍ PHÁT SINH KHÁC fixed slot (columns `chi_phi_phat_sinh_name`, `chi_phi_phat_sinh_amount`) is replaced by the multi-row `TripPlanCost` other-costs pattern.
**Migration**: Existing `chi_phi_phat_sinh_name`/`chi_phi_phat_sinh_amount` values are migrated to new `TripPlanCost` rows with `costName = chi_phi_phat_sinh_name` (or "CHI PHÍ PHÁT SINH KHÁC" if null) and `amount = chi_phi_phat_sinh_amount`.
