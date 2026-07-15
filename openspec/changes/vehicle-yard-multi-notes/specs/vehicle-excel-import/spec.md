## MODIFIED Requirements

### Requirement: Parser handles the "quản lý xe" continuation-row structure for VehicleRecord

The system SHALL process the "quản lý xe" sheet rows as follows: a row where the STT column is non-empty and the data is structurally valid SHALL produce one `VehicleRecord` creation with any mooc present in the same row as its first `VehicleRecordMooc`. A row where the STT column is empty and `soMooc` is non-empty SHALL be treated as a mooc continuation and attached to the most recently created `VehicleRecord`. Rows that are empty or have no identifiable data SHALL be silently skipped. The parser SHALL extract all of: `tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, `hanCaVet` (vehicle), `soMooc`, `hanDangKiem` (mooc), `hanBaoHiem` (mooc), `hanCaVet` (mooc), and `ghiChuLines` — the "GHI CHÚ" cell's raw text split on newlines into a list of non-empty trimmed lines, one `VehicleRecordNote` per line.

The parser SHALL locate columns using the following header-name candidates (case-insensitive, after Unicode normalisation):

- **STT**: `"stt"`
- **Tên tài xế** → `tenTaiXe`: `"tên tx"`, `"ten tx"`, `"họ và tên"`, `"ho va ten"`, `"tên tài xế"`, `"họ tên"`
- **SĐT** → `sdt`: `"điện thoại"`, `"dien thoai"`, `"sdt"`, `"số điện thoại"`
- **Loại xe** → `loaiXe`: `"loại xe"`, `"loai xe"`
- **Biển số / Theo xe** → `bienSo`: `"theo xe"`, `"số xe"`, `"so xe"`, `"biển số"`, `"bien so"`
- **Hạn đăng kiểm xe** → `hanDangKiem`: `"hạn đăng kiểm"`, `"han dang kiem"`, `"đăng kiểm xe"` — resolved to the first occurrence (before `SỐ MOOC` column)
- **Hạn bảo hiểm xe** → `hanBaoHiem`: `"hạn bảo hiểm"`, `"han bao hiem"`, `"hạn bảo hiểm xe"`, `"bảo hiểm xe"`
- **Hạn cà vẹt xe** → `hanCaVet`: `"hạn cà vẹt"`, `"han ca vet"`, `"cà vẹt xe"` — resolved to the first occurrence (before `SỐ MOOC` column)
- **Số mooc** → `soMooc`: `"số mooc"`, `"số moóc"`, `"so mooc"`, `"rơ moóc"`, `"ro mooc"` — let N = this column's index
- **Hạn đăng kiểm mooc** → `moocHanDangKiem`: column at offset N+1
- **Hạn BH mooc** → `moocHanBaoHiem`: column at offset N+2
- **Hạn cà vẹt mooc** → `moocHanCaVet`: column at offset N+3
- **Ghi chú** → `ghiChuLines`: column at offset N+4

Mooc date and note columns SHALL be resolved by position relative to `SỐ MOOC` (not by header name) to avoid collision with identically-named vehicle columns.

#### Scenario: STT row creates VehicleRecord

- **WHEN** a row has a non-empty STT cell
- **THEN** a new `VehicleRecord` is created with all extractable fields; if `soMooc` is also present on the same row a `VehicleRecordMooc` is created and linked to that record

#### Scenario: Continuation row appends mooc to preceding VehicleRecord

- **WHEN** a row has an empty STT cell and a non-empty `soMooc` cell following a record row
- **THEN** a `VehicleRecordMooc` is created and its `vehicleRecordId` is set to the most recently created `VehicleRecord`

#### Scenario: Continuation mooc row with no preceding record is skipped

- **WHEN** a continuation mooc row appears but no `VehicleRecord` has been created yet in that import run
- **THEN** the row is skipped and an entry is added to `errors` with the row number and reason

#### Scenario: Driver name from TÊN TX column is imported

- **WHEN** the sheet header row contains a cell with value `TÊN TX` (case-insensitive)
- **THEN** `VehicleRecord.tenTaiXe` is populated with the text value from that column for each STT row

#### Scenario: License plate from THEO XE column is imported

- **WHEN** the sheet header row contains a cell with value `THEO XE` (case-insensitive)
- **THEN** `VehicleRecord.bienSo` is populated with the text value from that column for each STT row

#### Scenario: Mooc date columns resolved by offset from SỐ MOOC

- **WHEN** the sheet contains a column named `SỐ MOOC` at index N and the cells at N+1, N+2, N+3 contain date values for a vehicle or mooc row

- **THEN** `moocHanDangKiem`, `moocHanBaoHiem`, and `moocHanCaVet` are populated with those dates respectively

#### Scenario: Ghi chú column resolved by offset from SỐ MOOC, split into one note per line

- **WHEN** the sheet contains a column named `SỐ MOOC` at index N and a vehicle row has the text "Cần thay lốp\nĐã kiểm tra phanh" in the cell at N+4
- **THEN** the created `VehicleRecord` has two `VehicleRecordNote` rows: "Cần thay lốp" and "Đã kiểm tra phanh", in that order

#### Scenario: Single-line Ghi chú cell produces exactly one note

- **WHEN** a vehicle row's "GHI CHÚ" cell contains a single line of text with no embedded newline
- **THEN** the created `VehicleRecord` has exactly one `VehicleRecordNote` with that text as `content`

#### Scenario: Blank Ghi chú cell produces zero notes

- **WHEN** a vehicle row's "GHI CHÚ" cell is empty or whitespace-only
- **THEN** the created `VehicleRecord` has zero `VehicleRecordNote` rows

#### Scenario: Re-importing an existing record replaces its note list

- **WHEN** an admin re-imports a file (execute mode, matched by an existing `id`) where a `VehicleRecord`'s "GHI CHÚ" cell now contains different text than its current notes
- **THEN** all of that record's existing `VehicleRecordNote` rows are deleted and replaced with one row per non-empty line in the imported cell

#### Scenario: Duplicate column names do not cause vehicle date to read mooc column

- **WHEN** the sheet has two columns both named `HẠN ĐĂNG KIỂM` (one for vehicle, one for mooc) appearing in that order
- **THEN** `VehicleRecord.hanDangKiem` is populated from the first occurrence and `VehicleRecordMooc.hanDangKiem` is populated from the offset N+1 column

#### Scenario: hanCaVet column is extracted for vehicle row

- **WHEN** the sheet has a column matching "hạn cà vẹt" and a vehicle row has a date value in that cell
- **THEN** `VehicleRecord.hanCaVet` is set to the parsed date

#### Scenario: hanCaVet column is extracted for mooc

- **WHEN** the sheet contains a `SỐ MOOC` column at index N and a mooc row or continuation row has a date value at column N+3
- **THEN** `VehicleRecordMooc.hanCaVet` is set to the parsed date

#### Scenario: Missing hanCaVet column is silently ignored

- **WHEN** the sheet has no column matching any `hanCaVet` variant for vehicle or mooc
- **THEN** the import proceeds normally with `hanCaVet` stored as null; no error is raised
