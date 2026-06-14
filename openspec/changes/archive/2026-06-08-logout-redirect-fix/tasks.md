## 1. Fix Logout Navigation

- [x] 1.1 In `apps/web/src/components/nav-sidebar.tsx`: replace `router.push("/login")` with `window.location.href = "/login"` in `handleLogout`, and remove the `useRouter` hook call and its import (`useRouter` from `next/navigation`)
