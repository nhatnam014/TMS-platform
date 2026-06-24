## ADDED Requirements

### Requirement: Bảo dưỡng xe import maps current km and notes columns

The bảo dưỡng xe import parser SHALL detect a "KM HIỆN TẠI" header column (case-insensitive, diacritics-tolerant) and map its value to `VehicleRecord.kmHienTai`. It SHALL also detect a "Ghi chú" header column (case-insensitive) and map its value to `VehicleRecord.ghiChuBaoDuong`. The "Ghi chú" header for bảo dưỡng xe import SHALL NOT be confused with, and SHALL NOT write to, the unrelated `VehicleRecord.ghiChu` field used by the quản lý xe import.

Both columns apply to both create (no ID) and update (with ID) rows, following the same optional/nullable handling as `donViSuaChua`.

#### Scenario: KM HIỆN TẠI value is imported on create

- **WHEN** an import row with no ID cell has a value in the "KM HIỆN TẠI" column
- **THEN** a new `VehicleRecord` is created with `kmHienTai` set to that value

#### Scenario: Ghi chú value is imported on update

- **WHEN** an import row has a valid VehicleRecord ID and a value in the "Ghi chú" column
- **THEN** the existing `VehicleRecord.ghiChuBaoDuong` is updated to that value; `VehicleRecord.ghiChu` is left unchanged

#### Scenario: Missing columns are treated as null

- **WHEN** the import file has no "KM HIỆN TẠI" or "Ghi chú" column
- **THEN** `kmHienTai` and `ghiChuBaoDuong` are left unset (null on create; unchanged on update)

#### Scenario: Column order does not affect mapping

- **WHEN** the "KM HIỆN TẠI" and "Ghi chú" columns appear in a different position than the export template (e.g., next to each other instead of separated by km-round columns)
- **THEN** the parser still correctly maps each value by header name, independent of column position
