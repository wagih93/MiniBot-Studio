# MiniBot Studio

MiniBot Studio is an Arabic-first learning app where children build robot programs from visual blocks and run them safely on a grid world.

## Setup

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm ci
npx playwright install --with-deps chromium
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm test` | Run unit tests (Node test runner). |
| `npm run test:browser-safety` | Run Playwright browser safety and behavior tests. |
| `npm run architecture:check` | Enforce vertical-slice and purity boundaries. |
| `npm run language:check` | Enforce ubiquitous language naming and Arabic-literal rules. |
| `npm run safety:check` | Run static safety checks. |
| `npm run validate:agent` | Validate agent frontmatter metadata. |
| `npm run build` | Produce `dist/` with shipped files and validate CSP in `dist/index.html`. |
| `npm run check` | Full readiness gate: lint (if present), unit tests, architecture, language, safety, agent validation, browser tests, and build. |

## Project structure

- `index.html` — Production entry page.
- `js/app.js` — Composition root.
- `js/features/` — Vertical slices (`domain`, `application`, `ui`, optional `infrastructure`) with slice-level `index.js` public API.
- `js/shared/i18n/` and `js/i18n/` — Localization resources and i18n bridge.
- `tests/unit/` — Pure unit and contract tests.
- `tests/e2e/` — Browser integration tests and test entry point.
- `tests/fixtures/` — Test-only fixture data that must not be shipped.
- `docs/` — Architecture, backlog, implementation status, ADRs, and review records.

## Conventions

- Follow [ARCHITECTURE_GUIDELINES](./docs/ARCHITECTURE_GUIDELINES.md) for slice boundaries and pure domain/application logic.
- Follow [UBIQUITOUS_LANGUAGE](./docs/UBIQUITOUS_LANGUAGE.md) for shared naming.
- Keep child-facing Arabic text in i18n or localized level content.
- Use injected runtime configuration (no production URL behavior hooks).

## Review process

- One story per branch, commit set, and pull request.
- Use stacked PRs for dependent stories.
- Keep `docs/implementation-status.md` updated as the run checkpoint.
- Before opening a PR, run `npm run check` and capture real command results in the PR template.
- See [recommended branch protection](./docs/recommended-branch-protection.md) for required checks and merge policy.
