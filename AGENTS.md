# Repository Guidelines

we are building a property management system for tenants and landlords

- The system should be able to handle multiple buildings and apartments
- The system should be able to handle multiple tenants and leases
- The system should be able to handle multiple payments and transactions
- The system should be able to handle multiple chat conversations and messages
- The system should be able to handle multiple maintenance requests and issues
- The system should be able to handle multiple rental requests and inquiries
- The system should be able to handle multiple dashboard views for admin and tenant
- The system should be able to handle multiple renewal reminders and notifications
- The system should be able to handle multiple chat conversations and messages
- The system should be able to handle multiple maintenance requests and issues
- The system should be able to handle multiple rental requests and inquiries
- The system should be able to handle multiple dashboard views for admin and tenant
- The system should be able to handle multiple renewal reminders and notifications

## Guides

- The PRD is in the docs/prd.md file
- The API Documentation is in the docs/api.md file
- The task list is in the docs/tasks.md file
- Make your code implementation favour reusability and scalability always

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
