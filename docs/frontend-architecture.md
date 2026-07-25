# Frontend Architecture & Subdomain Strategy

## Overview

The frontend is a **Next.js 14** application utilizing the App Router. It acts purely as a data consumer, interfacing with the NestJS backend API. To balance instant page loads with highly interactive user experiences, this application employs a hybrid data-fetching model combining React Server Components (RSC) and TanStack Query.

Routing is handled via a **Role-Based Subdomain Strategy**, segregating the platform into distinct environments for clinic staff, patients, and platform administrators to prevent route collisions and ensure strict security perimeters.

---

## 1. Directory Structure

All application source code lives under `apps/web/src/`. Configuration files (`next.config.js`, `tailwind.config.js`, `tsconfig.json`, `postcss.config.js`) remain at the `apps/web/` root.

```text
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (providers, fonts, QueryClient)
│   │   ├── page.tsx                   # Auto-redirect based on auth state
│   │   ├── not-found.tsx              # Global 404 fallback
│   │   ├── globals.css                # Tailwind directives
│   │   │
│   │   ├── (public)/                  # clinicsaas.com
│   │   │   ├── layout.tsx
│   │   │   ├── error.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── app/                       # app.clinicsaas.com (Clinic Staff)
│   │   │   ├── layout.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── calendar/page.tsx
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── error.tsx
│   │   │   │       ├── chart/page.tsx
│   │   │   │       ├── conditions/page.tsx
│   │   │   │       ├── notes/page.tsx
│   │   │   │       ├── prescriptions/page.tsx
│   │   │   │       └── documents/page.tsx
│   │   │   ├── staff/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── schedule/page.tsx
│   │   │   ├── billing/
│   │   │   │   ├── catalog/page.tsx
│   │   │   │   ├── invoices/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   └── reports/daily/page.tsx
│   │   │   ├── audit-logs/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── subscription/page.tsx
│   │   │
│   │   ├── portal/                    # portal.clinicsaas.com (Patient)
│   │   │   ├── layout.tsx
│   │   │   ├── error.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── appointments/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── profile/page.tsx
│   │   │
│   │   └── admin/                     # admin.clinicsaas.com (SaaS Admin)
│   │       ├── layout.tsx
│   │       ├── error.tsx
│   │       ├── not-found.tsx
│   │       ├── tenants/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       └── analytics/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives (Radix + Tailwind)
│   │   ├── forms/                     # react-hook-form + zod schemas
│   │   └── modules/                   # Domain-specific chunks
│   │
│   ├── lib/
│   │   ├── api.ts                     # Isomorphic fetch wrapper
│   │   └── query-client.ts            # TanStack Query configuration
│   │
│   └── middleware.ts                  # Subdomain rewrites + JWT validation
│
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

### Config file changes for `src/` layout

| File | Change |
|------|--------|
| `tsconfig.json` | Path alias updated: `"@/*": ["./src/*"]` |
| `tailwind.config.js` | Content paths updated: `"./src/app/**/*"`, `"./src/components/**/*"` |
| `next.config.js` | No change — Next.js auto-detects `src/app/` |

---

## 2. Subdomain Routing

### Production

The application uses Next.js folder routing mapped to subdomains via middleware rewrites.

| Subdomain | Directory | Access |
|-----------|-----------|--------|
| `clinicsaas.com` | `(public)/` | Public (marketing, login) |
| `app.clinicsaas.com` | `app/` | Clinic Staff (Admin, Doctor, Receptionist) |
| `portal.clinicsaas.com` | `portal/` | Patient |
| `admin.clinicsaas.com` | `admin/` | SaaS Platform Admin |
| `nile-clinic.app.clinicsaas.com` | `app/` | Per-clinic tenant isolation |

### Development (Local)

In development, subdomains are not available. Routes are accessed directly via path segments.

| URL | Directory |
|-----|-----------|
| `localhost:3000/login` | `(public)/login` |
| `localhost:3000/app/dashboard` | `app/dashboard` |
| `localhost:3000/portal/dashboard` | `portal/dashboard` |
| `localhost:3000/admin/tenants` | `admin/tenants` |

The middleware detects the environment via `NODE_ENV` and applies the appropriate routing strategy.

---

## 3. Middleware & Authentication

`src/middleware.ts` is the core traffic controller.

### Auth Flow

```
1. User visits clinicsaas.com/login
2. POST /api/v1/auth/login → NestJS validates credentials
3. NestJS sets HTTP-only cookie (domain=clinicsaas.com) with JWT:
   { sub: "user-id", role: "CLINIC_ADMIN", clinicId: "clinic-id" }
4. Middleware reads cookie, extracts role:
   - SAAS_ADMIN       → rewrite to /admin/*
   - PATIENT          → rewrite to /portal/*
   - CLINIC_ADMIN     → rewrite to /app/*
   - DOCTOR           → rewrite to /app/*
   - RECEPTIONIST     → rewrite to /app/*
5. In production, middleware also handles subdomain rewrites:
   - Host: nile-clinic.app.clinicsaas.com → rewrite to /app/* + tenant context
   - Host: portal.clinicsaas.com          → rewrite to /portal/*
```

### Route Protection

| Route Group | Allowed Roles | Redirect on Failure |
|-------------|--------------|---------------------|
| `(public)/` | All (unauthenticated) | None — public |
| `app/` | `CLINIC_ADMIN`, `DOCTOR`, `RECEPTIONIST` | `/login` |
| `portal/` | `PATIENT` | `/login` |
| `admin/` | `SAAS_ADMIN` | `/login` |

### Matcher

The middleware runs on all routes except:

```
/api/*          — API routes (handled by NestJS)
/_next/*        — Next.js static assets
/favicon.ico    — Favicon
```

---

## 4. Cross-Origin & Cookie Configuration

### Cookie Strategy

- **Name:** `session_token`
- **Domain:** `clinicsaas.com` (no leading dot — modern browser standard)
- **HttpOnly:** `true`
- **Secure:** `true` (production only)
- **SameSite:** `Lax`
- **Path:** `/`

### Isomorphic Fetch

**Server-Side (RSC):**

```typescript
import { cookies } from "next/headers";

const cookieStore = cookies();
const token = cookieStore.get("session_token")?.value;

const response = await fetch(`${API_URL}/api/v1/patients`, {
  headers: {
    Cookie: `session_token=${token}`,
  },
});
```

**Client-Side (React Query):**

```typescript
const response = await fetch(`${API_URL}/api/v1/patients`, {
  credentials: "include",
});
```

### NestJS CORS Configuration

```typescript
app.enableCors({
  origin: [
    "https://clinicsaas.com",
    "https://app.clinicsaas.com",
    "https://portal.clinicsaas.com",
    "https://admin.clinicsaas.com",
  ],
  credentials: true,
});
```

---

## 5. Data Fetching Protocol

### React Server Components (RSC)

Used for top-level data fetching and initial page renders.

- **Target:** `page.tsx` files (e.g., the primary `/patients` directory list)
- **Mechanism:** Native `fetch()` calls to the NestJS API, with cookies forwarded from `next/headers`
- **Advantage:** Zero JavaScript shipped to the client, tokens never exposed to the browser, immediate First Contentful Paint (FCP)

### TanStack Query (Client Components)

Used within interactive Client Components where continuous syncing, caching, and background refetching are required.

- **Target:** Interactive UI modules (CalendarGrid, ClinicalNoteEditor, InvoiceTable)
- **Mechanism:** `useQuery` and `useMutation` hooks with `credentials: 'include'`
- **Advantage:** Optimistic UI updates, request deduplication, automatic stale-while-revalidate on browser focus

### @tanstack/react-table

Used for data-heavy views requiring sorting, filtering, and pagination.

- **Target:** Patient directory, appointment list, audit logs, invoice list, service catalog
- **Advantage:** Headless table logic, virtual scrolling for large datasets, column-level sorting/filtering

---

## 6. Component Architecture

### shadcn/ui

The UI layer uses shadcn/ui — copy-paste components built on Radix UI primitives and Tailwind CSS. Components are installed locally into `src/components/ui/`, not as a node_modules dependency. This provides:

- Full ownership and customizability of component code
- No vendor lock-in or upstream breaking changes
- Consistent design tokens via Tailwind CSS variables

### Component Layers

```
components/
├── ui/           # Atomic primitives: Button, Input, Dialog, Table, Select, etc.
├── forms/        # Form components: PatientIntakeForm, AppointmentBookingForm, InvoiceForm
└── modules/      # Domain chunks: CalendarGrid, PatientChart, InvoiceTable, SOAPNoteEditor
```

| Layer | Responsibility | Examples |
|-------|---------------|----------|
| `ui/` | Reusable, stateless primitives | `Button`, `Input`, `Dialog`, `Card`, `Table`, `Select`, `Calendar` |
| `forms/` | Form logic with react-hook-form + zod validation | `PatientIntakeForm`, `StaffInviteForm`, `ServiceCatalogForm` |
| `modules/` | Complex domain-specific UI compositions | `CalendarGrid`, `PatientChart`, `InvoiceTable`, `SOAPNoteEditor`, `AppointmentPipeline` |

### Form Library

- **react-hook-form:** Form state management with minimal re-renders
- **zod:** Schema validation used as the resolver for react-hook-form
- **Pattern:** Each form defines a zod schema, which is used for both TypeScript types and runtime validation

```typescript
const patientSchema = z.object({
  fullNameEn: z.string().min(1, "Name is required"),
  phonePrimary: z.string().regex(/^\+20\d{10}$/, "Invalid Egyptian phone number"),
  nationalId: z.string().length(14, "National ID must be 14 digits"),
});
```

---

## 7. State Management

Global client-side state is kept to an absolute minimum.

| State Type | Managed By | Examples |
|------------|-----------|----------|
| **Server State** | TanStack Query | Patient data, appointments, invoices, audit logs |
| **UI State** | React Context | Sidebar open/closed, active theme, calendar selected date |

No external state management library (Zustand, Redux, Jotai) is used for MVP. React Context is sufficient for ephemeral UI properties.

---

## 8. Error Boundaries

Every route group includes `error.tsx` and `not-found.tsx` files to prevent blank white screens in production.

| File | Purpose | Placement |
|------|---------|-----------|
| `error.tsx` | Catches runtime errors in child routes | Root of each route group + dynamic `[id]` routes |
| `not-found.tsx` | Catches 404 navigation | Root of each route group |
| `loading.tsx` | Skeleton/progress UI during RSC fetches | High-latency routes (patients list, dashboard) |

### Error Page Behavior

| Route Group | Error Message | Primary Action | Secondary Action |
|-------------|--------------|----------------|------------------|
| `(public)/` | "An unexpected error occurred" | Try Again | — |
| `app/` | "The clinical dashboard encountered an error. Your data is safe." | Try Again | Return to Dashboard |
| `portal/` | "We encountered an issue loading your information" | Try Again | Return to Home |
| `admin/` | "The platform administration panel encountered an error" | Try Again | Return to Tenants |

---

## 9. Dependencies

### New Packages to Install

| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Server state management, caching, mutations |
| `@tanstack/react-table` | Headless data tables (sorting, filtering, pagination) |
| `react-hook-form` | Form state management |
| `zod` | Schema validation (used as react-hook-form resolver) |
| `lucide-react` | Icon library (shadcn/ui standard) |
| `class-variance-authority` | Component variant utility (shadcn/ui dependency) |
| `clsx` | Conditional class names (shadcn/ui dependency) |
| `tailwind-merge` | Tailwind class deduplication (shadcn/ui dependency) |

### shadcn/ui Components (Copy-Pasted)

shadcn/ui components are not installed as npm dependencies. They are generated via the CLI into `src/components/ui/`:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card dialog table select calendar form label separator skeleton toast dropdown-menu avatar tabs
```

### Existing Dependencies (No Changes)

| Package | Version |
|---------|---------|
| `next` | `^14.2.0` |
| `react` | `^18.3.0` |
| `react-dom` | `^18.3.0` |
| `tailwindcss` | `^3.4.3` |
| `@repo/database` | `workspace:*` |
