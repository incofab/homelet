---
name: tenanta-backend-api
description: Use when implementing or changing Laravel backend features in this Tenanta repository, including routes, controllers, form requests, policies, models, services, migrations, seeders, jobs, mails, and PHPUnit feature tests. This skill should also be used for API bug fixes, authorization changes, data model changes, and any backend task that must keep docs/api.md and tests aligned with the implementation.
---

# Tenanta Backend API

Use this skill for backend-only work and for the backend half of fullstack work.

## Read First

Before editing, load only the files relevant to the task in this order:

1. `AGENTS.md`
2. `docs/prd.md`
3. `docs/api.md`
4. `docs/tasks.md`
5. `routes/api.php`
6. The relevant controller, request, policy, model, service, and feature tests

If the task touches an existing flow, inspect the current Feature tests before changing code. This codebase already uses tests as behavioral documentation.

## Project Rules To Preserve

- Keep controllers thin. HTTP concerns stay in controllers; business rules, transactions, reconciliation, formatting, and orchestration move to `app/Services` or `app/Support`.
- Validate request payloads with Form Requests under `app/Http/Requests`.
- Authorization belongs in policies or explicit access checks close to the controller boundary.
- Prefer service classes for workflows that create/update multiple models or need transactions.
- Prefer support/formatter/presenter classes for serialization or reusable decision logic that does not own persistence.
- Reuse existing models, casts, helpers, and services before adding new abstractions.
- If you change API behavior or controller behavior in a user-visible way, update `docs/api.md`.
- If the task meaningfully changes scope or backlog state, update `docs/tasks.md`, and update `docs/prd.md` if product intent changed.

## Standard Backend Workflow

1. Inspect the affected route and API contract in `routes/api.php` and `docs/api.md`.
2. Read the existing controller and its Feature tests.
3. Identify whether the change needs:
   - request validation changes
   - policy/authorization changes
   - service or support extraction
   - model relationship or cast changes
   - migration updates
   - queued jobs, mail, notifications, or events
4. Implement the backend change with the smallest clean abstraction that keeps controllers readable.
5. Update tests first or immediately after the code change. Favor Feature tests for endpoints and user-visible behavior.
6. Update `docs/api.md` to match the final implementation.
7. Run targeted tests, then broaden if shared code changed.

## Architecture Guidance

### Controllers

Controllers should usually do only this:

- authorize
- validate via Form Request
- delegate to service/support/query classes
- return response payloads

Move logic out of controllers when you see:

- transactions
- cross-model writes
- repeated query composition
- complex matching or reconciliation rules
- branching workflows based on domain rules
- serialization logic that is reused by multiple actions

### Services

Create or extend a service in `app/Services` when the task involves:

- workflow orchestration across models
- writes inside `DB::transaction`
- reusable domain processes such as assignment, approval, payment recording, role assignment, or review creation

Service methods should accept plain model instances and simple arrays/scalars. Avoid coupling services directly to Request objects.

### Support Classes

Create support classes in `app/Support` for:

- payload formatting
- lookup helpers
- reusable filtering or transformation logic
- deterministic domain helpers that do not own persistence

## Domain-Specific Expectations

This repository centers on:

- buildings
- apartments
- tenants and leases
- payments
- rental requests
- maintenance requests
- conversations/messages
- building registration requests
- reviews

When changing one of these flows, inspect adjacent models and tests. Many rules are enforced indirectly through policies, casts, accessors, or service classes.

## API Contract Checklist

When an endpoint changes, verify all of the following:

- route path and method
- request validation fields
- authorization rules
- success/error status codes
- response payload shape
- dependent frontend URL/model usage
- `docs/api.md`
- relevant Feature tests

## Testing Checklist

At minimum, add or update tests for:

- authorization boundaries
- happy path behavior
- validation failures
- domain conflict cases
- serialization/response shape changes

Use existing Feature tests in `tests/Feature` as the pattern. Prefer targeted command runs first, such as:

```bash
php artisan test tests/Feature/PaymentApiTest.php
php artisan test tests/Feature/AssignTenantApiTest.php
php artisan test tests/Feature/ConversationApiTest.php
```

If the change affects shared infrastructure, expand to the relevant suite or `php artisan test`.

## Done Criteria

A backend task is not done until:

- implementation is clean and reusable
- controllers are not carrying avoidable business logic
- docs are updated where needed
- targeted PHPUnit coverage passes
- any new abstraction clearly improves maintainability instead of just moving code around
