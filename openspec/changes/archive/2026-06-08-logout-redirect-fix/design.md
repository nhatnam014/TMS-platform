## Context

The Next.js App Router maintains an in-memory **Router Cache** (client-side) that stores RSC payloads per segment. When `router.push()` is used for logout navigation, the cache is not invalidated. If the user then navigates back (browser Back, direct URL, or any client-initiated navigation), the router may serve the cached authenticated page payload without issuing a new HTTP request to the server — meaning middleware never runs and the cookie state is never re-checked.

The current logout handler in `NavSidebar`:

```javascript
async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  router.push("/login");
}
```

`router.push` is a soft SPA navigation. After the server-side cookie is deleted, the client React tree is still alive and the router cache still holds authenticated page payloads.

## Goals / Non-Goals

**Goals:**

- After logout, any navigation to an authenticated route must go through a fresh HTTP request (and thus middleware)
- Eliminate the window of time where cached authenticated pages render without a valid cookie
- Remove the `useRouter` dependency from `NavSidebar` (no longer needed)

**Non-Goals:**

- Changing cookie structure, JWT validation, or any server-side auth logic
- Changing the logout API endpoint behavior
- Handling session expiry (token expiring while app is open — separate concern)
- Adding any new UI or feedback (toast notifications for logout are already handled)

## Decisions

### Decision: Use `window.location.href` instead of `router.push`

**Choice**: Replace `router.push("/login")` with `window.location.href = "/login"`.

**Rationale**:

- `window.location.href` triggers a full browser navigation (equivalent to typing a URL)
- This completely flushes the Next.js Router Cache
- The browser sends a fresh HTTP request to `/login`
- Middleware runs on this fresh request
- The React component tree is fully torn down and rebuilt from scratch
- No cached authenticated payloads survive

**Alternative considered**: `router.refresh()` + `router.push("/login")`

- `router.refresh()` re-fetches server components but does not clear the Router Cache for other segments
- Subsequent Back navigation could still restore cached pages
- More complex, less reliable

**Alternative considered**: `router.replace("/login")` instead of `router.push`

- Still a soft navigation — same cache problem
- Prevents Back navigation (replacing history entry) but does not clear cache for other routes
- Does not solve the root problem

**Alternative considered**: Next.js `redirect()` in a Server Action

- Would require converting the logout to a Server Action
- More complex refactor for no additional benefit over `window.location.href`

## Risks / Trade-offs

- **Browser Back from login page**: With `window.location.href`, pressing Back from login will trigger a full HTTP request to the previous URL. Middleware will check the cookie (absent) and redirect back to `/login`. This is the correct, desired behavior.
- **Brief flash**: Full page reload is slightly slower than SPA navigation (white flash during reload). Acceptable for a logout action — not a hot path.
- **`useRouter` removal**: The `useRouter` import becomes unused. Removing it is a clean-up, not a risk.
