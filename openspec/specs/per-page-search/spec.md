## ADDED Requirements

### Requirement: Drivers page has a text search input
The system SHALL display a text search input above the drivers table. As the user types, the displayed list MUST be filtered to rows where `fullName` or `phone` contains the query string (case-insensitive). Rows that do not match MUST be hidden. When the input is empty, all rows MUST be displayed.

#### Scenario: Search by driver name
- **WHEN** the user types a name fragment into the search input on the drivers page
- **THEN** only rows whose `fullName` contains the fragment (case-insensitive) are shown

#### Scenario: Search by phone number
- **WHEN** the user types a phone digit sequence into the search input on the drivers page
- **THEN** only rows whose `phone` contains the sequence are shown

#### Scenario: Empty search shows all drivers
- **WHEN** the search input is empty
- **THEN** all driver rows are displayed

---

### Requirement: Customers page has a text search input
The system SHALL display a text search input above the customers table. As the user types, the displayed list MUST be filtered to rows where `code` or `name` contains the query string (case-insensitive).

#### Scenario: Search by customer code
- **WHEN** the user types a code fragment into the search input on the customers page
- **THEN** only rows whose `code` contains the fragment are shown

#### Scenario: Search by customer name
- **WHEN** the user types a name fragment into the search input on the customers page
- **THEN** only rows whose `name` contains the fragment are shown

#### Scenario: Empty search shows all customers
- **WHEN** the search input is empty
- **THEN** all customer rows are displayed

---

### Requirement: Carriers page has a text search input
The system SHALL display a text search input above the carriers table. As the user types, the displayed list MUST be filtered to rows where `code` or `name` contains the query string (case-insensitive).

#### Scenario: Search by carrier code
- **WHEN** the user types a code fragment into the search input on the carriers page
- **THEN** only rows whose `code` contains the fragment are shown

#### Scenario: Search by carrier name
- **WHEN** the user types a name fragment into the search input on the carriers page
- **THEN** only rows whose `name` contains the fragment are shown

#### Scenario: Empty search shows all carriers
- **WHEN** the search input is empty
- **THEN** all carrier rows are displayed

---

### Requirement: Locations page has a text search input
The system SHALL display a text search input above the locations table. As the user types, the displayed list MUST be filtered to rows where `code` or `name` contains the query string (case-insensitive). Any existing type filter MUST continue to work independently and combine with the search filter (AND logic).

#### Scenario: Search by location code
- **WHEN** the user types a code fragment into the search input on the locations page
- **THEN** only rows whose `code` contains the fragment are shown

#### Scenario: Search by location name
- **WHEN** the user types a name fragment into the search input on the locations page
- **THEN** only rows whose `name` contains the fragment are shown

#### Scenario: Search and type filter combine
- **WHEN** both a search query and a type filter are active
- **THEN** only rows matching both the search query AND the type filter are shown

#### Scenario: Empty search shows all locations (within active type filter)
- **WHEN** the search input is empty
- **THEN** all rows (within any active type filter) are displayed

---

### Requirement: Users page has a text search input
The system SHALL display a text search input above the users table. As the user types, the displayed list MUST be filtered to rows where `username` contains the query string (case-insensitive).

#### Scenario: Search by username
- **WHEN** the user types a username fragment into the search input on the users page
- **THEN** only rows whose `username` contains the fragment are shown

#### Scenario: Empty search shows all users
- **WHEN** the search input is empty
- **THEN** all user rows are displayed

---

### Requirement: Containers page has a text search input
The system SHALL display a text search input above the containers table. As the user types, the displayed list MUST be filtered to rows where `containerNumber` contains the query string (case-insensitive).

#### Scenario: Search by container number
- **WHEN** the user types a container number fragment into the search input on the containers page
- **THEN** only rows whose `containerNumber` contains the fragment are shown

#### Scenario: Empty search shows all containers
- **WHEN** the search input is empty
- **THEN** all container rows are displayed
