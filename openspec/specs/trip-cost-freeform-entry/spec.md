## Requirements

### Requirement: Cost slot amount inputs display live thousand-separator formatting

All amount input fields in the trip plan create and edit forms SHALL use `type="text"` and display the entered amount with Vietnamese thousand-separator formatting (period as separator, e.g. 1500000 → "1.500.000") as the user types. The underlying numeric value used for submission SHALL be the raw integer without formatting characters.

#### Scenario: Typing 1000 immediately shows 1.000

- **WHEN** the user types "1000" into a cost amount input
- **THEN** the input displays "1.000" in real time without any delay or blur event required

#### Scenario: Non-digit characters are stripped on input

- **WHEN** the user pastes "1.500.000" or "1,500,000" into an amount field
- **THEN** the non-digit characters are stripped and the field normalises to display "1.500.000"

#### Scenario: Empty amount field submits as undefined (slot not included)

- **WHEN** the user leaves an amount field empty and submits
- **THEN** the corresponding cost slot is not included in the POST/PATCH body

#### Scenario: Formatted display does not corrupt the submitted value

- **WHEN** the user enters "2500000" (displayed as "2.500.000") and submits the form
- **THEN** the API receives `phiNangAmount: 2500000` (numeric, not a formatted string)

### Requirement: Fixed cost slot names are hardcoded, not user-editable

For the 8 fixed cost slots (PHÍ NÂNG, PHÍ HẠ, PHÍ VỆ SINH, PHÍ CƯỢC, VÉ CỔNG, CHI PHÍ KHÁC/PHÍ ĐỨT TEM, TRÁI TUYẾN/CHỈ ĐỊNH/BP CAM, CẦU ĐƯỜNG), the `*Name` field submitted to the API SHALL be the slot's label string as a hardcoded constant. Users SHALL NOT see a name input for these slots — only an amount input and, where applicable, an SHĐ input.

#### Scenario: PHÍ NÂNG slot submits hardcoded name

- **WHEN** the user enters an amount in the PHÍ NÂNG slot and submits
- **THEN** the POST body contains `phiNangName: "PHÍ NÂNG"` without any user input for that field

#### Scenario: CHI PHÍ PHÁT SINH KHÁC retains free-text name input

- **WHEN** the user opens the create or edit form
- **THEN** the CHI PHÍ PHÁT SINH KHÁC slot has both a text input for the name and a formatted amount input (this slot is not a fixed-label slot)
