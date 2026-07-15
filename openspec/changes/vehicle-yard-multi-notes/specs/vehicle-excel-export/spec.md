## ADDED Requirements

### Requirement: Exported "GHI CHÚ" column joins multiple notes into one cell

The "quản lý xe" export's "GHI CHÚ" column SHALL contain all of a `VehicleRecord`'s `VehicleRecordNote` entries, oldest first, joined with a newline (`\n`) separator, in a single cell — no new columns are added, and no existing column's position changes. A record with zero notes SHALL produce an empty "GHI CHÚ" cell.

#### Scenario: Single note exports as before

- **WHEN** a `VehicleRecord` has exactly one `VehicleRecordNote` with content "Cần thay lốp"
- **THEN** the "GHI CHÚ" cell for that row contains exactly "Cần thay lốp"

#### Scenario: Multiple notes join with newlines

- **WHEN** a `VehicleRecord` has `VehicleRecordNote` entries "Cần thay lốp" and "Đã kiểm tra phanh", created in that order
- **THEN** the "GHI CHÚ" cell contains "Cần thay lốp\nĐã kiểm tra phanh"

#### Scenario: Zero notes exports an empty cell

- **WHEN** a `VehicleRecord` has no `VehicleRecordNote` entries
- **THEN** the "GHI CHÚ" cell for that row is empty
