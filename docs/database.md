# Database

## Overview

The project uses **Prisma ORM** with a **PostgreSQL 15** backend. The database package lives at `packages/database/` and serves as the single source of truth for all data models shared across the monorepo.

---

## Connection

The connection string is defined in the root `.env` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/clinical_saas?schema=public"
```

Prisma requires this file inside its own package directory. Copy it before running any Prisma commands:

```bash
cp .env packages/database/.env
```

---

## Local database

A PostgreSQL instance runs via Docker Compose:

```bash
docker-compose up -d     # start
docker-compose down      # stop
docker-compose down -v   # stop and delete data
```

Default credentials:

| Parameter | Value |
|-----------|-------|
| Host | `localhost` |
| Port | `5432` |
| User | `postgres` |
| Password | `password` |
| Database | `clinical_saas` |

---

## Prisma schema

The schema file will be located at:

```
packages/database/prisma/schema.prisma
```

> The schema is intentionally left empty at this stage. Models will be defined once the domain requirements are finalized.

### Adding models

1. Define your model in `schema.prisma`.
2. Generate the client:
   ```bash
   pnpm --filter @repo/database generate
   ```
3. Push to the database:
   ```bash
   pnpm --filter @repo/database push
   ```

### Generating migrations

For production-ready schema changes, use `prisma migrate` instead of `push`:

```bash
pnpm --filter @repo/database exec prisma migrate dev --name <migration_name>
```

This creates a versioned SQL migration file under `prisma/migrations/`.

---

## Using the client

Import the Prisma client from the shared package in any workspace:

```typescript
import { PrismaClient } from "@repo/database";

const prisma = new PrismaClient();

const users = await prisma.user.findMany();
```

The `@repo/database` package re-exports the generated `PrismaClient` and all model types.

---

## Prisma Studio

Open the visual database browser:

```bash
pnpm --filter @repo/database studio
```

This launches Prisma Studio on `http://localhost:5555`.

---

## NixOS considerations

On NixOS, Prisma engine binaries fail to run due to dynamic linker path differences. The `flake.nix` at the project root sets three environment variables inside the development shell:

```bash
PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines}/bin/query-engine"
PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines}/lib/libquery_engine.node"
PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
```

Always run Prisma commands inside `nix develop` on NixOS.

---

## Resetting the database

Drop all tables and start fresh:

```bash
# Nuclear option: delete the container volume
docker-compose down -v
docker-compose up -d

# Re-push the schema
pnpm --filter @repo/database push
```

---

## Future considerations

- Row-level security for multi-tenant isolation.
- Connection pooling via PgBouncer for production.
- Automated migration CI pipeline.
- Seed scripts for development data.
