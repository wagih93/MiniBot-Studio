# Contributing to MiniBot Studio

This repository implements the backlog in `docs/PRODUCT_BACKLOG_STYKANIMATE.md` using a strict one-story workflow.

## Story-first workflow

1. Pick the next eligible backlog story (`US-###`) based on dependencies.
2. Implement only that story in a dedicated branch.
3. Run validation commands and record real results.
4. Open a dedicated pull request for the story.
5. Update `docs/implementation-status.md` on the same branch.

A story with an open pull request is `In Review`, not `Done`.

## Naming conventions (backlog section 5.6)

| Item | Convention | Example |
| --- | --- | --- |
| Story ID | `US-###` | `US-011` |
| Feature branch | `feat/US-###-short-kebab-case` | `feat/US-011-drag-block-into-workspace` |
| Fix branch | `fix/US-###-short-kebab-case` | `fix/US-006-wall-collision` |
| Test branch | `test/US-###-short-kebab-case` | `test/US-033-engine-turns` |
| Docs branch | `docs/US-###-short-kebab-case` | `docs/US-058-readme-setup` |
| Commit message | `<type>(US-###): <imperative summary>` | `feat(US-011): add drag and drop from toolbox` |
| Pull request title | `[US-###] <Imperative summary>` | `[US-011] Add drag and drop from toolbox` |

## Stacked pull requests

- The first story branch in a run starts from the default branch (or latest active story branch).
- Each next story branch starts from the previous story branch.
- Each pull request targets its immediate predecessor branch.
- Human merge order is bottom-up through the stack.

## Pull request requirements

Use `.github/pull_request_template.md` and fill every section with real evidence:

- Story ID and backlog reference
- Acceptance criteria checklist
- Exact commands run and actual results
- Arabic/RTL verification status
- Security, licensing, and scope checks

Do not claim commands, tests, pushes, or PR actions that did not happen.

## Execution engine test suite

Use the documented suite command:

```bash
npm run test:engine
```

This command validates the execution engine end to end by running both unit
and browser suites, including movement boundaries/walls, repeated turns,
collectibles and win conditions, stop/reset/concurrency behavior, and
execution-limit protection.

## Safety and scope rules

- Keep child-facing UI Arabic (`lang="ar"`, `dir="rtl"`), but keep code identifiers in English.
- Never use `eval()` or `new Function()`.
- Do not add upstream StykAnimate assets/code unless US-045 is owner-approved and merged.
- Keep changes limited to the active story.
