## Context

The TMS platform is a Turborepo monorepo with pnpm workspaces covering `apps/*` and `packages/*`. The backend is a NestJS app at `apps/api` (port 4000) with three modules: dashboard, trip-plan, vehicle. It uses Prisma + PostgreSQL via `@tms/db`, and shared types via `@tms/shared`.

There is currently no frontend. The API has no authentication — all endpoints are open. CORS is already configured to allow `http://localhost:3000`, and `turbo.json` already outputs `.next/**`, indicating the frontend was anticipated.

Key constraints:
- Must stay inside the existing `apps/*` workspace — no new workspace root needed
- `@tms/shared` is the sync contract between backend and frontend (shared types, DTOs, enums, label maps)
- `packages/ui` and `packages/utils` exist as directories but lack `package.json` — they cannot be consumed as workspace deps yet
- No `User` model exists in the Prisma schema — JWT auth requires adding one

## Goals / Non-Goals

**Goals:**
- Scaffold `apps/web` as a Next.js 15 App Router application within the existing Turborepo
- Add end-to-end JWT authentication: NestJS issues tokens, Next.js stores them in httpOnly cookies
- Implement BFF proxy pattern: Next.js route handlers forward browser mutations to NestJS
- Enable Server Components to fetch NestJS directly (server-to-server, no CORS boundary)
- Protect all existing NestJS API endpoints with `JwtAuthGuard`
- Initialize `packages/ui` and `packages/utils` as valid workspace packages

**Non-Goals:**
- OAuth / social login (not in scope)
- Role-based UI rendering (Role enum seeded but not enforced in UI for now)
- Real-time features (WebSocket, SSE)
- Mobile responsiveness beyond basic layout
- End-to-end tests (unit + type-check are sufficient for now)

## Decisions

### Decision 1: Token Storage — httpOnly Cookie

**Choice**: Store the JWT in an httpOnly, Secure, SameSite=Lax cookie named `tms_token`.

**Rationale**: httpOnly cookies cannot be read by JavaScript, eliminating XSS token theft. SameSite=Lax prevents CSRF for cross-site navigations. The cookie is automatically attached to all same-origin requests, making both BFF proxy routes and middleware protection zero-config on the browser side.

**Alternative considered**: `localStorage` — rejected because it is readable by any JS on the page, making XSS attacks trivially escalate to session theft.

---

### Decision 2: Hybrid Fetch Strategy — RSC Direct + BFF Proxy

**Choice**: Server Components fetch NestJS directly (`http://localhost:4000/api/v1/...`) using a `serverFetch` utility that reads the JWT via `cookies()`. Client Components and browser-initiated mutations use Next.js API route handlers at `/api/*` as a BFF proxy.

**Rationale**:
- RSC direct fetch avoids an extra network hop for reads — data is fetched and rendered server-side with no client round-trip
- BFF proxy is necessary for client-side mutations because the browser cannot read the httpOnly cookie to attach it to a direct NestJS request
- The combination gives the best of both: fast page loads (RSC) and secure mutations (BFF)

**Data flow**:
```
Page load:   Browser → Next.js RSC → NestJS :4000  (server-to-server)
Mutation:    Browser → Next.js /api/* → NestJS :4000  (BFF, reads cookie)
```

**Alternative considered**: Pure BFF (all traffic through Next.js API routes) — rejected because it adds latency to every page render and is unnecessary when the server can fetch directly.

---

### Decision 3: NestJS Auth Implementation — Passport JWT Strategy

**Choice**: Use `@nestjs/passport` + `passport-jwt` with a `JwtStrategy` that validates the Bearer token from the `Authorization` header. Protect all controllers with `@UseGuards(JwtAuthGuard)`.

**Rationale**: Standard NestJS auth pattern with first-party support from the NestJS team. `passport-jwt` is battle-tested and integrates cleanly with NestJS guards and decorators.

**Password hashing**: `bcrypt` with cost factor 12. Passwords are never stored in plaintext.

**Token expiry**: `ACCESS_TOKEN_EXPIRY` env var, defaulting to `7d` during development. A short-lived token with refresh is deferred (non-goal for this change).

---

### Decision 4: Next.js Middleware for Route Protection

**Choice**: A single `middleware.ts` at the `apps/web` root that checks for `tms_token` cookie on every request. Unauthenticated users are redirected to `/login`. The login route and Next.js static assets are excluded from the check.

**Rationale**: Centralized auth check in middleware avoids repeating the guard in every Server Component layout. Next.js middleware runs at the edge before any rendering, making it the correct place for session-level redirect logic.

---

### Decision 5: `packages/ui` and `packages/utils` Initialization

**Choice**: Add minimal `package.json` files to `packages/ui` and `packages/utils` so they are valid pnpm workspace packages that `apps/web` can list as dependencies. They start with stub `src/index.ts` exports.

**Rationale**: Without `package.json`, these directories cannot be referenced via `workspace:*` in any `apps/*` package.json. Initializing them now with a stub prevents broken dependency references as the frontend grows.

---

### Decision 6: User Model Design

**Choice**:
```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String   @map("password_hash")
  role         Role     @default(OPERATOR)
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  @@map("users")
}

enum Role { ADMIN  OPERATOR  VIEWER }
```

No email field for now — TMS is an internal tool with username-based login. The seed script creates one `ADMIN` user with a bcrypt-hashed password from `SEED_ADMIN_PASSWORD` env var.

## Risks / Trade-offs

- **Single access token, no refresh** → If the token expires, the user is redirected to login. Mitigation: default expiry set to `7d` for development comfort; short-lived + refresh tokens can be added in a follow-up change.

- **BFF proxy adds one extra hop for mutations** → Acceptable for a TMS internal tool where mutation throughput is low (dispatchers create a few dozen trips per day).

- **`packages/ui` and `packages/utils` start empty** → Apps depending on them will get an empty module. This is intentional — they're placeholders. Mitigation: `apps/web` imports from these packages only when components are actually added.

- **Password in seed script** → The seed reads from `SEED_ADMIN_PASSWORD` env var (not hardcoded). If the var is unset in production, the seed fails loudly rather than silently setting a weak default.

## Migration Plan

1. Run `pnpm install` at repo root to install new deps (NestJS JWT packages, Next.js, etc.)
2. Run `pnpm db:generate` — regenerate Prisma client after schema changes
3. Run `pnpm db:migrate` — apply the `add_users` migration
4. Run `SEED_ADMIN_PASSWORD=<secret> pnpm db:seed` — create the admin user
5. Run `turbo dev` — starts both `apps/api` (port 4000) and `apps/web` (port 3000) concurrently

**Rollback**: Drop the `users` table, revert the Prisma schema, remove the `AuthModule` import from `AppModule`, and delete `apps/web/`.

## Open Questions

- Should `JwtAuthGuard` be applied globally via `APP_GUARD` provider, or per-controller with `@UseGuards`? Per-controller is more explicit and safer when new endpoints are added without thinking about auth. **Recommendation**: per-controller for now.
- Cookie `Secure` flag — should it be set in development? Next.js sets it automatically in production. Explicitly setting it in dev would require HTTPS locally. **Recommendation**: let Next.js handle this via `NODE_ENV`.
