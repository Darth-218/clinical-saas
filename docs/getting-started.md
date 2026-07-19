# Getting Started

This guide walks you through setting up the Clinical Management System monorepo on your local machine.

## Prerequisites

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Node.js | v18.0.0+ | Runtime |
| pnpm | v8.0.0+ | Package manager |
| Docker | Latest | Local PostgreSQL database |
| Git | Latest | Version control |

### NixOS Users

If you are running NixOS, you do not need to manually install Node.js or pnpm. The repository ships with a `flake.nix` that provisions everything.

```bash
nix develop
```

This drops you into a shell with Node.js 20, pnpm, Docker Compose, OpenSSL, and the Prisma engine binaries pre-configured. The environment variables `PRISMA_QUERY_ENGINE_BINARY`, `PRISMA_QUERY_ENGINE_LIBRARY`, and `PRISMA_SCHEMA_ENGINE_BINARY` are mapped to the natively compiled NixOS binaries so that `prisma generate` and `prisma db push` work without dynamic linker errors.

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd clinical-saas
```

### 2. Enter the development shell (NixOS only)

```bash
nix develop
```

Skip this step if you are on macOS, Ubuntu, or another non-NixOS system.

### 3. Start the database

```bash
docker-compose up -d
```

This spins up a PostgreSQL 15 Alpine container on port `5432` with the following default credentials:

| Parameter | Value |
|-----------|-------|
| User | `postgres` |
| Password | `password` |
| Database | `clinical_saas` |

> Change these credentials before deploying to any shared or production environment.

### 4. Configure environment variables

A `.env` file already exists at the project root. Verify it contains:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/clinical_saas?schema=public"
```

Once the `packages/database` package has a Prisma schema, copy this file into it:

```bash
cp .env packages/database/.env
```

### 5. Install dependencies

```bash
pnpm install
```

This installs dependencies for every workspace package (`apps/web`, `apps/api`, `packages/database`) and links internal workspace references.

### 6. Initialize the database (once a schema exists)

```bash
pnpm --filter @repo/database generate
pnpm --filter @repo/database push
```

- `generate` compiles the Prisma schema into a typed client.
- `push` applies the schema directly to the database without generating migrations.

### 7. Start the development servers

```bash
pnpm dev
```

Turborepo launches both the Next.js frontend and the NestJS backend concurrently.

---

## Verify Everything Works

| Service | URL |
|---------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API (NestJS) | http://localhost:3001 |
| PostgreSQL | localhost:5432 |

---

## Troubleshooting

### Prisma engine errors on NixOS

Ensure you are inside `nix develop` before running any Prisma commands. The flake sets the three required environment variables automatically.

### Port 5432 already in use

Another PostgreSQL instance or Docker container is occupying the port. Stop it or change the port mapping in `docker-compose.yml`.

### `pnpm: command not found`

You are not inside the Nix development shell. Run `nix develop` first, or install pnpm globally via `npm install -g pnpm`.
