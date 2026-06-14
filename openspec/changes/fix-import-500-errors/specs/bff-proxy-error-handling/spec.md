## ADDED Requirements

### Requirement: BFF proxy returns 502 when upstream NestJS is unreachable

The system SHALL wrap the `proxyRequest` function in a try-catch so that any network-level error (ECONNREFUSED, ETIMEDOUT, fetch failure) returns HTTP 502 Bad Gateway with a JSON body `{ message: "Service unavailable" }` instead of an unhandled Next.js 500 crash. The original error MUST be logged to `console.error` so it appears in server logs.

#### Scenario: NestJS backend is down when request arrives

- **WHEN** the BFF proxy attempts to forward a request to NestJS and receives ECONNREFUSED
- **THEN** the browser receives HTTP 502 with body `{ "message": "Service unavailable" }` and the error is logged server-side

#### Scenario: NestJS backend is up and returns a normal response

- **WHEN** the BFF proxy successfully forwards a request and NestJS returns 200
- **THEN** the browser receives 200 with the NestJS body unchanged (no regression)

#### Scenario: Proxy still returns 401 when tms_token cookie is missing

- **WHEN** a request arrives without the tms_token cookie (before any fetch attempt)
- **THEN** the route handler returns 401 as before (the new try-catch does not affect this path)
