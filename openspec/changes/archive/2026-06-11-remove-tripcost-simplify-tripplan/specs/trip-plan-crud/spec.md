## ADDED Requirements

### Requirement: Trip plans list action column contains only Edit and Delete buttons

The trip plans list table action column SHALL contain exactly two buttons per row: "Sửa" (Edit) and "Xóa" (Delete). All previous action buttons (status transition buttons such as "Điều xe", "Xuất phát", "Hoàn thành"; the "Hủy" cancel button; and the "+ Chi phí" button) SHALL be removed.

#### Scenario: Action column shows only Sửa and Xóa

- **WHEN** the user views the trip plans list
- **THEN** each row's action column contains exactly "Sửa" and "Xóa" buttons and no other buttons

## REMOVED Requirements

### Requirement: Add cost to a trip plan

**Reason**: The "+ Chi phí" button and CostModal are removed as part of the TripCost catalog removal. Cost entry is now handled exclusively within the create and edit forms.
**Migration**: Use the EditTripModal to update cost slot values on an existing trip plan.

### Requirement: Create trip plan via modal form — cost section uses TripCost catalog select

**Reason**: TripCost catalog is removed. The cost section now uses free-form amount inputs. See `trip-cost-freeform-entry` spec.
**Migration**: The cost section select dropdowns are replaced with plain amount inputs.
