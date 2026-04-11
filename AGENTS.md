# Repository Guidelines

we are building a property management system for tenants and landlords

## Project Structure & Module Organization

- `app/`: Core Laravel application code (controllers, models, policies, etc.).
- `routes/`: Route definitions (`web.php`, `api.php`, console routes).
- `resources/`: Laravel assets, views, and Tailwind/Vite entrypoints.
- `public/`: Web root and compiled assets output.
- `database/`: Migrations, factories, and seeders.
- `tests/`: PHPUnit tests (`tests/Unit`, `tests/Feature`).
- `config/`: Application configuration.
- `fe/`: Frontend application (UI, assets, and frontend-specific docs).
- The PRD is in the docs/prd.md file
- The API Documentation is in the docs/api.md file. Always update the api.md file when you make changes to the API or Controller methods.
- The task list is in the docs/tasks.md file.

## Build, Test, and Development Commands

- `sail composer run dev`: Runs local dev stack (Laravel server, queue listener, log tail, Vite).
- `sail composer run test`: Clears config cache then runs PHPUnit via `artisan test`.
- `sail composer run setup`: One-time bootstrap (env file, key, migrate, npm install, build).
- `sail npm run dev`: Starts Vite in dev mode for frontend assets.
- `sail npm run build`: Builds production frontend assets with Vite.
- Frontend app commands live under `fe/` (see `fe/README.md` if present).

## Coding Style & Naming Conventions

- PHP: Follow Laravel conventions and PSR-12 formatting; use Laravel Pint (`vendor/bin/pint`) if needed.
- JavaScript/CSS: Format with Prettier (`npx prettier --write ...`).
- Naming: Classes in `StudlyCase`, methods/variables in `camelCase`, migrations named like `YYYY_MM_DD_HHMMSS_create_widgets_table`.

## Testing Guidelines

- Framework: PHPUnit (configured in `phpunit.xml`).
- Tests live in `tests/Unit` and `tests/Feature`; name files `*Test.php`.
- Run all tests with `sail composer run test`.

## Commit & Pull Request Guidelines

- Git history is currently empty, so no established commit convention exists yet.
- Proposed baseline: short, imperative subject lines (optionally Conventional Commits like `feat:` or `fix:`).
- PRs should include a clear summary, testing notes, and screenshots for UI changes.

## Configuration & Security Tips

- Copy `.env.example` to `.env` and set required secrets; never commit `.env`.
- For local DB, `composer run setup` will migrate using the configured connection.

#### Frontend Section

## Project Structure & Module Organization

- `fe/index.html` is the Vite entry point that mounts the React app.
- `fe/src/main.tsx` bootstraps the app and imports global styles.
- `fe/src/app/App.tsx` is the top-level UI shell.
- `fe/src/app/pages` contains route-level screens; `fe/src/app/routes.ts` defines route mappings.
- `fe/src/app/components` holds reusable UI components; `fe/src/app/layouts` holds layout wrappers.
- `fe/src/styles` contains global CSS (`index.css`, `tailwind.css`, `theme.css`, `fonts.css`).
- `fe/src/imports` stores design reference material (e.g., `tenanta-design-spec.md`).

## Build, Test, and Development Commands

- `npm install` installs dependencies.
- `npm run dev` starts the Vite dev server for local development.
- `npm run build` produces a production build in `dist/`.

## Coding Style & Naming Conventions

- TypeScript + React with JSX in `.tsx` files.
- Use double quotes and semicolons (matches existing files like `src/main.tsx`).
- Keep components PascalCase (e.g., `TenantCard.tsx`) and hooks camelCase (e.g., `useTenantFilters.ts`).
- Prefer co-locating component-specific styles in `src/styles` or CSS modules if introduced later.

## Testing Guidelines

- No automated test framework is configured yet.
- If you add tests, document the framework and add a script (e.g., `npm run test`) in `package.json`.

## Commit & Pull Request Guidelines

- There is no established commit message convention yet (no git history).
- Suggested pattern: `type(scope): summary` (e.g., `feat(routes): add leases page`).
- PRs should include:
  - A short description of the change and motivation.
  - Screenshots or a short clip for UI changes.
  - Notes about new dependencies or config changes.

## Configuration & Assets

- Vite config lives in `vite.config.ts`.
- Tailwind is configured via `postcss.config.mjs` and `src/styles/tailwind.css`.
- Keep new assets referenced from components and routed pages; avoid unused files.

## Important Notes

- For every feature, implement both frontend and backend, write good covering tests for both frontend and backend and update the docs/api.md file.
- If you have questions or need any clarifications on the feature I want you to build, ask those questions at once and get properly clarification from me before you start.
- You are allowed to make changes to the PRD, API Documentation and the task list if you think it is necessary.
- Always follow standard practices and conventions, make reasonable assumptions where necessary if the issue is not confusing enough to ask me.
- You can safely assume that this project is still in development phase, So you can make changes to the project structure and code as you see fit. You can easily update an existing migration file if you need to add more columns or fields to the database.
- Always prioritise reusability, maintainability and scalability of the code. For Do Not Repeat Yourself (DRY) principle, always try to avoid code duplication.

## Project Skills

Project-local Codex skills live under `.codex/skills`. Use them whenever the task matches their purpose.

- `.codex/skills/tenanta-backend-api`: Use for Laravel backend/API work in this repo, including routes, controllers, requests, policies, models, services, migrations, jobs, mails, and PHPUnit feature tests.
- `.codex/skills/tenanta-frontend-react`: Use for React/Vite frontend work in this repo, including admin, tenant, and public pages, API integration, shared hooks, models, route wiring, and Vitest coverage.
- `.codex/skills/tenanta-fullstack-feature`: Use for end-to-end feature delivery that spans backend, frontend, docs, and tests.
- `.codex/skills/tenanta-docs-sync`: Use whenever implementation changes require updates to `docs/api.md`, `docs/tasks.md`, `docs/prd.md`, or repo workflow guidance.
- `.codex/skills/tenanta-controller-refactor`: Use when controllers contain business logic that should move into `app/Services` or `app/Support`.

When a task spans multiple layers, prefer `tenanta-fullstack-feature` first, then load the backend/frontend/doc-specific skills as needed.

# Task
