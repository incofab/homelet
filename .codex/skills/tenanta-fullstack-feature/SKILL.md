---
name: tenanta-fullstack-feature
description: Use when implementing or modifying a Tenanta feature end-to-end across backend, frontend, docs, and tests. This skill covers feature delivery that spans Laravel APIs, React pages, route and model syncing, API documentation updates, task list updates, and verification across PHPUnit and Vitest.
---

# Tenanta Fullstack Feature

Use this skill when a request spans backend and frontend, or when the user says to implement a feature fully.

## Goal

Deliver a complete feature without leaving the backend, frontend, docs, and tests out of sync.

## Read First

Read only the relevant pieces, in this order:

1. `AGENTS.md`
2. `docs/prd.md`
3. `docs/api.md`
4. `docs/tasks.md`
5. Relevant backend routes/controllers/services/tests
6. Relevant frontend pages/components/models/tests

## Required Sequence

Follow this order unless the task clearly demands a different one:

1. Understand the product need from `docs/prd.md` and any existing docs/tests.
2. Confirm the API contract or decide what the contract must become.
3. Implement backend support first.
4. Update `docs/api.md` immediately after the backend contract settles.
5. Wire the frontend to the real backend contract.
6. Update frontend and backend tests.
7. Run targeted PHPUnit and Vitest coverage.
8. Update `docs/tasks.md` if the task list should reflect the completed work.

## Contract Sync Checklist

Whenever the feature crosses the API boundary, keep all of these aligned:

- `routes/api.php`
- controller + request + policy + service behavior
- `docs/api.md`
- `fe/src/app/lib/urls.ts`
- `fe/src/app/lib/models.ts`
- relevant React pages/components
- PHPUnit Feature tests
- Vitest page/component tests

If any one of these stays stale, the task is not done.

## Design Rules

- Backend controllers stay thin.
- Frontend pages should not compensate for broken backend contracts.
- Avoid duplicated business rules across backend and frontend. The backend owns enforcement; the frontend reflects it.
- Reuse existing abstractions when they are already close to the needed behavior.
- When you must create a new abstraction, make it project-specific and obvious.

## Feature Delivery Checklist

For each feature, explicitly verify:

- authorization
- validation
- happy path behavior
- key failure states
- serialized payload shape
- frontend loading state
- frontend success/error state
- regression coverage

## Verification Commands

Choose the smallest relevant set first:

```bash
php artisan test tests/Feature/SomeRelevantTest.php
npm test -- --run fe/src/test/app/pages/admin/SomeRelevantPage.test.tsx
```

If the change touched shared infrastructure such as common hooks, shared services, or core models, broaden the verification scope.

## Done Criteria

A fullstack feature is complete only when:

- backend behavior is implemented cleanly
- frontend behavior is wired and usable
- docs are updated
- tests on both sides are updated
- the resulting contract is consistent everywhere
