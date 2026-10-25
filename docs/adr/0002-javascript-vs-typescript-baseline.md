# ADR-0002: JavaScript vs TypeScript baseline decision

- **Status:** Accepted (for baseline implementation scope)
- **Date:** 2026-10-21
- **Story:** US-039

## Context

The current repository state is a planning/process scaffold with no
application runtime code and no `package.json`.

Backlog guidance (`docs/PRODUCT_BACKLOG_STYKANIMATE.md`, section 5.1)
and setup guidance (`docs/COPILOT_PROJECT_SETUP.md`, section 4) both
prefer plain JavaScript ES modules unless US-039 finds a clear reason to
introduce TypeScript immediately.

## Decision

For the current baseline and near-term implementation stories, MiniBot
Studio will use **plain JavaScript with ES modules**.

TypeScript is **not introduced in US-039**.

## Consequences

- Faster project bootstrap with fewer tooling dependencies.
- Simpler CI/test setup in upcoming foundation stories (US-040 onward).
- Reduced compile-time type checking initially; mitigate with focused
  tests and clear module boundaries.
- Re-evaluate TypeScript later with a dedicated ADR if complexity or
  maintenance evidence justifies migration.
