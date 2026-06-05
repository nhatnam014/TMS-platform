## ADDED Requirements

### Requirement: Container number format validation

The system SHALL validate that any container number field conforms to the regex `^[A-Z]{4}\d{7}$` — exactly 4 uppercase ASCII letters followed by exactly 7 decimal digits (11 characters total, matching ISO 6346 owner code + serial format). This validation MUST be enforced at the API DTO layer via `class-validator @Matches`. The web UI SHALL include a `pattern` attribute on the corresponding input elements as a UX hint.

#### Scenario: Valid container number is accepted

- **WHEN** a request includes `containerNumber: "OOLU8990993"`
- **THEN** the API accepts the value and proceeds with the operation

#### Scenario: Container number with lowercase letters is rejected

- **WHEN** a request includes `containerNumber: "oolu8990993"`
- **THEN** the API returns `400 Bad Request` with a validation error

#### Scenario: Container number with wrong digit count is rejected

- **WHEN** a request includes `containerNumber: "ABCD12345"` (only 5 digits)
- **THEN** the API returns `400 Bad Request` with a validation error

#### Scenario: Container number with fewer than 4 letters is rejected

- **WHEN** a request includes `containerNumber: "ABC1234567"` (3 letters + 7 digits)
- **THEN** the API returns `400 Bad Request` with a validation error

#### Scenario: Web input carries pattern hint

- **WHEN** the yard-move creation form renders the container number field
- **THEN** the input element has `pattern="[A-Z]{4}[0-9]{7}"` to guide browser-native validation
