# MiniBot Studio: project structure and kickoff instructions for GitHub Copilot

How to use this file: place the downloaded files in the repository (section 1), then give Copilot the prompt in section 2. Sections 3 to 8 are the reference it follows.

## 1. Where the downloaded files go

Keep these paths exactly, and commit them to the default branch before starting:

```
.github/agents/minibot-backlog-implementer.agent.md
.github/pull_request_template.md
.github/workflows/ci.yml                  (template, US-040 adapts it)
docs/PRODUCT_BACKLOG_STYKANIMATE.md
docs/implementation-status.md
docs/story-index.tsv
docs/adr/0001-stykanimate-integration-strategy.md
docs/COPILOT_PROJECT_SETUP.md             (this file)
scripts/create-story-issues.sh
```

## 2. Prompt to give Copilot

Use the `minibot-backlog-implementer` agent and paste:

```
You are working in the MiniBot Studio repository. Read these first, in order:
1. docs/COPILOT_PROJECT_SETUP.md (project structure, tooling defaults, rules)
2. docs/PRODUCT_BACKLOG_STYKANIMATE.md (60 user stories, dependencies, sprint plan)
3. docs/implementation-status.md
4. docs/adr/0001-stykanimate-integration-strategy.md
5. .github/agents/minibot-backlog-implementer.agent.md

Then start with US-039: inspect the repository as it actually is, run the existing
install, test and build commands, and record the real results. Map what already
exists to the backlog and to the target structure. Do not overwrite or duplicate
existing work; adapt the structure to what exists and record every deviation in an ADR.

After US-039, work through the stories in sprint order. For every story use its own
branch, commit and pull request with the naming conventions in the backlog (section 5.6).
Update docs/implementation-status.md in each story. Never claim a command, test,
push or pull request that did not actually happen. Keep US-045 and the Story Studio
stories (US-046 to US-054) Blocked until the owner merges the licensing decision.
Continue with the next eligible story until the backlog is clean or a blocker needs
a human. At the end of each session, give the report described in the agent file.
```

## 3. Target repository structure

This follows section 5.2 of the backlog and adds the folders needed for tests, Story Studio and process. If the repository already has a different layout, keep it, map it in `docs/repo-assessment.md` (US-039), and record the decision. Do not move files only to match this tree.

```
minibot-studio/
├── index.html                      Arabic shell: lang="ar" dir="rtl"
├── css/
│   ├── app.css
│   ├── layout.css                  logical properties only (inline-start/end)
│   ├── blocks.css
│   └── animations.css              respects prefers-reduced-motion
├── js/
│   ├── app.js                      entry point, screen routing
│   ├── core/                       NO DOM access in this folder
│   │   ├── block-registry.js
│   │   ├── program-validator.js
│   │   └── execution-engine.js     bounded, cancellable, no eval/new Function
│   ├── simulator/
│   │   ├── world.js
│   │   ├── robot.js
│   │   ├── sensors.js
│   │   └── renderer.js             Canvas or DOM, one approach only
│   ├── editor/
│   │   ├── toolbox.js
│   │   ├── workspace.js            Blockly setup, Arabic, RTL
│   │   └── serialization.js        workspace to validated program data
│   ├── levels/
│   │   ├── level-registry.js
│   │   ├── challenge-manager.js
│   │   └── data/                   level definitions as JSON, versioned
│   ├── i18n/
│   │   └── ar.js                   every child-facing string, with text IDs
│   ├── storage/
│   │   └── save-manager.js         versioned, validated, local only
│   └── story/                      Story Studio entry, cards, licenses page
├── assets/
│   ├── robots/  worlds/  sounds/  icons/  fonts/
├── vendor/
│   └── blockly/                    bundled locally, license kept alongside
├── third_party/
│   └── stykanimate/                only after US-045 decision A (see section 6)
├── tests/
│   ├── unit/                       engine, validator, levels, storage
│   └── e2e/                        browser flows (US-044)
├── scripts/
│   ├── serve.mjs                   tiny static server, no dependencies
│   └── create-story-issues.sh
├── docs/                           backlog, status, ADRs, guides
├── .github/                        agent, PR template, workflows
├── package.json
├── LICENSE
├── THIRD_PARTY_NOTICES.md
└── README.md
```

Boundary rules:

- `js/core` and `js/simulator/world.js` never touch the DOM, so they stay testable with plain unit tests.
- World coordinates and robot headings are independent of the page's RTL direction. RTL never mirrors the grid or direction icons.
- Programs are validated data. The interpreter runs them. No `eval()`, no `new Function()`, no executing generated JavaScript.
- Every child-facing string lives in `js/i18n/ar.js`. Identifiers and developer text stay in English.

## 4. Tooling defaults

Decide and record these in US-039 (ADR), preferring the lightest option and what the repo already uses:

- Language: plain JavaScript with ES modules. Add TypeScript only if US-039 shows a clear benefit.
- No framework and no bundler by default. Blockly is installed from npm and its distribution files are copied into `vendor/blockly/` by a documented script. No CDN.
- Unit tests: Node's built-in test runner (`node --test`), if the Node version supports it.
- Browser tests: Playwright with Chromium, added as a dev dependency in US-044 only.
- Lint: only if the repo already has a linter; otherwise add the smallest reasonable one in US-040.
- Dev server: `scripts/serve.mjs`, no dependencies.

Expected `package.json` scripts, created by the stories that need them. Never document or call a script that does not exist:

```
start          serve the app locally
test           unit tests
test:e2e       browser tests (US-044)
lint           if a linter is adopted
build          if a build step exists
```

## 5. Order of work

Follow section 20 of the backlog. In short:

| Sprint | Focus | Stories |
|---|---|---|
| 0 | Baseline, CI, conventions, license decision | US-039, 040, 041, 043, 042, 045 |
| 1 | Core play loop | US-001, 004, 022, 005, 006, 007, 008, 021, 009, 033 |
| 2 | Block editor | US-002, 010, 011, 012, 014, 013, 016, 017, 034 |
| 3 | Levels and progress | US-023, 025, 024, 015, 026, 044 |
| 4 | Arabic experience, privacy, offline (MVP gate) | US-003, 028, 029, 030, 031, 032, 057 |
| 5 | Repeat, conditions, sensors | US-018, 019, 020, 056 |
| 6 | Story Studio (needs US-045) | US-046 to US-054 |
| 7 | Lab, backup, docs, release | US-035, 036, 037, 038, 027, 058, 059, 060 |

## 6. Story Studio (StykAnimate) rules

- Nothing from the upstream project is added until the owner merges the US-045 decision. The agent drafts that ADR and recommends decision A (license MiniBot Studio under GPL-3.0-or-later). The owner decides.
- If decision A: vendor the pinned upstream build (`def97214c2b491fbce82647f625a73f78416c6d8`, as inspected) under `third_party/stykanimate/`, unmodified, with its LICENSE and notices. Open it in its own window from an adult-gated entry. Share no data with it.
- If decision B: do not add upstream code. Build the small original workspace in US-055.

## 7. Working rules

- One story, one branch, one commit set, one pull request. Never combine stories.
- Branch `feat/US-###-short-kebab`, commit `feat(US-###): imperative summary`, PR `[US-###] Imperative summary`. Sprint integration branch `sprint/<n>-short-kebab`; one roll-up PR `[SPRINT-<n>] ...` per sprint with no new code.
- Test first where it fits, and every story ships with automated tests that actually ran.
- Update `docs/implementation-status.md` in every story. A story with an open PR is `In Review`, never `Done`.
- Check Arabic and RTL by eye on every UI change and attach screenshots.
- Never force-push, rewrite shared history, merge your own PRs, commit secrets, or touch settings.

## 8. Limits to expect

- Copilot may work one story or one sprint per session and then stop. Resume by running the agent again; it continues from `docs/implementation-status.md`.
- Pushing branches and opening PRs depends on repository permissions and plan. If it cannot, it must say so in the status file instead of pretending.
- Your part: review and merge PRs, decide US-045, and test the first levels with your son.
