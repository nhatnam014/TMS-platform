## ADDED Requirements

### Requirement: Each module's Excel import/export UI is triggered from that module's own page

The system SHALL NOT provide a standalone `/import-export` page. Instead, each of the following pages SHALL expose a "Nhập / Xuất Excel" header button that opens a page-local modal containing that module's upload section (file picker + import trigger + result/diff display) and download section(s) (export trigger, with any applicable filters):

- `/vehicle-records` (quản lý xe): upload targets `POST /api/v1/import/vehicles`, download targets `GET /api/v1/export/vehicles`
- `/trip-plans` (kế hoạch xe): upload targets `POST /api/v1/import/trip-plans`, download targets `GET /api/v1/export/trip-plans` with from/to date filter inputs
- `/vehicle-maintenance` (bảo dưỡng xe): upload targets `POST /api/v1/import/vehicle-maintenance`, download targets `GET /api/v1/export/vehicle-maintenance` with a "chọn loại xe" multi-select popup
- `/yard-moves` (tiến độ vận tải): upload targets `POST /api/v1/import/yard-moves`, download targets `GET /api/v1/export/yard-moves` with from/to date filter inputs and a "Đã kéo / Tồn" status filter toggle

The button and modal SHALL be visible to any authenticated user regardless of role, matching the pages' own access level (none of the 4 pages are role-restricted).

#### Scenario: Import/export button opens a page-local modal

- **WHEN** an authenticated user on `/trip-plans` clicks "Nhập / Xuất Excel"
- **THEN** a modal opens on that page containing the trip-plan upload section and the trip-plan download section with date filters; no navigation to a separate page occurs

#### Scenario: Visiting /import-export returns a not-found response

- **WHEN** a user navigates to `/import-export`
- **THEN** the application does not render an import/export page (the route no longer exists)

#### Scenario: Nav sidebar no longer lists a standalone import/export link

- **WHEN** any authenticated user views the nav sidebar
- **THEN** it does not contain a "Nhập / Xuất Excel" entry

#### Scenario: Modal does not auto-close after a successful import

- **WHEN** a user uploads a file inside a module's import/export modal and the import completes successfully
- **THEN** the modal remains open, showing the import result (counts, warnings, errors, created/changed record links) until the user manually closes it

#### Scenario: Import result and diff popups render above the import/export modal

- **WHEN** a user, inside an open import/export modal, clicks a "N bản ghi đã thay đổi" or "N bản ghi mới tạo" link to view the diff popup
- **THEN** the diff popup renders fully visible on top of the import/export modal, not obscured behind it
