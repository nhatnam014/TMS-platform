## REMOVED Requirements

### Requirement: Driver selection dropdown in vehicle record form

**Reason**: The Driver database table is being removed entirely. Driver name and phone are now entered as plain text directly in the Vehicle Record form without any lookup or autofill from a Driver entity. See `vehicle-record-plain-entry` spec for the replacement behavior.

**Migration**: Remove `SelectField` for "Chọn tài xế" from the Vehicle Record create and edit form. Remove all `selectedDriverId` state, `driverLocked` logic, and the `handleDriverSelect` function. Remove the fetch of `GET /api/drivers` from `fetchDropdownData`. The `tenTaiXe` and `sdt` fields revert to always-editable plain text inputs.
