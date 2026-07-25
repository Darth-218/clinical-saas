# Deployment

## Overview

This document covers strategies for deploying the Clinical Management System beyond local development. The monorepo produces two deployable artifacts: the Next.js frontend and the NestJS backend.

---

## Build for production

```bash
pnpm build
```

Turborepo runs each package's `build` script in dependency order:

| Package | Build output |
|---------|-------------|
| `@repo/database` | `packages/database/dist/` |
| `@repo/web` | `apps/web/.next/` |
| `@repo/api` | `apps/api/dist/` |

---

## Frontend deployment

### Vercel (recommended for Next.js)

1. Connect the repository to Vercel.
2. Set the **Root Directory** to `apps/web`.
3. Vercel auto-detects Next.js and configures the build:
   ```
   Build command: pnpm build
   Output directory: .next
   ```
4. Add the `DATABASE_URL` environment variable in the Vercel dashboard.

### Docker

```dockerfile
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/web build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/.next/ ./.next/
COPY --from=builder /app/apps/web/node_modules/ ./node_modules/
COPY --from=builder /app/apps/web/package.json ./
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## Backend deployment

### Docker

```dockerfile
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/api build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist/ ./dist/
COPY --from=builder /app/apps/api/node_modules/ ./node_modules/
COPY --from=builder /app/apps/api/package.json ./
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### Docker Compose (full stack)

```yaml
version: "3.8"

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: clinical_saas
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile  # Not yet created — see Dockerfile templates above
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/clinical_saas?schema=public
    depends_on:
      - db
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile  # Not yet created — see Dockerfile templates above
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001
    depends_on:
      - api
    restart: unless-stopped

volumes:
  pgdata:
```

---

## Database migrations in production

Never use `prisma db push` in production. Use managed migrations:

```bash
# Generate a migration locally
pnpm --filter @repo/database exec prisma migrate dev --name <description>

# Apply pending migrations in production
pnpm --filter @repo/database exec prisma migrate deploy
```

The `migrate deploy` command applies only pending migrations without generating new ones, making it safe for CI/CD pipelines.

---

## Environment variables

### Required for all environments

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |

### Backend-specific

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `3001`) |
| `JWT_SECRET` | Secret for signing authentication tokens |
| `NODE_ENV` | `development` or `production` |

### Frontend-specific

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Public URL of the backend API |

---

## CI/CD considerations

- Run `pnpm lint` and `pnpm build` in CI to catch errors early.
- Use Turborepo's remote caching to speed up repeat builds.
- Cache `node_modules` and `.next` between pipeline runs.
- Run Prisma migration deploy as a pre-deploy step for the API.

---

## Health checks

Configure your container orchestrator to poll:

```
GET http://localhost:3001/api/health
```

A `200 OK` response indicates the API is ready to serve traffic.

---

## Security checklist for production

- [ ] Change all default database credentials.
- [ ] Set a strong `JWT_SECRET`.
- [ ] Enable TLS termination at the reverse proxy or load balancer.
- [ ] Restrict CORS origins to your production domain.
- [ ] Run database migrations via `prisma migrate deploy`, not `push`.
- [ ] Store secrets in a vault or environment manager, not in `.env` files.
