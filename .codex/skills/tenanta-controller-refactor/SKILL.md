---
name: tenanta-controller-refactor
description: Use when a Tenanta controller has accumulated business logic that should be moved into services or support classes. This skill is specifically for auditing Laravel controllers, identifying logic-heavy methods, extracting reusable domain workflows or formatters, preserving behavior, updating docs/api.md when needed, and adding regression coverage for the refactor.
---

# Tenanta Controller Refactor

Use this skill when the user asks to clean up controllers or when a controller has become responsible for too much domain logic.

## What To Look For

Audit controllers for methods that do more than request/response handling. Strong extraction candidates include:

- `DB::transaction` blocks
- multi-model create/update/delete flows
- matching and reconciliation logic
- branching domain rules
- reusable lookup logic
- repeated query composition
- response formatting/serialization logic
- workflow side effects such as mail, jobs, notifications, or role assignment

## What Should Stay In Controllers

Keep these in controllers:

- route-model inputs
- authorization calls
- Form Request entry points
- translating service results into API responses

Everything else should be questioned.

## Extraction Targets

Use `app/Services` for:

- transactional workflows
- approval flows
- assignment flows
- payment/review/role workflows

Use `app/Support` for:

- formatters/presenters
- lookup helpers
- reusable mapping and filtering logic

## Refactor Workflow

1. Read the controller and its tests.
2. Mark which logic is HTTP-specific and which is domain-specific.
3. Create or extend the smallest useful service/support class.
4. Move logic without changing behavior.
5. Keep method inputs simple: models, arrays, scalars.
6. Re-run the relevant tests.
7. Update `docs/api.md` if behavior or endpoint notes changed.

## Refactor Standards

- Do not create meaningless pass-through services.
- Prefer one coherent service over many tiny classes with no real boundaries.
- Name abstractions after the workflow they own.
- If formatting is reused or complex, create a formatter/support class instead of bloating the controller.
- If an extraction exposes a missing test, add the regression test.

## Good End State

After refactoring, a controller method should be readable in one screen and should roughly say:

1. authorize
2. validate
3. delegate
4. respond

If the method still tells the entire domain story inline, the refactor is incomplete.
