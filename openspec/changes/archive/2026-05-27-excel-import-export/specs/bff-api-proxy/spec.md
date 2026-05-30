## MODIFIED Requirements

### Requirement: Next.js API route handlers proxy mutations to NestJS
The system SHALL provide Next.js route handlers under `apps/web/src/app/api/` that forward browser requests to the NestJS API at `http://localhost:4000/api/v1/`. Each handler MUST read the `tms_token` cookie from the incoming request and attach it as an `Authorization: Bearer` header in the outgoing NestJS request. The handler MUST forward the HTTP method, path, query parameters, and request body unchanged. The handler MUST use `arrayBuffer()` for both the request body and the response body to preserve binary data. All non-hop-by-hop response headers from NestJS (excluding `transfer-encoding`, `connection`, `keep-alive`) MUST be forwarded to the browser.

#### Scenario: BFF route forwards POST with Bearer token
- **WHEN** the browser sends `POST /api/trip-plans` with a JSON body and a valid `tms_token` cookie
- **THEN** the route handler sends `POST http://localhost:4000/api/v1/trip-plans` with the same body and `Authorization: Bearer <token>` header

#### Scenario: BFF route returns the NestJS response status and body
- **WHEN** NestJS responds with `201 Created` and a trip plan JSON body
- **THEN** the browser receives `201 Created` with the same JSON body

#### Scenario: Missing cookie in BFF route returns 401
- **WHEN** the browser sends a request to a BFF route without the `tms_token` cookie
- **THEN** the route handler returns `401 Unauthorized` without forwarding to NestJS

#### Scenario: BFF route forwards multipart file upload without corruption
- **WHEN** the browser sends `POST /api/import/vehicles` with a multipart/form-data body containing an `.xlsx` file
- **THEN** the route handler forwards the raw binary body to NestJS unchanged, and NestJS receives a valid xlsx file

#### Scenario: BFF route forwards binary Excel download response
- **WHEN** NestJS responds with `200 OK`, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, and a binary body
- **THEN** the browser receives the binary body without corruption and the file can be opened in Excel

#### Scenario: Content-Disposition header is forwarded for file downloads
- **WHEN** NestJS responds with `Content-Disposition: attachment; filename="ke-hoach-xe.xlsx"`
- **THEN** the browser response includes the same `Content-Disposition` header, triggering a named file save dialog
