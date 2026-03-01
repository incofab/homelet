# Repository Guidelines

we are building a property management system for tenants and landlords

## Project Structure & Module Organization

- `app/`: Core Laravel application code (controllers, models, policies, etc.).
- `routes/`: Route definitions (`web.php`, `api.php`, console routes).
- `resources/`: Frontend assets, views, and Tailwind/Vite entrypoints.
- `public/`: Web root and compiled assets output.
- `database/`: Migrations, factories, and seeders.
- `tests/`: PHPUnit tests (`tests/Unit`, `tests/Feature`).
- `config/`: Application configuration.
- The PRD is in the docs/prd.md file
- The API Documentation is in the docs/api.md file. Always update the api.md file when you make changes to the API or Controller methods.
- The task list is in the docs/tasks.md file.

## Build, Test, and Development Commands

- `sail composer run dev`: Runs local dev stack (Laravel server, queue listener, log tail, Vite).
- `sail composer run test`: Clears config cache then runs PHPUnit via `artisan test`.
- `sail composer run setup`: One-time bootstrap (env file, key, migrate, npm install, build).
- `sail npm run dev`: Starts Vite in dev mode for frontend assets.
- `sail npm run build`: Builds production frontend assets with Vite.

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

## Important Notes

- Every feature you Implement, write good covering tests, then update the docs/api.md and the neccessary tenants-fe/docs files
- If you have questions or need any clarifications on the feature I want you to build, ask those questions at once and get properly clarification from me before you start.
- You are allowed to make changes to the PRD, API Documentation and the task list if you think it is necessary.
- Always follow standard practices and conventions, make reasonable assumptions where necessary if the issue is not confusing enough to ask me.
