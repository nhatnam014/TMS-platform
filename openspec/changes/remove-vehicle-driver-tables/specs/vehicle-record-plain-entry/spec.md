## ADDED Requirements

### Requirement: Vehicle Record form fields are always plain text inputs

The Vehicle Record create and edit form SHALL provide the driver name (`tenTaiXe`), phone number (`sdt`), vehicle type (`loaiXe`), license plate (`bienSo`), inspection expiry (`hanDangKiem`), insurance expiry (`hanBaoHiem`), and registration expiry (`hanCaVet`) fields as always-editable inputs. There SHALL be no driver selection dropdown, no vehicle selection dropdown, and no autofill or locking behavior. The form SHALL NOT fetch `/api/drivers` or `/api/vehicles` at any time.

#### Scenario: All fields are editable on form open

- **WHEN** the user opens the create Vehicle Record form
- **THEN** all text and date inputs (tenTaiXe, sdt, loaiXe, bienSo, hanDangKiem, hanBaoHiem, hanCaVet) are enabled and accept user input directly

#### Scenario: Edit form shows stored values in editable inputs

- **WHEN** the user opens the edit form for an existing VehicleRecord
- **THEN** all fields are pre-populated with the stored values and remain editable (not disabled)

#### Scenario: Form submits user-entered values

- **WHEN** the user types values into the text inputs and submits the form
- **THEN** the POST/PATCH request body contains exactly the values the user typed, with no transformation or autofill

#### Scenario: No API call to /api/drivers or /api/vehicles on form open

- **WHEN** the user opens the create or edit Vehicle Record form
- **THEN** no HTTP request is made to `/api/drivers` or `/api/vehicles`
