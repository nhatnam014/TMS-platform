## MODIFIED Requirements

### Requirement: SỐ XE column in trip plan export reads vehiclePlate field

The trip plan Excel export builder SHALL read `TripPlan.vehiclePlate` (plain string) for the SỐ XE column. It SHALL NOT access `TripPlan.vehicle?.licensePlate` or any joined Vehicle entity. A null `vehiclePlate` SHALL produce an empty cell.

#### Scenario: vehiclePlate value appears in SỐ XE column

- **WHEN** a TripPlan has `vehiclePlate = "51D-12345"`
- **THEN** the exported row's SỐ XE cell contains "51D-12345"

#### Scenario: Null vehiclePlate produces empty SỐ XE cell

- **WHEN** a TripPlan has `vehiclePlate = null`
- **THEN** the SỐ XE cell in the exported row is empty
