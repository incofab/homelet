---
name: homelet-docs-sync
description: Use when a Homelet change affects API behavior, controller behavior, product scope, or task tracking and the repository documentation must be synchronized. This skill is for updating docs/api.md, docs/tasks.md, and docs/prd.md so the documentation reflects the true implementation and current project scope.
---

# Homelet Docs Sync

Use this skill whenever code changes would leave the docs stale.

## Primary Files

- `docs/api.md`
- `docs/tasks.md`
- `docs/prd.md`
- `AGENTS.md` when repo workflow guidance must change

## When To Use

Use this skill if you changed:

- API routes
- request validation
- controller behavior that changes what clients observe
- response payloads
- authorization rules
- major product scope or workflow
- task list status or backlog structure

## `docs/api.md` Rules

For each affected endpoint, verify and update:

- path and method
- authorization
- request body and query params
- validation notes
- behavior notes
- response shape
- model references

Do not leave stale examples or outdated authorization notes.

If the implementation did not change the external API contract, keep docs changes narrow. Add or adjust behavior notes only when they materially help future work.

## `docs/tasks.md` Rules

Update the task list when:

- a feature was completed
- a task was split or re-scoped
- a new required follow-up became clear during implementation

Keep the task list action-oriented and current. Do not add vague backlog items.

## `docs/prd.md` Rules

Update the PRD only when the user-visible product intent, workflow, or requirement changed. Do not edit it for purely internal refactors.

## Workflow

1. Diff the implemented behavior against the current docs.
2. Update only the affected sections.
3. Make sure wording matches the real code, not what was planned earlier.
4. Re-read the touched sections for contradictions with nearby endpoints/features.

## Done Criteria

Documentation sync is complete only when the docs describe the code as it exists now, not the code as it used to work.
