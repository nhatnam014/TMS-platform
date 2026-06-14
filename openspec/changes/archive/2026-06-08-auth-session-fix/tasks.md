## 1. Middleware JWT Expiry Validation

- [x] 1.1 In `apps/web/middleware.ts`: after confirming the cookie is present, add a try/catch block that base64url-decodes the JWT payload using `atob()` (convert `-` → `+` and `_` → `/` before decoding), parses the JSON, and checks `payload.exp * 1000 < Date.now()`. If expired or parse fails, create a redirect response to `/login`, call `response.cookies.delete("tms_token")`, and return it.

## 2. Login Cookie maxAge

- [x] 2.1 In `apps/web/src/app/api/auth/login/route.ts`: add `maxAge: 604800` to the `response.cookies.set(...)` call for `tms_token`, so the cookie persists for 7 days matching `ACCESS_TOKEN_EXPIRY`.

## 3. BFF /api/auth/me Route

- [x] 3.1 Create `apps/web/src/app/api/auth/me/route.ts` with a `GET` handler that reads `request.cookies.get("tms_token")?.value`. If absent, return `NextResponse.json({ message: "Unauthorized" }, { status: 401 })`. Otherwise, base64url-decode the JWT payload segment using `Buffer.from(token.split(".")[1], "base64url").toString()`, parse the JSON, and return `NextResponse.json({ id: payload.sub, username: payload.username, role: payload.role })`. Wrap in try/catch; on any error return 401.
