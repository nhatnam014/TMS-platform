## ADDED Requirements

### Requirement: Driver selection dropdown in vehicle record form

The vehicle record form SHALL provide a searchable dropdown for selecting a driver from the existing Driver table. The dropdown SHALL display each driver as `"{fullName} — {phone}"`. When a driver is selected, the `tenTaiXe` and `sdt` form fields SHALL be automatically populated with the selected driver's `fullName` and `phone` respectively, and those inputs SHALL become disabled (read-only). Re-selecting a different driver from the dropdown SHALL overwrite the autofilled values and keep the fields disabled. There is no separate clear button; the user changes the selection by picking a different driver from the dropdown.

If no driver is selected, the `tenTaiXe` and `sdt` fields remain enabled and editable as free-text (backward-compatible with manual entry).

The dropdown SHALL be populated by a client-side fetch of `GET /api/drivers` at form open time.

#### Scenario: Driver selected — fields autofill and lock

- **WHEN** the user opens the create or edit vehicle record form and selects a driver from the driver dropdown
- **THEN** the `tenTaiXe` input is populated with the driver's `fullName`, the `sdt` input is populated with the driver's `phone`, and both inputs become disabled

#### Scenario: Re-selecting a driver overwrites the previous autofill

- **WHEN** the user selects a different driver from the dropdown after a driver is already selected
- **THEN** `tenTaiXe` and `sdt` are overwritten with the new driver's data and remain disabled

#### Scenario: No driver selected — fields remain editable

- **WHEN** the form is opened and no driver is selected from the dropdown
- **THEN** `tenTaiXe` and `sdt` inputs are enabled and accept free-text input

#### Scenario: Form submits the autofilled values unchanged

- **WHEN** a driver is selected and the user submits the form
- **THEN** the POST/PATCH request body contains `tenTaiXe` and `sdt` populated from the selected driver's data, same as if typed manually

#### Scenario: Edit form pre-populates dropdown if driver matches

- **WHEN** the user opens the edit form for a VehicleRecord where `tenTaiXe` and `sdt` match an existing driver
- **THEN** that driver is pre-selected in the dropdown and the fields are shown as disabled

#### Scenario: Edit form falls back to editable fields if no driver match

- **WHEN** the user opens the edit form for a VehicleRecord where no Driver record matches `tenTaiXe` + `sdt`
- **THEN** no driver is pre-selected, and the fields are editable text inputs showing the stored values
