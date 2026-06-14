## ADDED Requirements

### Requirement: Vehicle selection dropdown in vehicle record form

The vehicle record form SHALL provide a searchable dropdown for selecting a vehicle from the existing Vehicle table. The dropdown SHALL display each vehicle as `"{licensePlate} — {vehicleType}"`. When a vehicle is selected, the following form fields SHALL be automatically populated and disabled:

- `loaiXe` ← `Vehicle.vehicleType` (enum value used as-is)
- `bienSo` ← `Vehicle.licensePlate`
- `hanDangKiem` ← `Vehicle.inspectionExpiry` (formatted as YYYY-MM-DD for the date input)
- `hanBaoHiem` ← `Vehicle.insuranceExpiry` (formatted as YYYY-MM-DD)
- `hanCaVet` ← `Vehicle.registrationExpiry` (formatted as YYYY-MM-DD)

Re-selecting a different vehicle SHALL overwrite all five autofilled values. There is no separate clear button. If a compliance date field on the Vehicle is `null`, the corresponding form field is cleared to empty.

If no vehicle is selected, all five fields remain enabled as free-text / date inputs.

The dropdown SHALL be populated by a client-side fetch of `GET /api/vehicles` at form open time.

#### Scenario: Vehicle selected — five fields autofill and lock

- **WHEN** the user selects a vehicle from the vehicle dropdown in the create or edit form
- **THEN** `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, and `hanCaVet` are populated from the selected vehicle's data and all five inputs become disabled

#### Scenario: Re-selecting a vehicle overwrites the previous autofill

- **WHEN** the user selects a different vehicle from the dropdown while a vehicle is already selected
- **THEN** all five autofilled fields are overwritten with the new vehicle's data and remain disabled

#### Scenario: Vehicle with null compliance date clears the corresponding field

- **WHEN** the selected vehicle has `inspectionExpiry: null`
- **THEN** the `hanDangKiem` input is cleared to empty string and remains disabled

#### Scenario: No vehicle selected — fields remain editable

- **WHEN** the form is opened and no vehicle is selected from the dropdown
- **THEN** `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, and `hanCaVet` are enabled and accept user input

#### Scenario: Form submits autofilled values unchanged

- **WHEN** a vehicle is selected and the user submits the form
- **THEN** the POST/PATCH request body contains the five vehicle fields populated from the selected vehicle's data

#### Scenario: Edit form pre-selects vehicle if bienSo matches

- **WHEN** the user opens the edit form for a VehicleRecord whose `bienSo` matches an existing Vehicle's `licensePlate`
- **THEN** that vehicle is pre-selected in the dropdown and all five fields are shown as disabled

#### Scenario: Edit form falls back to editable if no vehicle match

- **WHEN** the user opens the edit form for a VehicleRecord whose `bienSo` does not match any Vehicle
- **THEN** no vehicle is pre-selected, and all five fields are editable showing the stored values
