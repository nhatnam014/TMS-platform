## MODIFIED Requirements

### Requirement: Web UI — create/edit form with dynamic mooc list

The system SHALL provide a modal form for creating and editing vehicle records. All fields are plain text or date inputs (no dropdowns linked to existing entities).

The modal SHALL be ~820px wide (capped at 95vw) and organized into three horizontal sections to minimize vertical scrolling:

**Section row 1 — two columns side by side:**

- **Tài xế** (left): Tên tài xế (text, optional), SĐT (text, optional)
- **Thông tin xe** (right, wider): Loại xe (text, optional), Biển số (text, optional), Hạn đăng kiểm xe (date, optional), Hạn bảo hiểm xe (date, optional), Hạn cà vẹt xe (date, optional)

**Section row 2 — Mooc (full width):**
Dynamic list of mooc rows. Each mooc row displays all four inputs on a single horizontal line: Số mooc (text), Hạn ĐK (date, optional), Hạn BH (date, optional), Hạn CV (date, optional), and a remove button [×]. A "+ Thêm mooc" button appears below the list to add a new blank row.

**Section row 3 — Ghi chú (full width):**
A single textarea for notes (optional).

All field names, data types, nullability rules, and form submission behavior remain unchanged.

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
