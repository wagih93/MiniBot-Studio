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
| `npm start` | Serve the app locally at `http://127.0.0.1:4173` (set `PORT` to override). |
| `npm test` | Run unit tests (Node test runner). |
| `npm run test:browser-safety` | Run Playwright browser safety and behavior tests. |
| `npm run architecture:check` | Enforce vertical-slice and purity boundaries. |
| `npm run language:check` | Enforce ubiquitous language naming and Arabic-literal rules. |
| `npm run safety:check` | Run static safety checks. |
| `npm run validate:agent` | Validate agent frontmatter metadata. |
| `npm run build` | Produce `dist/` with shipped files and validate CSP in `dist/index.html`. |
| `npm run check` | Full readiness gate: lint (if present), unit tests, architecture, language, safety, agent validation, browser tests, and build. |

## Offline use

1. Start the app with `npm start`.
2. Open `http://127.0.0.1:4173` once while connected so the service worker can cache the app shell and requested modules.
3. Reopen the same URL offline. The home screen, core levels, and robot simulation remain playable from local cache.

## Runtime asset and licensing notes

- MiniBot Studio runtime uses only local project files (`index.html`, `service-worker.js`, `css/`, and `js/`).
- Core play has no CDN dependency and no required network request after caching.
- No third-party runtime library is bundled today. If a runtime dependency is added later, it must be vendored locally and documented in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) with license and local-bundling steps.

## Local data policy

- MiniBot stores only local gameplay data: level progress, completed levels, saved programs, tutorial completion state, and sound preference.
- The app does **not** collect child name, photos, or location data.
- Parent Area includes **"امسح البيانات المحلية"** to delete all locally stored app data from the device.

## Project structure

- `index.html` — Production entry page.
- `js/app.js` — Composition root.
- `js/features/` — Vertical slices (`domain`, `application`, `ui`, optional `infrastructure`) with slice-level `index.js` public API.
- `js/shared/i18n/` — Localization resources.
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
