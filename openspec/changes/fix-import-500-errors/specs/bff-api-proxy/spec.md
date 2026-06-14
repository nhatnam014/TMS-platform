## ADDED Requirements

### Requirement: BFF proxy handles network errors gracefully

The system SHALL ensure that all route handlers in `apps/web/src/app/api/[...path]/route.ts` return a structured JSON error response when the upstream fetch fails, rather than allowing an unhandled exception to propagate as an HTTP 500. See `bff-proxy-error-handling` spec for full requirements.

#### Scenario: Upstream fetch throws an unhandled exception

- **WHEN** the BFF proxy's `fetch()` call throws any error (network timeout, ECONNREFUSED, DNS failure)
- **THEN** the browser receives HTTP 502 with `{ "message": "Service unavailable" }` rather than an unstructured 500 response
