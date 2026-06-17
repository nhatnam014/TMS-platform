## ADDED Requirements

### Requirement: Expiry list endpoint returns flattened expiry events

The system SHALL expose `GET /dashboard/expiry-list` returning a flat array of expiry events. Each event represents one expiry date of one entity (xe or mooc). A single VehicleRecord with one mooc can produce up to 4 events (ĐK xe, CàVẹt xe, ĐK mooc, CàVẹt mooc).

Each item SHALL contain: `entityType` ("xe" or "mooc"), `plateOrMooc` (bienSo for xe, soMooc for mooc), `parentPlate` (bienSo of the parent VehicleRecord — only populated for mooc rows), `expType` ("dangkiem" or "cavet"), `expDate` (ISO date string), `daysLeft` (integer, negative if already expired).

#### Scenario: One vehicle with two expiry dates produces two events

- **WHEN** a VehicleRecord has `hanDangKiem = 2026-07-10` and `hanCaVet = 2026-07-20` and both are in range
- **THEN** the response contains two items: one with `expType = "dangkiem"` and one with `expType = "cavet"` for that vehicle

#### Scenario: Mooc events include parent vehicle plate

- **WHEN** a VehicleRecordMooc with soMooc "HD-001" belongs to VehicleRecord with bienSo "51C-1234" and mooc has `hanDangKiem` in range
- **THEN** the response contains an item with `entityType = "mooc"`, `plateOrMooc = "HD-001"`, `parentPlate = "51C-1234"`

### Requirement: Already-expired records always appear in the expiry list

The system SHALL always include expiry events where `expDate < today` in `GET /dashboard/expiry-list`, regardless of the `from`/`to` filter parameters. The date range filter controls only which future expiry dates are included.

#### Scenario: Expired record visible even with future-only filter

- **WHEN** the client calls `GET /dashboard/expiry-list?from=2026-08-01&to=2026-08-31`
- **THEN** the response includes events where `expDate < today` (already expired) in addition to events expiring in August 2026

#### Scenario: Default range shows expired plus next 30 days

- **WHEN** the client calls `GET /dashboard/expiry-list` with no params (default: from=today, to=today+30d)
- **THEN** response includes all already-expired events and events expiring within the next 30 days

### Requirement: Expiry list is filterable by entity type

The system SHALL accept an `entity` query parameter with values `all`, `xe`, or `mooc`. When `xe` is specified only VehicleRecord expiry events are returned; when `mooc` is specified only VehicleRecordMooc events are returned. Default is `all`.

#### Scenario: Filter by xe excludes mooc events

- **WHEN** the client calls `GET /dashboard/expiry-list?entity=xe`
- **THEN** all returned items have `entityType = "xe"` and no mooc items appear

#### Scenario: Filter by mooc excludes xe events

- **WHEN** the client calls `GET /dashboard/expiry-list?entity=mooc`
- **THEN** all returned items have `entityType = "mooc"` and no xe items appear

### Requirement: Expiry list is filterable by expiry type

The system SHALL accept a `type` query parameter with values `all`, `dangkiem`, or `cavet`. Default is `all`.

#### Scenario: Filter by dangkiem excludes cavet events

- **WHEN** the client calls `GET /dashboard/expiry-list?type=dangkiem`
- **THEN** all returned items have `expType = "dangkiem"`

### Requirement: Expiry list items carry a daysLeft color classification

The frontend SHALL apply color coding based on `daysLeft`:

- `daysLeft < 0` → red (already expired)
- `0 <= daysLeft <= 7` → orange (critical)
- `8 <= daysLeft <= 30` → yellow (warning)
- `daysLeft > 30` → no highlight

#### Scenario: Expired item displayed in red

- **WHEN** an item has `daysLeft = -5`
- **THEN** the table row is styled with a red background or text

#### Scenario: Near-expiry item displayed in orange

- **WHEN** an item has `daysLeft = 3`
- **THEN** the table row is styled in orange

#### Scenario: Warning-range item displayed in yellow

- **WHEN** an item has `daysLeft = 20`
- **THEN** the table row is styled in yellow

### Requirement: Expiry section has its own date range controls with helper text

The frontend expiry section SHALL display its own "from" and "to" date pickers, separate from the trip date range picker at the top of the dashboard. Helper text SHALL be displayed near the pickers explaining that the range selects which future expiry dates to show, and that expired records are always visible.

#### Scenario: Helper text is visible next to expiry date pickers

- **WHEN** the dashboard expiry section is rendered
- **THEN** text similar to "Xe/mooc đã hết hạn luôn được hiển thị" appears near the date pickers
