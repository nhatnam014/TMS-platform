## ADDED Requirements

### Requirement: Multi-select checkboxes on in-scope list pages
The list pages for trip plans, vehicle records, service types, container sizes, cost templates, yard moves, customers, carriers, and locations SHALL each display a checkbox on every row and a "select all" checkbox in the table header, scoped to the rows currently rendered on the page.

#### Scenario: Selecting an individual row
- **WHEN** the user checks a row's checkbox
- **THEN** that row is marked selected and the count of selected rows is tracked

#### Scenario: Select-all checkbox selects all visible rows
- **WHEN** the user checks the header "select all" checkbox
- **THEN** every row currently rendered on the page becomes selected

#### Scenario: Selection is cleared on list refresh
- **WHEN** the page's data is refetched (pagination change, filter/search change, or after a bulk delete completes)
- **THEN** all previously selected rows are cleared

### Requirement: Bulk delete action bar and confirmation dialog
When one or more rows are selected, the page SHALL display a "Delete selected (N)" action showing the current selection count. Activating it SHALL open a confirmation dialog stating the count before any delete request is sent. The delete SHALL only proceed if the user explicitly confirms.

#### Scenario: Action bar appears once a row is selected
- **WHEN** at least one row is selected
- **THEN** a "Delete selected (N)" action becomes visible, where N is the number of selected rows

#### Scenario: Action bar is hidden with no selection
- **WHEN** no rows are selected
- **THEN** the "Delete selected" action is not shown

#### Scenario: Confirming triggers the bulk delete request
- **WHEN** the user activates "Delete selected (N)" and confirms the dialog
- **THEN** a single bulk-delete request is sent containing all selected ids

#### Scenario: Cancelling the confirmation makes no request
- **WHEN** the user activates "Delete selected (N)" but cancels the confirmation dialog
- **THEN** no bulk-delete request is sent and the selection is preserved

#### Scenario: Result summary is shown after the request completes
- **WHEN** the bulk-delete request completes
- **THEN** the UI shows how many records were deleted and, if any were skipped, how many were skipped and why

### Requirement: Bulk delete API contract
Each in-scope resource SHALL expose `POST /:resource/bulk-delete` accepting `{ ids: string[] }` and requiring JWT authentication (same guard as that resource's existing single-record delete/update route). The response SHALL be `{ deleted: string[], skipped: { id: string, reason: string }[] }`. An id that does not correspond to an existing record SHALL be treated as skipped (not an error for the whole request).

#### Scenario: All ids delete successfully
- **WHEN** a bulk-delete request is made with ids that are all safe to delete
- **THEN** the response has all ids in `deleted` and an empty `skipped` array

#### Scenario: Some ids are skipped
- **WHEN** a bulk-delete request includes an id that cannot be deleted (e.g. referenced by another record, or not found)
- **THEN** that id is omitted from `deleted`, included in `skipped` with a reason, and all other valid ids are still deleted

#### Scenario: Empty ids array is rejected
- **WHEN** a bulk-delete request is made with an empty `ids` array
- **THEN** the API responds with a validation error and deletes nothing

### Requirement: Bulk delete trip plans
`POST /trip-plans/bulk-delete` SHALL hard-delete each given trip plan id, matching the existing single-delete behavior of `DELETE /trip-plans/:id`, and SHALL record an audit log entry for each deleted trip plan.

#### Scenario: Bulk delete removes selected trip plans
- **WHEN** a bulk-delete request is made for existing trip plan ids
- **THEN** each is deleted and no longer appears in subsequent trip plan list requests

### Requirement: Bulk delete vehicle records
`POST /vehicle-records/bulk-delete` SHALL hard-delete each given vehicle record id, matching the existing single-delete behavior of `DELETE /vehicle-records/:id`, and SHALL record an audit log entry for each deleted vehicle record.

#### Scenario: Bulk delete removes selected vehicle records
- **WHEN** a bulk-delete request is made for existing vehicle record ids
- **THEN** each is deleted and no longer appears in subsequent vehicle record list requests

### Requirement: Bulk delete service types
`POST /service-types/bulk-delete` SHALL hard-delete each given service type id, skipping (with reason) any id referenced by a trip plan, matching the existing 409 guard used by `DELETE /service-types/:id`.

#### Scenario: Referenced service type is skipped
- **WHEN** a bulk-delete request includes a service type id that is referenced by at least one trip plan
- **THEN** that id is included in `skipped` with a reason indicating it is referenced by trip plans, and it is not deleted

### Requirement: Bulk delete container sizes
`POST /container-sizes/bulk-delete` SHALL hard-delete each given container size id, skipping (with reason) any id referenced by a trip plan, matching the existing 409 guard used by `DELETE /container-sizes/:id`.

#### Scenario: Referenced container size is skipped
- **WHEN** a bulk-delete request includes a container size id that is referenced by at least one trip plan
- **THEN** that id is included in `skipped` with a reason indicating it is referenced by trip plans, and it is not deleted

### Requirement: Bulk delete cost templates
`POST /cost-templates/bulk-delete` SHALL hard-delete each given cost template id, matching the existing single-delete behavior of `DELETE /cost-templates/:id`.

#### Scenario: Bulk delete removes selected cost templates
- **WHEN** a bulk-delete request is made for existing cost template ids
- **THEN** each is deleted and no longer appears in subsequent cost template list requests

### Requirement: Bulk delete yard moves
`POST /yard-moves/bulk-delete` SHALL hard-delete each given yard move id. This is a new hard-delete capability for yard moves; the existing single-record `PATCH /yard-moves/:id` deactivate (soft-delete) flow remains unchanged and unaffected. Each deleted yard move SHALL record an audit log entry.

#### Scenario: Bulk delete removes selected yard moves
- **WHEN** a bulk-delete request is made for existing yard move ids
- **THEN** each is hard-deleted and no longer appears in subsequent yard move list requests

#### Scenario: Single-record deactivate is unaffected
- **WHEN** a user deactivates a single yard move via the existing per-row action
- **THEN** that yard move is soft-deleted (`isActive: false`) exactly as before, unrelated to the bulk-delete endpoint

### Requirement: Bulk delete customers
`POST /customers/bulk-delete` SHALL hard-delete each given customer id, skipping (with reason) any id referenced by at least one trip plan. This is a new hard-delete capability for customers; the existing single-record `PATCH /customers/:id` deactivate (soft-delete) flow remains unchanged. Each deleted customer SHALL record an audit log entry.

#### Scenario: Referenced customer is skipped
- **WHEN** a bulk-delete request includes a customer id referenced by at least one trip plan
- **THEN** that id is included in `skipped` with a reason indicating it is referenced by trip plans, and it is not deleted

#### Scenario: Unreferenced customer is deleted
- **WHEN** a bulk-delete request includes a customer id with no trip plan referencing it
- **THEN** that customer is hard-deleted and no longer appears in subsequent customer list requests

#### Scenario: Single-record deactivate is unaffected
- **WHEN** a user deactivates a single customer via the existing per-row action
- **THEN** that customer is soft-deleted (`isActive: false`) exactly as before, unrelated to the bulk-delete endpoint

### Requirement: Bulk delete carriers
`POST /carriers/bulk-delete` SHALL hard-delete each given carrier id, skipping (with reason) any id referenced by at least one trip plan. This is a new hard-delete capability for carriers; the existing single-record `PATCH /carriers/:id` deactivate (soft-delete) flow remains unchanged. Each deleted carrier SHALL record an audit log entry.

#### Scenario: Referenced carrier is skipped
- **WHEN** a bulk-delete request includes a carrier id referenced by at least one trip plan
- **THEN** that id is included in `skipped` with a reason indicating it is referenced by trip plans, and it is not deleted

#### Scenario: Unreferenced carrier is deleted
- **WHEN** a bulk-delete request includes a carrier id with no trip plan referencing it
- **THEN** that carrier is hard-deleted and no longer appears in subsequent carrier list requests

#### Scenario: Single-record deactivate is unaffected
- **WHEN** a user deactivates a single carrier via the existing per-row action
- **THEN** that carrier is soft-deleted (`isActive: false`) exactly as before, unrelated to the bulk-delete endpoint

### Requirement: Bulk delete locations
`POST /locations/bulk-delete` SHALL hard-delete each given location id. This is a new hard-delete capability for locations; the existing single-record `PATCH /locations/:id` deactivate (soft-delete) flow remains unchanged. Each deleted location SHALL record an audit log entry.

#### Scenario: Bulk delete removes selected locations
- **WHEN** a bulk-delete request is made for existing location ids
- **THEN** each is hard-deleted and no longer appears in subsequent location list requests

#### Scenario: Single-record deactivate is unaffected
- **WHEN** a user deactivates a single location via the existing per-row action
- **THEN** that location is soft-deleted (`isActive: false`) exactly as before, unrelated to the bulk-delete endpoint
