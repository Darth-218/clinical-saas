# Contributing

## Getting started

1. Fork the repository.
2. Clone your fork:
   ```bash
   git clone <your-fork-url>
   cd clinical-saas
   ```
3. Follow the [Getting Started](./getting-started.md) guide to set up your environment.

---

## Branch naming

Use descriptive prefixes:

| Prefix | Usage |
|--------|-------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `refactor/` | Code restructuring without behavior change |
| `chore/` | Tooling, CI, dependencies |

Example: `feat/patient-search`

---

## Commit messages

Follow Conventional Commits:

```
<type>: <description>
```

Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style`.

Examples:
- `feat: add patient list page`
- `fix: correct appointment time zone handling`
- `docs: update deployment guide`

---

## Pull requests

1. Create a feature branch from `main`.
2. Make your changes.
3. Ensure the build passes:
   ```bash
   pnpm lint
   pnpm build
   ```
4. Push your branch and open a pull request.
5. Fill in the PR description with:
   - What changed and why.
   - Screenshots if UI changed.
   - Testing steps.

---

## Code style

### TypeScript

- Strict mode is enabled across all packages.
- Prefer explicit types over `any`.
- Use the `workspace:*` protocol for internal dependencies.

### React (apps/web)

- Use functional components with hooks.
- Place components in `components/` within the web app.
- Use Tailwind utility classes for styling.

### NestJS (apps/api)

- One module per domain resource.
- Controllers handle HTTP; services handle logic.
- Use Prisma service injection for database access.

### General

- No comments unless requested.
- Follow existing patterns in the codebase.
- Keep functions small and focused.

---

## Adding a new package

1. Create the directory under `apps/` or `packages/`.
2. Add a `package.json` with a scoped name (`@repo/<name>`).
3. Add a `tsconfig.json`.
4. Register it in `pnpm-workspace.yaml` if it falls outside `apps/*` or `packages/*`.
5. Reference it from consumers via `"@repo/<name>": "workspace:*"`.

---

## Testing

Testing framework is TBD. When established:

```bash
# Run all tests
pnpm test

# Run tests for a single package
pnpm --filter @repo/api test
```

---

## Reporting issues

Open an issue on GitHub with:

- A clear title and description.
- Steps to reproduce.
- Expected vs actual behavior.
- Environment details (OS, Node version, pnpm version).

---

## Code of conduct

Be respectful, constructive, and inclusive. Focus on the code, not the person.
