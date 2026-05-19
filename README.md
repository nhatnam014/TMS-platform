# TMS Platform

Transportation Management System — Quản lý vận tải container.

## Tech Stack

- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: Next.js (web dashboard + admin panel)
- **Monorepo**: Turborepo + pnpm workspaces
- **CI/CD**: GitHub Actions

## Quick Start

```bash
# 1. Clone & install
git clone <repo-url> && cd tms-platform
pnpm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Setup environment
cp .env.example .env

# 4. Database setup
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Start development
pnpm dev
```

## Project Structure

```
tms-platform/
├── apps/
│   ├── api/          # NestJS REST API (port 4000)
│   ├── web/          # Next.js dashboard (port 3000)
│   └── admin/        # Next.js admin panel (port 3001)
├── packages/
│   ├── db/           # Prisma schema + client (@tms/db)
│   ├── shared/       # Types, DTOs, enums (@tms/shared)
│   ├── config/       # Shared TS/ESLint/Prettier configs
│   ├── ui/           # Shared React components
│   ├── utils/        # Helper functions
│   └── logger/       # Logging utility
├── docker-compose.yml
├── turbo.json
└── .github/workflows/ci.yml
```

## Git Conventions

Branch naming: `feature/TMS-123-add-trip-plan`, `fix/TMS-456-cost-calc`

Commit format (Conventional Commits):
```
feat(api): add trip plan CRUD endpoints
fix(db): correct container size enum mapping
chore(ci): add staging deploy step
```

## API Documentation

Start the API, then visit: http://localhost:4000/docs
