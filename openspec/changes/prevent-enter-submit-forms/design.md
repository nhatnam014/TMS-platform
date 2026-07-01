## Context

All create/edit forms in the TMS web app are raw HTML `<form onSubmit={handler}>` elements wrapped in custom modal components. Each page file defines its own local Modal component. There is no shared form library (no Ant Design Form, no React Hook Form). The browser's default behaviour is to submit the nearest form when the user presses Enter inside a text-like input — this causes accidental submissions in the current app.

The fix is a single `onKeyDown` handler placed on the `<form>` element. It intercepts keypress events bubbling up from every child input and cancels submission when Enter is pressed — except inside `<textarea>` elements where Enter must still insert a newline.

## Goals / Non-Goals

**Goals:**
- Block Enter-key form submission on all 12 `<form>` elements in the app.
- Keep submit button behaviour exactly as-is.
- Keep Enter working normally inside `<textarea>` inputs.

**Non-Goals:**
- Refactoring the Modal/form architecture.
- Adding a shared utility component — the one-liner is small enough to inline.
- Changing login-page behaviour beyond the same Enter-key guard.

## Decisions

**Decision 1 — `onKeyDown` on `<form>`, not on individual inputs**

Attaching the handler to the `<form>` root means all current and future inputs in that form are automatically covered by event bubbling. Attaching to individual inputs would require updating every `<input>` and `<select>` now and for every future field added.

Alternative considered: `onKeyPress` (deprecated in React 17+) — rejected.
Alternative considered: `type="button"` on the submit button — this would break `htmlType="submit"` semantics and prevent Enter from activating the button when it is focused.

**Decision 2 — Exclude `<textarea>` targets explicitly**

```tsx
onKeyDown={(e) => {
  if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
    e.preventDefault();
  }
}}
```

This is the minimal, correct guard. It checks the actual target element (the input that was focused when Enter was pressed), not the event's currentTarget (the form).

**Decision 3 — Inline the handler, no shared utility**

The handler is two lines. Extracting it to a shared utility would add indirection for negligible reuse benefit. If a shared form component is introduced later, this logic can be absorbed then.

## Risks / Trade-offs

- [Risk] A future developer adds a custom component that renders a non-`<textarea>` multi-line input → Enter would be blocked inside it.
  → Mitigation: The check is tag-based; any custom multi-line component built on `<textarea>` is automatically handled. Custom contenteditable elements would need special handling if introduced.

- [Risk] Login page: some users may rely on Enter to submit login. Blocking Enter there may feel unexpected.
  → Mitigation: Login is an intentional inclusion — consistent policy across all forms is cleaner. The submit button is prominently visible on the login page.

## Migration Plan

No backend or API changes. No database migrations. Deploy is a standard frontend build. Rollback is revert of the 12 `<form>` attribute additions.
