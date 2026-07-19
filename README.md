# Clinical Management System (SaaS MVP)

This repository contains the monorepo for the multi-tenant clinical management platform. It leverages a strictly typed, full-stack TypeScript architecture managed by Turborepo to ensure high development velocity and end-to-end type safety.

## 🛠 Tech Stack

* **Frontend UI:** Next.js (React), Tailwind CSS
* **Backend API:** NestJS (Node.js)
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Package Manager:** pnpm
* **Build System:** Turborepo

## 📋 Prerequisites

Before contributing, ensure your local development environment has the following installed:

* **Node.js:** v18.0.0 or higher
* **pnpm:** v8.0.0 or higher (Install via `npm install -g pnpm`)
* **Docker:** Required for running the local PostgreSQL database

> **Note for NixOS Developers:** This repository includes a `flake.nix` file. Run `nix develop` at the project root to load your environment. This automatically configures native bindings for the Prisma engine binaries to prevent execution errors.

## 🚀 Quick Start Guide

Follow these steps to bootstrap the entire stack on your local machine.

**1. Clone the repository and navigate to the root**

```bash
git clone <repository-url>
cd clinical-saas

```

**2. Start the local database**
Spin up the PostgreSQL container in the background.

```bash
docker-compose up -d

```

**3. Configure Environment Variables**
Create a `.env` file in the root directory and add the local database connection string:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/clinical_saas?schema=public"

```

Copy this exact same `.env` file into the `packages/database` folder so Prisma can access it.

```bash
cp .env packages/database/.env

```

**4. Install Dependencies**
Install all required packages across the entire workspace.

```bash
pnpm install

```

**5. Initialize the Database**
Generate the Prisma TypeScript client and push the schema models to your local PostgreSQL instance.

```bash
pnpm --filter @repo/database generate
pnpm --filter @repo/database push

```

**6. Start the Development Servers**
Launch the frontend and backend concurrently using Turborepo.

```bash
pnpm dev

```

## 🌐 Local Service Architecture

Once the development servers are running, you can access the services at the following local addresses:

| Service | Technology | Local URL |
| --- | --- | --- |
| **Frontend UI** | Next.js | `http://localhost:3000` |
| **Backend API** | NestJS | `http://localhost:3001` |
| **Database** | PostgreSQL | `localhost:5432` |
| **Database GUI** | Prisma Studio | Run: `pnpm --filter @repo/database studio` |

## 📁 Monorepo Structure

This project uses npm workspaces to separate concerns while sharing core logic.

* `apps/web`: The Next.js frontend application. All UI components, pages, and client-side logic live here.
* `apps/api`: The NestJS backend application. It handles the REST endpoints, business logic, authorization, and multi-tenant data isolation.
* `packages/database`: The shared Prisma database package. It contains the `schema.prisma` file (the single source of truth for our database tables). Both `web` and `api` import the generated types from this package.
