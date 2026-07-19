# API Reference

## Overview

The backend is a **NestJS** application running on port **3001**. It exposes REST endpoints consumed by the Next.js frontend.

> The API is in its initial scaffold state. This document will be expanded as controllers and services are implemented.

---

## Base URL

```
http://localhost:3001
```

CORS is enabled by default for local development.

---

## Planned resources

| Resource | Endpoint prefix | Description |
|----------|----------------|-------------|
| Users | `/api/users` | Clinician and admin accounts |
| Patients | `/api/patients` | Patient records |
| Appointments | `/api/appointments` | Scheduling and status |
| Auth | `/api/auth` | Login, registration, token management |

---

## Request format

All endpoints accept and return JSON:

```
Content-Type: application/json
```

### Example request

```bash
curl -X GET http://localhost:3001/api/health
```

---

## Response format

Successful responses:

```json
{
  "data": { ... }
}
```

Error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## Health check

A health check endpoint is recommended for container orchestration and monitoring:

```typescript
// src/health.controller.ts
import { Controller, Get } from "@nestjs/common";

@Controller("api")
export class HealthController {
  @Get("health")
  health() {
    return { status: "ok" };
  }
}
```

---

## Adding endpoints

1. Generate a module:
   ```bash
   cd apps/api
   npx nest generate module <resource>
   ```

2. Generate a controller:
   ```bash
   npx nest generate controller <resource>
   ```

3. Generate a service:
   ```bash
   npx nest generate service <resource>
   ```

4. Register the module in `src/app.module.ts`.

---

## Authentication

Planned approach:

- JWT-based authentication.
- `@nestjs/jwt` for token signing and verification.
- Route guards applied per-controller or globally.
- Tokens issued at `/api/auth/login`.

---

## Multi-tenancy

Data isolation will be enforced at the service layer. Each request will carry a tenant identifier (via JWT claim or header), and Prisma queries will be scoped accordingly.

---

## Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Set in `.env` |
| `PORT` | Server listen port | `3001` |
| `JWT_SECRET` | Secret for signing JWTs | To be configured |

---

## Useful commands

```bash
# Run in watch mode
pnpm --filter @repo/api dev

# Build for production
pnpm --filter @repo/api build

# Run production build
node apps/api/dist/main.js
```
