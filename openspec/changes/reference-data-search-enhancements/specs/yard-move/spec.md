## MODIFIED Requirements

### Requirement: YardMoveFilters type

The `YardMoveFilters` interface in `@tms/shared` SHALL include: `locationId?: string`, `status?: YardMoveStatus`, `search?: string`, `dateFrom?: string`, `dateTo?: string`.

#### Scenario: Filters accepted by yard-move service

- **WHEN** the yard-move service `findAll` is called with `{ search: "MSCU", dateFrom: "2025-01-01" }`
- **THEN** the service builds a Prisma `where` clause incorporating both conditions
