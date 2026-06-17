## MODIFIED Requirements

### Requirement: Filter bar shows only date range and status

The trip plans filter bar SHALL contain exactly:

- Date range: "Từ ngày" and "Đến ngày" date inputs
- Status: a `<select>` dropdown with options Tất cả / Kế hoạch / Đã điều xe / Đang vận chuyển / Hoàn thành / Hủy

The following controls SHALL be removed from the filter bar:

- Customer dropdown (was labeled "Khách hàng", filtered by customerId)
- Carrier dropdown (was labeled "Đơn vị VC", filtered by carrierId)
- Service type dropdown (was labeled "Dịch vụ", filtered by serviceTypeCode)

These entities are now searchable via the text search input instead.

#### Scenario: Filter bar renders without customer/carrier/service-type controls

- **WHEN** user opens the trip plans page
- **THEN** the filter bar shows only date range inputs and the status dropdown

#### Scenario: Status filter still works

- **WHEN** user selects "Hoàn thành" from the status dropdown
- **THEN** only COMPLETED trips are shown

#### Scenario: Active filter indicator reflects simplified state

- **WHEN** the active-filter check runs
- **THEN** it only checks dateFrom, dateTo, status, and search (not customerId/carrierId/serviceTypeCode)
