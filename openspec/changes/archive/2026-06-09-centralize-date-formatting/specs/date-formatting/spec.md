## ADDED Requirements

### Requirement: Shared date formatting utility

The system SHALL provide a single shared module at `apps/web/src/lib/date-utils.ts` that exports all date formatting functions used by frontend pages. No page file SHALL define its own date formatting function.

#### Scenario: Utility module exists and exports required functions

- **WHEN** a frontend page needs to display a date
- **THEN** it SHALL import `formatDate` or `formatDateTime` from `@/lib/date-utils`

---

### Requirement: formatDate formats date-only values as dd/mm/yyyy

The `formatDate` function SHALL accept a `string | Date | null | undefined` value and return a localized date string in `dd/mm/yyyy` format using the `vi-VN` locale.

#### Scenario: Valid ISO date string

- **WHEN** `formatDate("2024-01-15")` is called
- **THEN** it SHALL return `"15/01/2024"`

#### Scenario: Valid ISO datetime string

- **WHEN** `formatDate("2024-01-15T07:30:00.000Z")` is called
- **THEN** it SHALL return `"15/01/2024"` (time portion is ignored)

#### Scenario: Null input

- **WHEN** `formatDate(null)` is called
- **THEN** it SHALL return `"—"` (em dash)

#### Scenario: Undefined input

- **WHEN** `formatDate(undefined)` is called
- **THEN** it SHALL return `"—"` (em dash)

#### Scenario: Invalid date string

- **WHEN** `formatDate("not-a-date")` is called
- **THEN** it SHALL return `"—"` (em dash)

---

### Requirement: formatDateTime formats timestamps as dd/mm/yyyy, HH:MM

The `formatDateTime` function SHALL accept a `string | Date | null | undefined` value and return a localized datetime string including both date and time, using the `vi-VN` locale.

#### Scenario: Valid ISO datetime string

- **WHEN** `formatDateTime("2024-01-15T14:30:00.000Z")` is called
- **THEN** it SHALL return a string containing both the date `15/01/2024` and time components

#### Scenario: Null input

- **WHEN** `formatDateTime(null)` is called
- **THEN** it SHALL return `"—"` (em dash)

#### Scenario: Invalid date string

- **WHEN** `formatDateTime("not-a-date")` is called
- **THEN** it SHALL return `"—"` (em dash)

---

### Requirement: toDateInput converts to yyyy-mm-dd for HTML date inputs

The `toDateInput` function SHALL accept a `string | Date | null | undefined` value and return a string in `yyyy-mm-dd` format suitable for use as an HTML `<input type="date">` value.

#### Scenario: Valid ISO datetime string

- **WHEN** `toDateInput("2024-01-15T00:00:00.000Z")` is called
- **THEN** it SHALL return `"2024-01-15"`

#### Scenario: Null input

- **WHEN** `toDateInput(null)` is called
- **THEN** it SHALL return `""` (empty string)

---

### Requirement: All pages use shared date formatting

All frontend page files that display date values to the user SHALL use functions from `@/lib/date-utils` rather than defining local formatting functions or using inline `new Date(x).toLocaleDateString()` calls.

#### Scenario: vehicles/page.tsx displays expiry dates

- **WHEN** the vehicles page renders inspection, insurance, or registration expiry dates
- **THEN** it SHALL use `formatDate` from `@/lib/date-utils`

#### Scenario: vehicle-records/page.tsx displays record dates

- **WHEN** the vehicle records page renders dates
- **THEN** it SHALL use `formatDate` from `@/lib/date-utils`

#### Scenario: users/page.tsx displays user creation date

- **WHEN** the users page renders `createdAt` dates
- **THEN** it SHALL use `formatDate` from `@/lib/date-utils`

#### Scenario: trip-plans/page.tsx displays trip and document dates

- **WHEN** the trip plans page renders `tripDate` or `documentSentDate`
- **THEN** it SHALL use `formatDate` from `@/lib/date-utils`

#### Scenario: yard-moves/page.tsx displays move dates

- **WHEN** the yard moves page renders date values
- **THEN** it SHALL use `formatDate` from `@/lib/date-utils`

#### Scenario: audit-logs/page.tsx displays log timestamps

- **WHEN** the audit logs page renders `createdAt` timestamps
- **THEN** it SHALL use `formatDateTime` from `@/lib/date-utils`
