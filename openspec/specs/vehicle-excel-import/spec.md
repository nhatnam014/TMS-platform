### Requirement: Admin can bulk-import vehicle records from Excel

The system SHALL provide `POST /api/v1/import/vehicles` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file.

The endpoint operates in two modes controlled by the `?confirm=true` query parameter:

**Preview mode** (default, no `?confirm=true`): Parse the file and return a conflict analysis WITHOUT writing any data. Response: `{ toCreate: number, conflicts: ConflictEntry[], errors: string[] }`. HTTP 200.

**Execute mode** (`?confirm=true`): Parse and execute: driver findOrCreate, vehicle upserts for conflicts, VehicleRecord/VehicleRecordMooc creation. Response: `{ imported: number, warnings: string[], errors: string[] }`. HTTP 200.

In both modes the endpoint MUST be restricted to users with role ADMIN. File size limit of 5 MB applies to both modes.

#### Scenario: Preview returns conflict list without writing data

- **WHEN** an admin uploads a file containing a bienSo that already exists in the Vehicle table with differing field values (no `?confirm=true`)
- **THEN** the API returns HTTP 200 with `{ toCreate: N, conflicts: [...], errors: [] }` and no rows are created or modified in any table

#### Scenario: Preview with no conflicts returns empty conflicts array

- **WHEN** the uploaded file contains only bienSo values absent from the Vehicle table and no `?confirm=true`
- **THEN** the API returns HTTP 200 with `{ toCreate: N, conflicts: [], errors: [] }`

#### Scenario: Execute mode creates all records and updates conflicting vehicles

- **WHEN** an admin uploads the file with `?confirm=true`
- **THEN** drivers are upserted by (fullName, phone), conflicting vehicles are updated, VehicleRecord and VehicleRecordMooc rows are created; the API returns `{ imported: N, warnings: [], errors: [] }`

#### Scenario: Non-admin role is rejected

- **WHEN** a user without ADMIN role uploads a file
- **THEN** the API returns HTTP 403

#### Scenario: File size exceeds 5 MB limit

- **WHEN** an admin uploads a file larger than 5 MB
- **THEN** the API returns HTTP 413 and does not process any rows

### Requirement: Parser handles the "quản lý xe" continuation-row structure for VehicleRecord

The system SHALL process the "quản lý xe" sheet rows as follows: a row where the STT column is non-empty and the data is structurally valid SHALL produce one `VehicleRecord` creation with any mooc present in the same row as its first `VehicleRecordMooc`. A row where the STT column is empty and `soMooc` is non-empty SHALL be treated as a mooc continuation and attached to the most recently created `VehicleRecord`. Rows that are empty or have no identifiable data SHALL be silently skipped. The parser SHALL extract all of: `tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, `hanCaVet` (vehicle), `soMooc`, `hanDangKiem` (mooc), `hanBaoHiem` (mooc), `hanCaVet` (mooc), `ghiChu`.

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
- **Ghi chú** → `ghiChu`: column at offset N+4

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

#### Scenario: Ghi chú column resolved by offset from SỐ MOOC

- **WHEN** the sheet contains a column named `SỐ MOOC` at index N and a vehicle row has a text value in the cell at N+4
- **THEN** `VehicleRecord.ghiChu` is populated with that text

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

### Requirement: Import result reports only structural row errors

The system SHALL populate `errors` with a message for each row that was skipped due to a structural issue (e.g., a continuation mooc row with no preceding record). `warnings` SHALL be an empty array in normal operation. The `imported` count in execute mode reflects the number of VehicleRecord rows created.

#### Scenario: Continuation row before any record row is reported as error

- **WHEN** the first data row has an empty STT and a non-empty soMooc
- **THEN** `errors` contains an entry referencing that row number and `imported` is 0

#### Scenario: Fully empty row is silently skipped

- **WHEN** a row has all cells empty
- **THEN** it is skipped with no entry added to `errors` or `warnings`

#### Scenario: Normal import produces empty errors and warnings

- **WHEN** a well-formed file is imported with `?confirm=true`
- **THEN** both `errors` and `warnings` are empty arrays and `imported` equals the number of valid STT rows
