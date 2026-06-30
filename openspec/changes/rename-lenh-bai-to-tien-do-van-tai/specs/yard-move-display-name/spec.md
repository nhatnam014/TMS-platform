## ADDED Requirements

### Requirement: Yard-moves module display name
The system SHALL display the yard-moves module under the name "Tiến độ vận tải" (rather than "Lệnh bãi") in every user-facing surface: the nav menu, the `/yard-moves` CRUD page, the `/import-export` page's yard-moves sections, and the exported Excel file — while keeping the underlying route (`/yard-moves`), API endpoints (`/api/export/yard-moves`, `/api/import/yard-moves`), and Excel column headers unchanged.

#### Scenario: Nav menu label
- **WHEN** an authenticated user views the sidebar nav
- **THEN** the entry linking to `/yard-moves` SHALL be labeled "Tiến độ vận tải"

#### Scenario: CRUD page title and actions
- **WHEN** a user navigates to `/yard-moves`
- **THEN** the page title SHALL read "Tiến độ vận tải"
- **THEN** the create modal title SHALL read "Tạo tiến độ vận tải mới", the edit modal title SHALL read "Sửa tiến độ vận tải", and the create submit button SHALL read "Tạo tiến độ vận tải" (or "Đang tạo..." while submitting)
- **THEN** success/error toasts and the delete confirmation prompt SHALL refer to "tiến độ vận tải" instead of "lệnh bãi"

#### Scenario: Import/export page sections
- **WHEN** a user views the `/import-export` page
- **THEN** the upload section SHALL be titled "Nhập tiến độ vận tải" with a description referencing the "tiến độ vận tải" sheet
- **THEN** the export section SHALL be titled "Xuất tiến độ vận tải" with a matching description, and the download button SHALL be labeled to download `tien-do-van-tai.xlsx`

#### Scenario: Exported Excel file naming
- **WHEN** a user exports or downloads the yard-moves Excel file from `/api/export/yard-moves`
- **THEN** the downloaded file SHALL be named `tien-do-van-tai.xlsx` (both the browser-saved filename and the `Content-Disposition` header)
- **THEN** the worksheet tab inside the file SHALL be named "tiến độ vận tải" and the branded title block printed in the sheet SHALL read "TIẾN ĐỘ VẬN TẢI"
- **THEN** the Excel column headers (STT, NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, ĐÃ KÉO, ID) SHALL remain unchanged, and a file previously exported under the old `lenh-bai.xlsx` name SHALL still import successfully (column matching is name/position based, not dependent on the sheet tab or title text)

#### Scenario: Audit log summary for Excel-import updates
- **WHEN** an ADMIN views the Audit Logs page after an Excel import updates an existing yard-move record
- **THEN** the log summary text SHALL reference "tiến độ vận tải" instead of "lệnh bãi"
