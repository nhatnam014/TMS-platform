## ADDED Requirements

### Requirement: Full-text search across trip plan fields
The system SHALL support a `search` query parameter on `GET /trip-plans` that matches records where any of the following fields contain the search string (case-insensitive):
- `tripNumber` (numeric exact match when search string is a valid integer)
- `vehicle.licensePlate`
- `customer.name`
- `outboundContainer.containerNumber`
- `inboundContainer.containerNumber`
- `notes`

#### Scenario: Search by license plate
- **WHEN** the client sends `GET /trip-plans?search=50E12208`
- **THEN** the response SHALL include only trips whose vehicle license plate contains "50E12208" (case-insensitive)

#### Scenario: Search by customer name
- **WHEN** the client sends `GET /trip-plans?search=sailun`
- **THEN** the response SHALL include trips where the customer name contains "sailun" (case-insensitive)

#### Scenario: Search by container number
- **WHEN** the client sends `GET /trip-plans?search=OOLU899`
- **THEN** the response SHALL include trips where outbound OR inbound container number contains "OOLU899"

#### Scenario: Search by trip number
- **WHEN** the client sends `GET /trip-plans?search=42`
- **THEN** the response SHALL include trips where tripNumber equals 42

#### Scenario: Search combined with other filters
- **WHEN** the client sends `GET /trip-plans?search=sailun&status=COMPLETED`
- **THEN** the response SHALL include only trips that match BOTH the status filter AND the search term

#### Scenario: Empty search param
- **WHEN** the client sends `GET /trip-plans` with no `search` param (or `search=`)
- **THEN** the response SHALL return results with no text-search restriction applied
