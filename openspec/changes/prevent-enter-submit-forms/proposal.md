## Why

Pressing Enter inside any text input on a form currently triggers form submission via the browser's default HTML form behaviour. This causes accidental submissions before users finish filling in all fields, which is especially problematic in complex forms like Trip Plans that have many inputs across multiple sections.

## What Changes

- All `<form>` elements in create/edit modal dialogs will suppress the Enter key so that pressing Enter inside a text/number/date/select input does NOT submit the form.
- Textarea inputs are explicitly excluded — Enter must still insert a newline there.
- The only way to submit any form is to click its dedicated submit button.
- Applies to 12 `<form>` elements across 11 page files (all authenticated CRUD pages + the login page).

## Capabilities

### New Capabilities
- `form-enter-key-guard`: Prevent Enter key from triggering form submission across all create/update forms; submission is only allowed via the submit button.

### Modified Capabilities
<!-- No existing spec-level requirements are changing — this is purely a UX/interaction constraint added on top of existing form behaviour. -->

## Impact

- **Files changed**: `apps/web/src/app/login/page.tsx`, `apps/web/src/app/(authenticated)/carriers/page.tsx`, `customers/page.tsx`, `container-sizes/page.tsx`, `cost-templates/page.tsx`, `locations/page.tsx`, `service-types/page.tsx`, `trip-plans/page.tsx`, `users/page.tsx`, `vehicle-maintenance/page.tsx`, `vehicle-records/page.tsx`, `yard-moves/page.tsx`
- **No API changes**, no backend changes, no new dependencies.
- **No breaking changes** — behaviour change is additive (restricts accidental Enter submission only).
