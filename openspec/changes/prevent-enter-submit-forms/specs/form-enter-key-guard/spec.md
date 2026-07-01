## ADDED Requirements

### Requirement: Enter key does not submit forms
All create and update forms in the application SHALL prevent the Enter key from triggering form submission. The only mechanism to submit a form is clicking the designated submit button.

#### Scenario: Enter key pressed inside a text input
- **WHEN** a user presses the Enter key while focus is inside a text, number, date, or select input within a create or update form
- **THEN** the form SHALL NOT be submitted

#### Scenario: Enter key pressed inside a textarea
- **WHEN** a user presses the Enter key while focus is inside a textarea input
- **THEN** a newline character SHALL be inserted (default browser behaviour preserved) and the form SHALL NOT be submitted

#### Scenario: Submit button clicked
- **WHEN** a user clicks the submit button of a create or update form
- **THEN** the form SHALL be submitted normally with all field values

#### Scenario: Enter key pressed while submit button is focused
- **WHEN** a user presses the Enter key while the submit button itself has focus
- **THEN** the form SHALL be submitted (browser activates the focused button)

### Requirement: Guard applies to all form contexts
The Enter key guard SHALL be applied consistently to all create and edit modal forms across the following pages: login, carriers, customers, container sizes, cost templates, locations, service types, trip plans, users, vehicle maintenance, vehicle records, and yard moves.

#### Scenario: New form field added to a guarded form
- **WHEN** a new input field is added inside a guarded `<form>` element
- **THEN** the Enter key guard SHALL apply to that new field automatically without additional changes
