## ADDED Requirements

### Requirement: Excel exports embed a 4-row branded header block

Both the kế hoạch xe and quản lý xe Excel exports SHALL prepend a 4-row branded header above the column header row. The header SHALL contain:
- The company logo image (`apps/img/LogisticCompany.png`) anchored to cells A1:F4
- A report title (e.g. "KẾ HOẠCH XE" or "QUẢN LÝ XE") merged across columns G1 to the last data column, rows 1–2, styled as bold, font size 18, dark blue (#003399), center-aligned
- A date range line ("From: DD/MM/YYYY  To: DD/MM/YYYY") for kế hoạch xe only, merged across columns G3 to the last data column, row 4, font size 11, center-aligned; this line SHALL be omitted for quản lý xe
- Rows 1–4 SHALL have height of 30 points each
- The column header row is row 5; data begins at row 6

#### Scenario: Logo image is embedded in kế hoạch xe export

- **WHEN** the kế hoạch xe Excel file is opened
- **THEN** a PNG image is visible in the top-left region spanning approximately columns A–F, rows 1–4

#### Scenario: Title appears in kế hoạch xe export

- **WHEN** the kế hoạch xe Excel file is opened
- **THEN** a merged cell spanning columns G through the last column across rows 1–2 contains "KẾ HOẠCH XE" in bold dark-blue large font

#### Scenario: Date range appears in kế hoạch xe header when from/to are provided

- **WHEN** the kế hoạch xe export is requested with from=2026-01-01 and to=2026-01-31
- **THEN** the header date line reads "From: 01/01/2026  To: 31/01/2026"

#### Scenario: Date range uses MIN trip date and today when from/to are blank

- **WHEN** the kế hoạch xe export is requested with no date parameters and the result set contains trips with dates ranging from 2025-03-15 to 2026-05-20
- **THEN** the header date line reads "From: 15/03/2025  To: <today's date in DD/MM/YYYY>"

#### Scenario: Logo image is embedded in quản lý xe export

- **WHEN** the quản lý xe Excel file is opened
- **THEN** a PNG image is visible in the top-left region spanning approximately columns A–F, rows 1–4

#### Scenario: Title appears in quản lý xe export without date line

- **WHEN** the quản lý xe Excel file is opened
- **THEN** a merged cell spanning columns G through the last column across rows 1–2 contains "QUẢN LÝ XE" in bold dark-blue large font, and no date range text is present in rows 3–4

#### Scenario: Export still works if logo file is missing

- **WHEN** the logo file does not exist at the expected path
- **THEN** the export succeeds, the header renders with title and dates but without an image
