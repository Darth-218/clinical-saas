# Architecture

## Overview

The Clinical Management System is a multi-tenant SaaS platform built as a TypeScript monorepo. Turborepo manages the build graph, pnpm manages dependencies, and workspace packages enforce clear boundaries between frontend, backend, and shared infrastructure.

```
clinical-saas/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── api/          # NestJS backend (port 3001)
├── packages/
│   └── database/     # Prisma schema, client, and migrations
├── docs/             # Project documentation
├── turbo.json        # Turborepo task pipeline
├── flake.nix         # NixOS development environment
├── docker-compose.yml
└── pnpm-workspace.yaml
```

---

## Monorepo Boundaries

| Package | Importable as | Purpose |
|---------|---------------|---------|
| `apps/web` | `@repo/web` | UI, pages, client-side logic |
| `apps/api` | `@repo/api` | REST endpoints, auth, business logic |
| `packages/database` | `@repo/database` | Prisma schema, generated types, DB client |

### Dependency graph

```
@repo/web  ──depends on──>  @repo/database
@repo/api  ──depends on──>  @repo/database
```

Neither `apps/web` nor `apps/api` depend on each other directly. All shared data contracts flow through `packages/database`.

---

## Frontend (`apps/web`)

- **Framework:** Next.js 14 with the App Router (`app/` directory).
- **Styling:** Tailwind CSS with PostCSS and Autoprefixer.
- **Port:** 3000 (configurable in `package.json` scripts).

### Key directories

| Path | Contents |
|------|----------|
| `app/layout.tsx` | Root layout and global metadata |
| `app/page.tsx` | Landing page |
| `app/globals.css` | Tailwind directives |
| `public/` | Static assets |

---

## Backend (`apps/api`)

- **Framework:** NestJS 10 on Express.
- **Port:** 3001.
- **Entry point:** `src/main.ts` boots the NestFactory and enables CORS.

### Key directories

| Path | Contents |
|------|----------|
| `src/main.ts` | Application bootstrap |
| `src/app.module.ts` | Root module |

Modules for auth, patients, appointments, and tenancy will be added under `src/` as the project evolves.

---

## Database (`packages/database`)

- **ORM:** Prisma with PostgreSQL.
- **Schema location:** `prisma/schema.prisma`.
- **Generated client:** Output to `node_modules/.prisma/client`. Consumers import directly from `@prisma/client`.

Both `@repo/web` and `@repo/api` import the Prisma client and generated types from this package, ensuring a single source of truth for data models.

---

## Build Pipeline (Turborepo)

Defined in `turbo.json`:

| Task | Behavior |
|------|----------|
| `build` | Depends on upstream `build` tasks; caches `.next/**` and `dist/**` |
| `dev` | Not cached; runs persistently until stopped |
| `lint` | Depends on upstream `build` tasks |
| `clean` | Not cached; removes build artifacts |

Running `pnpm dev` at the root triggers the `dev` task across all workspaces in parallel via Turborepo.

---

## Environment Isolation

Each workspace package has its own `node_modules`, `tsconfig.json`, and build scripts. Internal dependencies use the `workspace:*` protocol so pnpm resolves them as symlinks to local source rather than registry tarballs.

---

## NixOS Integration

The `flake.nix` at the project root provisions a `devShells.x86_64-linux.default` that includes:

- `nodejs_20`
- `nodePackages.pnpm`
- `docker-compose`
- `openssl`
- `prisma-engines`

The `shellHook` exports three environment variables that point Prisma to the natively compiled engine binaries, avoiding the dynamic linker failures common on NixOS.

---

## Planned Services

| Service | Technology | Port |
|---------|-----------|------|
| Frontend UI | Next.js | 3000 |
| Backend API | NestJS | 3001 |
| Database | PostgreSQL 15 | 5432 |
| Database GUI | Prisma Studio | On demand |
