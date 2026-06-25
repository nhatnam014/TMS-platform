## ADDED Requirements

### Requirement: Excel exports embed a branded header block (logo, title, date row)

The `quanly-xe` and `bao-duong-xe` Excel exports SHALL prepend an 8-row branded header above the column header row, on **every worksheet** (`bao-duong-xe` produces one worksheet per `loaiXe`; each gets its own header). The header SHALL contain:
- The company logo image (`apps/img/LogisticCompany.png`) anchored to cells A1:E7 (5 columns × 7 rows)
- A report title (e.g. "QUẢN LÝ XE" or "BẢO DƯỠNG XE"), in hoa, bold, font size 18, color `#003399`, merged across columns H3:O3 (row 3 only), center-aligned
- A date line merged across columns H5:O5 (row 5 only), font size 11, center-aligned, reading `"Ngày: <today DD/MM/YYYY>  From: <today DD/MM/YYYY>  To: <today DD/MM/YYYY>"` (neither export has a date-range filter, so From/To both render the export's generation date)
- Row 8 SHALL be a blank spacer row
- The column header row is row 9; data begins at row 10

#### Scenario: Logo image is embedded in quản lý xe export

- **WHEN** the quản lý xe Excel file is opened
- **THEN** a PNG image is visible spanning columns A–E, rows 1–7

#### Scenario: Title appears centered in its own row

- **WHEN** the quản lý xe or bảo dưỡng xe Excel file is opened
- **THEN** a merged cell spanning columns H through O on row 3 contains the report title in bold, dark-blue, size-18 font, center-aligned

#### Scenario: Date line appears centered below the title

- **WHEN** the quản lý xe or bảo dưỡng xe Excel file is opened
- **THEN** a merged cell spanning columns H through O on row 5 contains a line with "From:" and "To:" both showing the export's generation date, center-aligned, normal font

#### Scenario: Row 8 is blank and column headers start at row 9

- **WHEN** the quản lý xe or bảo dưỡng xe Excel file is opened
- **THEN** row 8 has no content, row 9 contains the column header labels, and row 10 onward contains data

#### Scenario: Every sheet in bảo dưỡng xe gets its own header

- **WHEN** the bảo dưỡng xe export contains sheets for 3 different `loaiXe` values
- **THEN** each of the 3 worksheets independently contains the logo, title, and date header block in rows 1–8

#### Scenario: Export still works if logo file is missing

- **WHEN** the logo file does not exist at the expected path
- **THEN** the export succeeds, the header renders with title and date but without an image

## REMOVED Requirements

### Requirement: Excel exports embed a 4-row branded header block

**Reason**: Superseded by the new 8-row layout (5×7 logo block, 2-col gap, title row 3, date row 5, spacer row 8) requested by the customer, and extended to a third export (`bao-duong-xe`). `kehoach-xe`'s header is no longer described by this capability — it is tracked under `fix-import-ke-hoach-xe-cost-fields` to avoid two changes editing the same file.

**Migration**: Any code or tests asserting the old row-5 column-header position for `quanly-xe` must be updated to row 9. `kehoach-xe` is unaffected by this removal (see `fix-import-ke-hoach-xe-cost-fields`).
