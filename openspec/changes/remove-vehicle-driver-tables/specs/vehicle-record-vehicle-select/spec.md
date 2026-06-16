## REMOVED Requirements

### Requirement: Vehicle selection dropdown in vehicle record form

**Reason**: The Vehicle database table is being removed entirely. Vehicle type, license plate, and compliance dates are now entered as plain text directly in the Vehicle Record form without any lookup or autofill from a Vehicle entity. See `vehicle-record-plain-entry` spec for the replacement behavior.

**Migration**: Remove `SelectField` for "Chọn xe" from the Vehicle Record create and edit form. Remove all `selectedVehicleId` state, `vehicleLocked` logic, and the `handleVehicleSelect` function. Remove the fetch of `GET /api/vehicles` from `fetchDropdownData`. Remove the entire `fetchDropdownData` function if no other dropdown remains. The `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, and `hanCaVet` fields revert to always-editable plain text and date inputs.
