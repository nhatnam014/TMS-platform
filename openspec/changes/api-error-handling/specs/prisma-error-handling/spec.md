## ADDED Requirements

### Requirement: Prisma unique-constraint errors return 409

When a Prisma `PrismaClientKnownRequestError` with code `P2002` is not caught by service-level code, the system SHALL return HTTP 409 with a structured JSON body containing a user-readable `message`.

#### Scenario: Unhandled unique constraint violation

- **WHEN** a Prisma P2002 error propagates past service-level catch blocks
- **THEN** the API returns HTTP 409 with `{ statusCode: 409, message: "Dữ liệu đã tồn tại" }`

### Requirement: Prisma foreign-key constraint errors return 422

When a `PrismaClientKnownRequestError` with code `P2003` occurs (referenced entity does not exist), the system SHALL return HTTP 422 with a structured JSON body.

#### Scenario: Invalid foreign key on create

- **WHEN** a create request references a `locationId`, `customerId`, `serviceTypeId`, `carrierId`, or `containerSizeId` that does not exist in the database
- **THEN** the API returns HTTP 422 with `{ statusCode: 422, message: "Dữ liệu tham chiếu không hợp lệ hoặc không còn tồn tại" }` instead of HTTP 500

### Requirement: Prisma record-not-found errors return 404

When a `PrismaClientKnownRequestError` with code `P2025` occurs (record targeted by update/delete not found), the system SHALL return HTTP 404.

#### Scenario: Record deleted between read and update

- **WHEN** an update or delete targets a record that was removed between the service's existence check and the Prisma write
- **THEN** the API returns HTTP 404 with `{ statusCode: 404, message: "Bản ghi không tồn tại" }`

### Requirement: Prisma unknown database errors return 422

When a `PrismaClientUnknownRequestError` occurs (e.g., Postgres numeric overflow, constraint violation not mapped by Prisma), the system SHALL return HTTP 422 with a user-readable message and SHALL log the raw error server-side.

#### Scenario: Numeric field overflow

- **WHEN** a value exceeds the database column's numeric precision (e.g., a `Decimal(10,7)` field receiving a value that causes Postgres error `22003`)
- **THEN** the API returns HTTP 422 with `{ statusCode: 422, message: "Dữ liệu không hợp lệ (lỗi cơ sở dữ liệu)" }` instead of HTTP 500
- **AND** the raw error is logged to server console for debugging

### Requirement: All Prisma error responses use structured JSON

All error responses from the Prisma exception filter SHALL be JSON objects with at least `statusCode` (number) and `message` (string) fields, consistent with the format used by NestJS `HttpException` subclasses.

#### Scenario: Frontend can read error message

- **WHEN** the frontend `catch` block receives a non-ok response from `/api/*`
- **THEN** `await res.json()` returns an object with a `message` field that can be displayed in a toast notification
