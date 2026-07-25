# Development Workflow

## Starting a session

```bash
cd clinical-saas
nix develop          # NixOS only
docker-compose up -d # if database is not running
pnpm dev
```

This launches Turborepo, which starts both `@repo/web` and `@repo/api` in watch mode.

---

## Working on a single package

Run a command scoped to one workspace:

```bash
# Frontend only
pnpm --filter @repo/web dev

# Backend only
pnpm --filter @repo/api dev

# Database package
pnpm --filter @repo/database build
```

---

## Adding a dependency

```bash
# Add to a specific workspace
pnpm --filter @repo/web add <package>

# Add to root (dev dependency)
pnpm add -Dw <package>
```

---

## Adding a new workspace package

1. Create the directory under `apps/` or `packages/`.
2. Add a `package.json` with a scoped name (e.g. `@repo/shared`).
3. Register it in `pnpm-workspace.yaml` if it falls outside `apps/*` or `packages/*`.
4. Reference it in other packages via `"@repo/shared": "workspace:*"`.

---

## TypeScript

Each package has its own `tsconfig.json`. The root `turbo.json` ensures `build` tasks run in dependency order, so types from `@repo/database` are always built before consumers.

Check types without emitting:

```bash
pnpm --filter @repo/web exec tsc --noEmit
pnpm --filter @repo/api exec tsc --noEmit
```

---

## Linting

```bash
# Lint everything via Turborepo
pnpm lint

# Lint a single package
pnpm --filter @repo/api lint
```

---

## Database workflows

Run the following Prisma commands from the `packages/database` directory:

```bash
# Generate the Prisma client
pnpm --filter @repo/database generate

# Push schema changes to the database (dev only)
pnpm --filter @repo/database push

# Open Prisma Studio (visual DB browser)
pnpm --filter @repo/database studio
```

Always copy the root `.env` into `packages/database/` so Prisma can resolve `DATABASE_URL`:

```bash
cp .env packages/database/.env
```

---

## Creating a new NestJS module

```bash
cd apps/api
npx nest generate module <name>
npx nest generate controller <name>
npx nest generate service <name>
```

This scaffolds a module, controller, and service under `src/<name>/` and registers the module in `app.module.ts`.

---

## Creating a new Next.js route

The project uses the App Router. Add a directory under `apps/web/app/`:

```
apps/web/app/
  patients/
    page.tsx        -> /patients
    [id]/
      page.tsx      -> /patients/:id
```

Each `page.tsx` exports a default React component rendered at that route.

---

## Environment variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | `.env` (root + `packages/database/`) | PostgreSQL connection string |
| `PRISMA_QUERY_ENGINE_BINARY` | Set by `flake.nix` shell hook | NixOS Prisma binary path |
| `PRISMA_QUERY_ENGINE_LIBRARY` | Set by `flake.nix` shell hook | NixOS Prisma library path |
| `PRISMA_SCHEMA_ENGINE_BINARY` | Set by `flake.nix` shell hook | NixOS Prisma binary path |

---

## Git workflow

```bash
git checkout -b feat/your-feature
# make changes
git add .
git commit -m "feat: description"
git push -u origin feat/your-feature
```

Create a pull request against `main`. Turborepo caching ensures CI only rebuilds changed packages.

---

## Resetting the environment

```bash
# Stop and remove database container + volume
docker-compose down -v

# Remove all node_modules and build artifacts
pnpm clean -r

# Reinstall from scratch
pnpm install
```
