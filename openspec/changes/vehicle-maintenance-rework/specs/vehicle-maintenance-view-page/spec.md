## ADDED Requirements

### Requirement: Bảo dưỡng xe page shows all VehicleRecords

The system SHALL render the `/vehicle-maintenance` page as a view over `VehicleRecord`. ALL vehicle records SHALL appear on this page regardless of whether they have maintenance data set. A newly created or imported vehicle SHALL appear immediately on this page with `donViSuaChua = null`, `ngayLam = null`, and empty km round cells.

#### Scenario: New vehicle appears with empty maintenance data

- **WHEN** a VehicleRecord is created via the quản lý xe form or imported via Excel
- **THEN** it appears on the bảo dưỡng xe page with donViSuaChua blank, ngayLam blank, and all km round cells empty

#### Scenario: All records shown regardless of maintenance fill

- **WHEN** the bảo dưỡng xe page loads
- **THEN** vehicles with no km rounds and vehicles with multiple km rounds both appear in the same table

---

### Requirement: Km column count scales dynamically per pagination batch

The system SHALL determine the number of km columns to display based on the current pagination batch: `colCount = max(4, maxRoundNumber)` where `maxRoundNumber` is the highest `roundNumber` found across all vehicle records in the current page. The column headers SHALL be labeled "KM CÒN LẦN 1", "KM CÒN LẦN 2", ..., "KM CÒN LẦN {colCount}".

#### Scenario: Default 4 columns when no km data

- **WHEN** all records on the current page have zero km rounds
- **THEN** the table renders 4 km columns (all cells empty)

#### Scenario: Columns expand to max round in batch

- **WHEN** the current page contains at least one record with roundNumber = 6
- **THEN** the table renders 6 km columns

#### Scenario: Records with fewer rounds show empty cells

- **WHEN** a record has only 2 km rounds but colCount is 5
- **THEN** that record's cells for rounds 3, 4, 5 are rendered as empty

---

### Requirement: Edit modal for maintenance fields and km rounds

The system SHALL provide an edit modal accessible from each row in the bảo dưỡng xe table. The modal SHALL contain:
- Editable field: `donViSuaChua` (Đơn vị sửa chữa)
- Editable field: `ngayLam` (Ngày làm) — date picker
- A list of existing km rounds (each showing roundNumber and kmCon with a delete button)
- An "Add rounds" section allowing the user to input multiple new `{roundNumber, kmCon}` pairs at once before submitting

Saving the modal SHALL PATCH the vehicle record's maintenance fields and batch-upsert km rounds in a single user action (two API calls sequentially: PATCH then PUT).

#### Scenario: Edit modal opens with current data

- **WHEN** user opens the edit modal for a vehicle with donViSuaChua="Gara ABC" and 2 km rounds
- **THEN** the modal shows the filled donViSuaChua field and two km round rows

#### Scenario: Add multiple km rounds at once

- **WHEN** user inputs round 3 = 270000 and round 4 = 280000 in the "add" section and saves
- **THEN** both rounds are created via the batch upsert endpoint; the table refreshes with updated data

#### Scenario: Delete a km round from modal

- **WHEN** user clicks delete on round 2 in the modal and confirms
- **THEN** round 2 is removed via DELETE endpoint; the modal refreshes the round list

#### Scenario: Save with no km round changes still updates maintenance fields

- **WHEN** user edits only donViSuaChua and saves
- **THEN** donViSuaChua is updated on the vehicle record; km rounds are unchanged

---

### Requirement: Bảo dưỡng xe table column order

The system SHALL render the table with the following column order: STT, SỐ XE (bienSo), Tài xế (tenTaiXe), PHONE (sdt), NGÀY LÀM (ngayLam), LOẠI XE (loaiXe), ĐƠN VỊ SỬA CHỮA (donViSuaChua), KM CÒN LẦN 1 ... KM CÒN LẦN {colCount}, action menu.

#### Scenario: Columns match specification order

- **WHEN** the bảo dưỡng xe page loads
- **THEN** the first 7 columns are STT, SỐ XE, Tài xế, PHONE, NGÀY LÀM, LOẠI XE, ĐƠN VỊ SỬA CHỮA in that order, followed by km columns, followed by action menu

---

### Requirement: Pagination and search on bảo dưỡng xe page

The system SHALL support search (by bienSo, tenTaiXe, loaiXe, donViSuaChua) and pagination (page/limit) using the same mechanism as the quản lý xe page. The search query is passed to `GET /api/vehicle-maintenance` which proxies the vehicle record query.

#### Scenario: Search filters by bienSo

- **WHEN** user types a partial bienSo in the search box
- **THEN** only vehicle records matching that bienSo are shown

#### Scenario: Pagination changes the column count independently

- **WHEN** page 1 has a record with 6 km rounds and page 2 has only records with 1 km round
- **THEN** page 1 renders 6 km columns and page 2 renders 4 km columns (minimum)
