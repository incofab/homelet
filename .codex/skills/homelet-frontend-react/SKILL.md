---
name: homelet-frontend-react
description: Use when implementing or fixing the React frontend in this Homelet repository, including admin, tenant, public, and shared UI pages; API integration; route wiring; local state; hooks; component extraction; and Vitest/Testing Library coverage. This skill should also be used when frontend changes must stay aligned with backend API contracts, docs, and the project's existing UI patterns.
---

# Homelet Frontend React

Use this skill for frontend-only work and for the frontend half of fullstack work.

## Read First

Load the minimum relevant context in this order:

1. `AGENTS.md`
2. `docs/prd.md`
3. `docs/api.md` if the UI depends on API payloads
4. The relevant files under `fe/src/app/pages`, `fe/src/app/components`, `fe/src/app/hooks`, and `fe/src/app/lib`
5. The matching tests under `fe/src/test`

When working on a page, inspect:

- route wiring in `fe/src/app/routes.ts`
- endpoint paths in `fe/src/app/lib/urls.ts`
- shared models in `fe/src/app/lib/models.ts`
- API helpers such as `fe/src/app/lib/api.ts` and `fe/src/app/hooks/useApiQuery.ts`

## Frontend Rules To Preserve

- Use TypeScript React with `.tsx`.
- Match the repo’s frontend convention: double quotes and semicolons.
- Prefer existing shared components before adding new markup patterns.
- Keep API access centralized through the existing helpers/hooks.
- Do not hardcode endpoint strings when `fe/src/app/lib/urls.ts` should own them.
- Keep route-level logic in pages and reusable UI in components/hooks.
- Add or update frontend tests for user-visible behavior, not just implementation details.

## UI Architecture Guidance

### Shared Sources of Truth

Keep these in sync:

- `fe/src/app/lib/urls.ts` for API and route paths
- `fe/src/app/lib/models.ts` for payload typing
- `fe/src/app/hooks/useApiQuery.ts` and related hooks for shared fetch behavior
- page-level tests in `fe/src/test`

If an API contract changes, update all three: URL usage, model typing, and tests.

### State and Effects

- Avoid unstable dependencies that retrigger effects or queries unnecessarily.
- Prefer stable selectors, callbacks, and derived state when using shared hooks.
- When a bug involves repeated fetching, rerenders, stale closures, or modal open/close behavior, audit hook dependencies first.
- Keep forms controlled only as far as needed; derive values where practical.

### Components

Extract a new component when:

- markup or logic is reused
- a page is becoming hard to read
- a modal/dialog/form has enough logic to deserve its own file

Do not extract purely to increase file count. Favor readable local code when reuse is not real.

## Styling and UX

This project already has an established admin/public/tenant UI direction. Preserve existing patterns unless the task explicitly asks for redesign.

When editing UI:

- reuse the current card, button, status badge, empty state, dialog, and layout patterns
- keep forms readable and keyboard-usable
- make loading, empty, success, and error states explicit
- prefer clear labels over clever wording

## Frontend Workflow

1. Confirm the API contract from `docs/api.md` and/or backend code.
2. Inspect the current page/component and its tests.
3. Update models and URL helpers first if the contract changed.
4. Implement the page/component change.
5. Add or update Vitest/Testing Library coverage.
6. Run targeted frontend tests.

## Testing Checklist

Frontend work is expected to update tests under `fe/src/test` when behavior changes.

Prefer tests that verify:

- a page renders the correct data
- loading and error states are correct
- user actions trigger the expected request
- dialogs and forms open, populate, validate, and submit correctly
- regression bugs do not reappear

Useful command:

```bash
npm test -- --run fe/src/test/app/pages/admin/PaymentsList.test.tsx
```

Replace the file path with the affected test file or set of files.

## Done Criteria

A frontend change is not done until:

- the page works against the current API contract
- route and URL helpers remain consistent
- types are updated where needed
- the UX handles loading and failure states sensibly
- targeted Vitest coverage passes
