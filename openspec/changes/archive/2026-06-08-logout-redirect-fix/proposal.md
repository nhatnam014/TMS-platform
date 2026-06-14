## Why

After logout, pressing the browser Back button (or navigating directly to an authenticated route) causes the Next.js App Router to serve cached RSC payloads — bypassing middleware — so authenticated pages render with no valid cookie, flooding the UI with 401/403 API errors. The fix replaces the soft client-side navigation (`router.push`) with a hard browser redirect (`window.location.href`) that forces a fresh HTTP request, runs middleware, and clears the router cache.

## What Changes

- Replace `router.push("/login")` with `window.location.href = "/login"` in the logout handler inside `NavSidebar`
- Remove the now-unused `useRouter` hook call from `NavSidebar`

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `jwt-authentication`: The logout flow's post-action navigation behavior changes — hard redirect instead of soft SPA navigation, ensuring the router cache is flushed and middleware re-evaluates auth on the next request

## Impact

- **Modified file**: `apps/web/src/components/nav-sidebar.tsx` (2-line change)
- **No API changes**, no backend impact, no new dependencies
- Users who previously saw auth errors after logout will now land on the login page cleanly
- Browser Back after logout will not restore an authenticated page (middleware blocks it)
