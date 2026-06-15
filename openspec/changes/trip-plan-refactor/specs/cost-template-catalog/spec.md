## ADDED Requirements

### Requirement: CostTemplate master table stores cost name suggestions

The system SHALL have a `cost_templates` table with columns: `id` (cuid PK), `name` (String), `defaultAmount` (Decimal(15,2), nullable), `isActive` (Boolean, default true), `createdAt`, `updatedAt`. This table is a suggestion-only catalog; no FK from `TripPlan` to `cost_templates` exists. Cost names and amounts on `TripPlan` are stored as plain strings/decimals (denormalized snapshots).

#### Scenario: cost_templates table created with correct schema

- **WHEN** the database migration runs
- **THEN** `cost_templates` table exists with columns `id`, `name`, `default_amount`, `is_active`, `created_at`, `updated_at`

#### Scenario: cost_templates has no FK from trip_plans

- **WHEN** a cost template is deleted
- **THEN** existing TripPlan cost slot values are unaffected (no cascade)

---

### Requirement: Cost template CRUD API

The API SHALL expose four endpoints requiring JWT authentication:

- `GET /api/cost-templates` — returns all cost templates ordered by `name`, shape `{ id, name, defaultAmount, isActive }`; supports optional `?q=<search>` for live-search filtering by name
- `POST /api/cost-templates` — creates a new template; body `{ name: string, defaultAmount?: number }`. Returns HTTP 201.
- `PATCH /api/cost-templates/:id` — updates `name`, `defaultAmount`, or `isActive`. Returns HTTP 200.
- `DELETE /api/cost-templates/:id` — hard-deletes the record (no FK constraint to check). Returns HTTP 200.

#### Scenario: GET returns all templates ordered by name

- **WHEN** `GET /api/cost-templates` is called
- **THEN** HTTP 200 is returned with an array ordered by `name`

#### Scenario: GET with q parameter filters by name

- **WHEN** `GET /api/cost-templates?q=nâng` is called
- **THEN** only templates whose `name` contains "nâng" (case-insensitive) are returned

#### Scenario: POST creates new template

- **WHEN** `POST /api/cost-templates` is called with `{ name: "PHÍ NÂNG", defaultAmount: 250000 }`
- **THEN** HTTP 201 is returned and a new row exists

#### Scenario: DELETE always succeeds

- **WHEN** `DELETE /api/cost-templates/:id` is called
- **THEN** HTTP 200 is returned and the record is removed regardless of any prior combobox selections

---

### Requirement: Cost template management page

The web app SHALL provide a `/cost-templates` page (label: "Danh mục chi phí") listing all cost templates with columns: Name, Default Amount, Active, Actions. A "Thêm chi phí" button opens a modal with Name and Default Amount fields. The nav sidebar SHALL include a link to `/cost-templates`.

#### Scenario: Page lists all cost templates

- **WHEN** the user navigates to `/cost-templates`
- **THEN** a table shows all cost templates with Name and Default Amount columns

#### Scenario: Create new cost template

- **WHEN** the user fills Name = "CẦU ĐƯỜNG" and Default Amount = 150000 and submits
- **THEN** `POST /api/cost-templates` is called and the new template appears in the table

#### Scenario: Edit cost template default amount

- **WHEN** the user clicks "Sửa" and updates the Default Amount
- **THEN** `PATCH /api/cost-templates/:id` is called and the new amount is displayed

---

### Requirement: Cost slot name fields use combobox backed by cost_templates

All cost slot name fields in the trip plan create and edit modal SHALL use a `Combobox` component instead of a plain text input or hardcoded label. The combobox behavior is:

1. On focus/click, the dropdown opens and shows ALL active cost templates from `GET /api/cost-templates`
2. As the user types, the dropdown filters to templates whose name contains the typed text (case-insensitive)
3. If the user selects a template:
   - The name field is populated with the template's `name`
   - The amount field is populated with the template's `defaultAmount` and becomes **read-only** (locked)
4. If the user types without selecting (no match chosen):
   - The typed text is used as the cost slot name
   - The amount field remains editable
5. Pressing Escape or clicking outside closes the dropdown without changing the current value

The 8 fixed slots (PHÍ NÂNG, PHÍ HẠ, PHÍ VỆ SINH, PHÍ CƯỢC, VÉ CỔNG, CHI PHÍ KHÁC/PHÍ ĐỨT TEM, TRÁI TUYẾN/CHỈ ĐỊNH/BP CAM, CẦU ĐƯỜNG) each have a combobox for their name. The SHĐ field (where applicable) remains a plain text input and is always editable.

#### Scenario: Combobox shows all templates on click

- **WHEN** the user clicks a cost slot name field
- **THEN** a dropdown appears listing all active cost templates from the API

#### Scenario: Typing filters the template list

- **WHEN** the user types "phí" into a cost slot name combobox
- **THEN** the dropdown narrows to only templates whose name contains "phí" (case-insensitive)

#### Scenario: Selecting template autofills and locks amount

- **WHEN** the user selects the "PHÍ NÂNG" template with defaultAmount 250000
- **THEN** the name field shows "PHÍ NÂNG" and the amount field shows 250,000 and is read-only

#### Scenario: Free-text entry keeps amount editable

- **WHEN** the user types "Phí đặc biệt" and does not select any template from the dropdown
- **THEN** the name field holds "Phí đặc biệt" and the amount field remains editable

#### Scenario: Clearing name clears amount lock

- **WHEN** the user selects a template (amount locked) then clears the name field
- **THEN** the amount field becomes editable again
