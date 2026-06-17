## MODIFIED Requirements

### Requirement: Location latitude must be within WGS84 range

The `latitude` field in `CreateLocationDto` and `UpdateLocationDto` SHALL be validated to be within the range −90 to 90 (inclusive). Values outside this range SHALL be rejected with HTTP 400 before reaching the database.

#### Scenario: Latitude out of range rejected

- **WHEN** a create or update request includes `latitude: 200`
- **THEN** the API returns HTTP 400 with a validation error message

#### Scenario: Valid latitude accepted

- **WHEN** a create or update request includes `latitude: 10.7709760`
- **THEN** the request proceeds normally without a validation error

### Requirement: Location longitude must be within WGS84 range

The `longitude` field in `CreateLocationDto` and `UpdateLocationDto` SHALL be validated to be within the range −180 to 180 (inclusive). Values outside this range SHALL be rejected with HTTP 400.

#### Scenario: Longitude out of range rejected

- **WHEN** a create or update request includes `longitude: 1054.5`
- **THEN** the API returns HTTP 400 with a validation error message

#### Scenario: Valid longitude accepted

- **WHEN** a create or update request includes `longitude: 106.6297`
- **THEN** the request proceeds normally

### Requirement: Location frontend form validates lat/lng as numeric with range

The location create and edit forms SHALL render latitude and longitude as `type="number"` inputs with `min`/`max`/`step` attributes. The browser SHALL prevent submission of out-of-range values, and the user SHALL see an inline error immediately without a server round-trip.

#### Scenario: Browser blocks out-of-range latitude

- **WHEN** user enters `200` in the latitude field and attempts to submit
- **THEN** the browser's native validation prevents form submission and shows an inline error

#### Scenario: Decimal values accepted

- **WHEN** user enters `10.770976` in the latitude field
- **THEN** the input accepts the value and form submits normally
