## ADDED Requirements

### Requirement: Toast context and hook

The system SHALL provide a `ToastContext` and `useToast()` hook. Any client component MAY call `useToast()` to obtain `toast.success(message)` and `toast.error(message)` functions. The provider SHALL be mounted at the root layout level so all pages share a single toast queue.

#### Scenario: Hook available inside authenticated pages

- **WHEN** a client component inside the authenticated layout calls `useToast()`
- **THEN** it receives an object with `success` and `error` functions

#### Scenario: Hook available inside login page

- **WHEN** the login page client component calls `useToast()`
- **THEN** it receives an object with `success` and `error` functions

---

### Requirement: Toast overlay renderer

The system SHALL render a `<Toaster />` component fixed at the top-right of the viewport. It SHALL display all active toasts stacked vertically with the most recent at the top.

#### Scenario: Toast appears on trigger

- **WHEN** `toast.success(message)` or `toast.error(message)` is called
- **THEN** a toast card with the message appears in the top-right overlay within the same render cycle

#### Scenario: Multiple toasts stack

- **WHEN** multiple toasts are added before any dismiss
- **THEN** all active toasts are visible stacked vertically, most recent on top

---

### Requirement: Success toast auto-dismiss

Success toasts SHALL auto-dismiss after 3 seconds without user interaction.

#### Scenario: Auto-dismiss after 3 seconds

- **WHEN** a success toast is added
- **THEN** it is removed from the overlay automatically after 3000ms

#### Scenario: Manual dismiss before timeout

- **WHEN** user clicks the dismiss button on a success toast before 3 seconds
- **THEN** the toast is removed immediately

---

### Requirement: Error toast manual dismiss only

Error toasts SHALL NOT auto-dismiss. They MUST remain visible until the user explicitly dismisses them.

#### Scenario: Error toast persists

- **WHEN** an error toast is added
- **THEN** it remains visible until the user clicks the dismiss button

#### Scenario: Error toast dismissal

- **WHEN** user clicks the dismiss button on an error toast
- **THEN** the toast is removed immediately

---

### Requirement: Login toast notifications

The login flow SHALL display Vietnamese toast notifications for both success and failure outcomes.

#### Scenario: Successful login

- **WHEN** the user submits valid credentials and the API returns 2xx
- **THEN** a success toast with message "Đăng nhập thành công" is shown before redirect

#### Scenario: Invalid credentials

- **WHEN** the API returns a non-2xx response
- **THEN** an error toast with message "Tên đăng nhập hoặc mật khẩu không đúng" is shown

#### Scenario: Network error on login

- **WHEN** the login fetch throws a network exception
- **THEN** an error toast with message "Không thể kết nối máy chủ. Vui lòng thử lại." is shown

---

### Requirement: CRUD operation toast notifications

Every mutation in the authenticated pages SHALL fire a Vietnamese toast notification on completion. Success closes the modal/action and fires a success toast. Failure fires an error toast (and may also show inline error in modal).

#### Scenario: Create operation success

- **WHEN** a create API call returns 2xx
- **THEN** a success toast is shown with a Vietnamese message confirming the entity was created

#### Scenario: Create operation failure

- **WHEN** a create API call returns non-2xx
- **THEN** an error toast is shown with a Vietnamese error message

#### Scenario: Update operation success

- **WHEN** an update/edit API call returns 2xx
- **THEN** a success toast is shown with a Vietnamese message confirming the entity was updated

#### Scenario: Update operation failure

- **WHEN** an update/edit API call returns non-2xx
- **THEN** an error toast is shown with a Vietnamese error message

#### Scenario: Delete operation success

- **WHEN** a delete API call returns 2xx
- **THEN** a success toast is shown with a Vietnamese message confirming deletion

#### Scenario: Status transition success

- **WHEN** a status-change API call returns 2xx
- **THEN** a success toast is shown with a Vietnamese message confirming the transition

---

### Requirement: Toast visual design

Toasts SHALL be visually distinct by type: success uses green accent, error uses red accent. Each toast SHALL include a dismiss button. The overlay SHALL not block interaction with the page content.

#### Scenario: Success toast appearance

- **WHEN** a success toast is displayed
- **THEN** it shows a green color scheme with a checkmark indicator and the message text

#### Scenario: Error toast appearance

- **WHEN** an error toast is displayed
- **THEN** it shows a red color scheme with an X indicator and the message text

#### Scenario: Overlay non-blocking

- **WHEN** toasts are displayed
- **THEN** the user can still interact with page content (inputs, buttons, modals) beneath the toast overlay
