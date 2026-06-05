## MODIFIED Requirements

### Requirement: Create trip plan via modal form

The trip plans page SHALL provide a "Tạo chuyến" button that opens a modal form. On submit, the form SHALL call `POST /api/trip-plans` and refresh the list on success.

The modal SHALL be ~980px wide (capped at 95vw) and organized into four horizontal sections to minimize vertical scrolling:

**Section row 1 — three columns side by side:**

- **Chuyến đi** (left, wider): Trip date (required), Service type (required), Vehicle (required), Customer (required), Carrier (optional)
- **Container** (center): Container size (optional), Outbound container number (optional), Inbound container number (optional)
- **Địa điểm** (right): Pickup location (optional), Load/unload location (optional), Drop-off location (optional)

**Section row 2 — Chi phí (2×4 grid, full width):**
Eight cost slots arranged in 2 columns × 4 rows. Each cell contains the cost slot label, a select input (cost type), an amount input, and optionally an SHĐ input. Left-to-right pairing:

- Row 1: PHÍ NÂNG · PHÍ HẠ
- Row 2: PHÍ VỆ SINH · PHÍ CƯỢC
- Row 3: VÉ CỔNG · CHI PHÍ KHÁC / PHÍ ĐỨT TEM
- Row 4: TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM · CẦU ĐƯỜNG

**Section row 3 — Bổ sung (single row, full width):**

- Document sent date (Ngày gửi CT), Description (Nội dung), Notes (Ghi chú) — all on one horizontal row.

All fields and submission behavior remain unchanged from the previous version.

#### Scenario: Successful trip creation

- **WHEN** the user fills required fields and submits
- **THEN** `POST /api/trip-plans` is called, the modal closes, and the list refreshes

#### Scenario: Form includes containerSize and description fields

- **WHEN** the user opens the create trip modal
- **THEN** fields for container size (SIZE CONT) and description (NỘI DUNG) are visible in the Container section

#### Scenario: Validation prevents empty required fields

- **WHEN** the user submits without filling required fields
- **THEN** the form shows inline validation errors and does not submit

#### Scenario: API error on create

- **WHEN** the API returns an error on submit
- **THEN** an error message is displayed inside the modal

#### Scenario: Form sections are side by side without horizontal scroll

- **WHEN** the user opens the create trip modal on a desktop viewport (≥ 980px)
- **THEN** Chuyến đi, Container, and Địa điểm sections are visible simultaneously in a single horizontal row without any horizontal scrollbar

#### Scenario: Cost slots visible without scrolling

- **WHEN** the user opens the create trip modal
- **THEN** all 8 cost slots are visible in the 2×4 grid without vertical scrolling past the bottom of the form
