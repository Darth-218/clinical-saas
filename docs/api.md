# API Reference

## Overview

The backend is a **NestJS** application running on port **3001**. It exposes REST endpoints consumed by the Next.js frontend.

---

## Base URL

```
http://localhost:3001/api/v1
```

CORS is enabled by default for local development.

---

## Multi-Tenancy

The `clinicId` (tenant ID) is **never** passed in the URL or request body for operational routes. It is securely extracted from the authenticated user's JWT by the NestJS backend to enforce strict multi-tenancy and data isolation. Every data query is scoped to the tenant extracted from the token.

### JWT payload

```json
{
  "sub": "user-id",
  "role": "CLINIC_ADMIN",
  "clinicId": "clinic-id"
}
```

All authenticated endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## Request format

All endpoints accept and return JSON:

```
Content-Type: application/json
```

### Example request

```bash
curl -X GET http://localhost:3001/api/v1/patients \
  -H "Authorization: Bearer <token>"
```

---

## Response format

Successful responses:

```json
{
  "data": { ... }
}
```

Error responses (NestJS default validation shape):

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

---

## 1. Authentication & Identity

Handles login, session generation, and credential recovery.

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **POST** | `/auth/login` | Authenticates user and returns JWT containing User ID, Role, and Tenant ID. | Public |
| **POST** | `/auth/logout` | Invalidates the current session token. | All Users |
| **POST** | `/auth/reset-password` | Initiates the password reset email flow. | Public |

---

## 2. SaaS Platform Core & Infrastructure

Restricted strictly to platform owners and automated systems to manage the underlying businesses.

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **GET** | `/health` | Pings the database and returns a `200 OK` if the system is operational. | Public / System |
| **POST** | `/tenants` | Provisions a new database workspace for a clinic. | SaaS Admin |
| **GET** | `/tenants` | Lists all active and suspended clinics on the platform. Supports `?page=` and `?limit=`. | SaaS Admin |
| **PATCH** | `/tenants/:id/status` | Updates the status (Active, Suspended, Trial) of a clinic. | SaaS Admin |
| **POST** | `/webhooks/payments` | Secure endpoint for payment gateways (e.g., Stripe) to send subscription events. | System |

---

## 3. Clinic Administration

Manages the business logic, staffing, compliance, and SaaS billing for a specific tenant.

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **GET** | `/clinic/settings` | Retrieves timezone, currency, and business details. | Clinic Admin |
| **PATCH** | `/clinic/settings` | Updates the clinic's operational configuration. | Clinic Admin |
| **GET** | `/clinic/staff` | Lists all doctors, receptionists, and admins in the clinic. Supports `?page=` and `?limit=`. | Clinic Admin, Receptionist |
| **POST** | `/clinic/staff` | Invites a new staff member and assigns their role. | Clinic Admin |
| **DELETE** | `/clinic/staff/:id` | Soft-deletes (archives) a staff member. | Clinic Admin |
| **GET** | `/clinic/audit-logs` | Fetches the immutable ledger of data access events. Supports `?page=` and `?limit=`. | Clinic Admin |
| **GET** | `/clinic/subscription` | Retrieves the clinic's current SaaS plan tier and billing cycle status. | Clinic Admin |
| **POST** | `/clinic/subscription/portal` | Generates a secure link to the Stripe Customer Portal to update card details. | Clinic Admin |

---

## 4. Patient Directory

Core CRUD operations for patient profiles.

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **GET** | `/patients` | Lists patients. Supports `?search=`, `?status=`, `?page=`, and `?limit=`. | Clinic Admin, Receptionist, Doctor |
| **POST** | `/patients` | Registers a new patient profile. | Clinic Admin, Receptionist |
| **GET** | `/patients/:id` | Retrieves a specific patient's complete profile. | Clinic Admin, Receptionist, Doctor |
| **PATCH** | `/patients/:id` | Updates patient demographics or contact info. | Clinic Admin, Receptionist, Patient |
| **DELETE** | `/patients/:id` | Soft-deletes (archives) a patient profile. | Clinic Admin |

---

## 5. Scheduling & Calendar

The operational engine for the front desk, patient booking, and staff availability logic.

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **POST** | `/staff/:id/schedule` | Defines standard working hours (e.g., Mon-Wed, 9 AM - 5 PM). | Clinic Admin |
| **GET** | `/staff/:id/availability` | Returns an array of available time slots for a specific date. | Receptionist, Patient |
| **GET** | `/appointments` | Fetches appointments. Supports `?date=`, `?doctorId=`, `?page=`, and `?limit=`. | Clinic Admin, Receptionist, Doctor |
| **POST** | `/appointments` | Creates a new appointment block on the calendar. | Receptionist, Patient |
| **PATCH** | `/appointments/:id` | Reschedules an appointment to a new time block. | Receptionist, Patient |
| **PATCH** | `/appointments/:id/status` | Updates state (e.g., Scheduled → Checked-In → Completed). | Receptionist, Doctor |

---

## 6. Clinical EMR

Nested under the specific patient ID to ensure clinical data is strictly bound to the correct chart.

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **GET** | `/patients/:id/chart` | Aggregates history, conditions, and active meds for the dashboard. | Doctor |
| **POST** | `/patients/:id/conditions` | Adds a new allergy or chronic condition. | Doctor |
| **POST** | `/patients/:id/notes` | Submits a completed SOAP note for an encounter. | Doctor |
| **POST** | `/patients/:id/prescriptions` | Generates a digital prescription record. | Doctor |
| **POST** | `/patients/:id/documents` | Uploads an external file (returns an S3 pre-signed URL). | Doctor, Receptionist |
| **GET** | `/patients/:id/documents/:docId` | Generates a temporary, secure URL to view/download a medical file. | Doctor |

---

## 7. Billing & Financials

The revenue and checkout side of the application.

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| **GET** | `/billing/catalog` | Retrieves the list of billable services and prices. Supports `?page=` and `?limit=`. | Clinic Admin, Receptionist |
| **POST** | `/billing/invoices` | Generates a new invoice based on an appointment ID. | Receptionist |
| **GET** | `/billing/invoices/:id` | Retrieves an itemized invoice. | Clinic Admin, Receptionist, Patient |
| **POST** | `/billing/invoices/:id/payments` | Logs a partial or full payment against the invoice. | Receptionist |
| **GET** | `/billing/reports/daily` | Fetches the end-of-day revenue and patient roster summary. | Clinic Admin |

---

## Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string for Prisma | Set in `.env` |
| `PORT` | Server listen port | `3001` |
| `JWT_SECRET` | Secret for signing session tokens | To be configured |
| `JWT_EXPIRATION` | Lifespan of the auth token | `1d` |

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
