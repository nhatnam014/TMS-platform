## MODIFIED Requirements

### Requirement: Bảo dưỡng xe import creates or updates VehicleRecord based on ID column

The system SHALL process the bảo dưỡng xe import at `POST /api/import/vehicle-maintenance`. For each data row:

- **If the row has a non-empty ID cell**: find the `VehicleRecord` by that ID. If found, UPDATE its `donViSuaChua`, `ngayLam`, `bienSo`, `tenTaiXe`, `sdt`, `loaiXe` fields. If not found, skip the row and record a warning.
- **If the row has no ID cell or the ID cell is empty**: CREATE a new `VehicleRecord` with `bienSo`, `tenTaiXe`, `sdt`, `loaiXe`, `donViSuaChua`, `ngayLam` mapped from the row.

After creating or resolving the `VehicleRecord`, the system SHALL upsert all detected km round values into `vehicle_maintenance_km_rounds` using `(vehicleRecordId, roundNumber)` as the upsert key.

#### Scenario: Row with ID updates existing VehicleRecord and upserts km rounds

- **WHEN** an import row contains a valid VehicleRecord ID and km values for rounds 1 and 2
- **THEN** the VehicleRecord's maintenance fields are updated and rounds 1 and 2 are upserted in the km rounds table

#### Scenario: Row without ID creates new VehicleRecord

- **WHEN** an import row has no ID column or an empty ID cell
- **THEN** a new VehicleRecord is created with fields from the row; km rounds are created for any detected km columns

#### Scenario: Row with unknown ID is skipped with warning

- **WHEN** an import row has an ID that does not match any VehicleRecord
- **THEN** the row is skipped; the import response includes a warning identifying the row number and the unrecognised ID

#### Scenario: Idempotent re-import updates rather than duplicates

- **WHEN** the same Excel file is imported twice
- **THEN** the second import updates existing records and km rounds without creating duplicates

---

### Requirement: Km column detection is dynamic from headers

The system SHALL detect km columns in the import file by scanning header cells for the pattern `KM CÒN ... LẦN {n}` (case-insensitive, ignoring diacritics variation like DƯỠNG/DUONG). The detected column index maps to `roundNumber = n`. The maximum `n` detected determines how many km round columns are parsed per row.

#### Scenario: Detects standard header pattern

- **WHEN** the header row contains "KM CÒN DƯỜNG LẦN1", "KM CÒN DƯỜNG LẦN 2", "KM CÒN LẦN3"
- **THEN** the parser extracts roundNumbers 1, 2, 3 for those columns

#### Scenario: Missing km column is treated as no round data for that position

- **WHEN** a row has a value in the LẦN 1 column but no value in LẦN 2 column
- **THEN** only round 1 is upserted for that vehicle; round 2 is not created

#### Scenario: File with no km columns imports only vehicle fields

- **WHEN** the import file has no km column headers detected
- **THEN** VehicleRecords are still created or updated; no km round rows are created

---

### Requirement: Import maps standard bảo dưỡng xe columns by header name

The system SHALL map columns using header name matching (case-insensitive) for: SỐ XE / BIỂN SỐ → `bienSo`; TÀI XẾ / HỌ TÊN → `tenTaiXe`; PHONE / SĐT → `sdt`; LOẠI XE → `loaiXe`; ĐƠN VỊ SỬA CHỮA / ĐƠN VỊ BẢO DƯỠNG → `donViSuaChua`; NGÀY LÀM → `ngayLam`; ID → `id`. Sheet name is NOT used as loaiXe (unlike the old import behaviour).

#### Scenario: Column mapping works regardless of column order

- **WHEN** the import file has columns in a different order than the export template
- **THEN** the parser correctly maps each value using header name matching

#### Scenario: Missing optional column is treated as null

- **WHEN** the import file has no ĐƠN VỊ SỬA CHỮA column
- **THEN** `donViSuaChua` is set to `null` for all created/updated records
