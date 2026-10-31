# REVIEW-003: Post-REVIEW-002 master range (US-003 fix stack + US-030/031/032/057)

- **Reviewer:** Copilot (minibot-code-reviewer agent)
- **Date:** 2026-10-31
- **Scope anchor:** `docs/reviews/REVIEW-002.md` (reviewed through tip `f9b5f89`)
- **Scope reviewed in this report:** all commits on `master` in `f9b5f89..9113e03`, plus open story PRs
- **Tip commit reviewed:** `9113e03`
- **Open story PRs at review time:** none (`gh pr list --state open ...` returned `[]`)
- **Verdict:** **Changes requested**

---

## 1) Scope details

### Story commits in scope

| Story | Commit | PR |
|---|---|---|
| US-003 | `57d5708` | #58 |
| US-068 | `1ee437b` | #59 |
| US-061 | `0b76c82` | #60 |
| US-041 | `cea4aa9` | #61 |
| US-030 | `02999e7` | #62 |
| US-031 | `2785493` | #63 |
| US-032 | `c982d6e` | #64 |
| US-057 | `b9620bc` | #65 |
| Stack merge to master | `9113e03` | #66 |

---

## 2) Commands run and real results

| Command | Result |
|---|---|
| `npm ci` | ✅ passed (`found 0 vulnerabilities`) |
| `npm run check` | ❌ failed in `status:check` (unit ran first: **135 pass / 0 fail**) |
| `npm run lint --if-present` | ✅ passed (no lint script present) |
| `npm test` | ✅ **135 pass / 0 fail** |
| `npm run architecture:check` | ✅ passed |
| `npm run language:check` | ✅ passed |
| `npm run safety:check` | ✅ passed |
| `npm run validate:agent` | ✅ passed |
| `npm run status:check` | ❌ failed (6 `In Review` rows point to merged PRs without documented manual blocker) |
| `npm run test:browser-safety` | ✅ **60 pass / 0 fail** |
| `npm run build` | ✅ passed (`Build completed successfully. dist/ is ready.`) |

### Unit-test glob coverage check (Windows/Linux drift guard)

- Unit test files on disk (`tests/unit/**/*.test.js`): **27**
- Unit test files executed (JUnit `testcase@file` distinct count): **27**
- Missing from execution: **none**

---

## 3) CI comparison (newest PR and newest master run)

- Newest PR in scope: **#66**, CI run `41232409952` (failed).
- Newest master CI run: `41232417321` (failed).
- Both runs reported unit-test count `ℹ tests 135`, which matches local `npm test` (**135**).
- CI failures were in `npm run check` at `status:check`:
  - Same real mismatch as local: stale `In Review` statuses for merged PRs.
  - Additional CI-only failures: many `HEAD ancestry check failed` errors from `check-implementation-status.mjs` while CI uses shallow checkout (`actions/checkout` without `fetch-depth: 0`).

---

## 4) Manual browser drive

Served production entry at `http://127.0.0.1:4180` and exercised key flows.

Verified:

- Arabic/RTL baseline is correct (`lang="ar"`, `dir="rtl"`), and direction icons remain `direction:ltr`.
- Drag and drop works: dragging `#block-moveForward` into `#program-workspace` creates a program step.
- Run/stop/reset works:
  - run reaches `levelComplete`,
  - stop transitions to `stopped`,
  - reset transitions to `reset`.
- Error flow works (using `test-entry` invalid-level scenario): fallback level loads, friendly Arabic error appears, no raw stack in UI.

Observed accessibility gap:

- `.program-step__remove` rendered at **36x36** (measured in browser), below US-057 target-size criterion.

---

## 5) Closure check of earlier reports

| Prior finding | Previous status | This review |
|---|---|---|
| REVIEW-002 B1 (primary actions disabled after completion) | Closed | ✅ Still closed |
| REVIEW-002 B2 (US-068 AC4 evidence mismatch) | Closed | ✅ Still closed |
| REVIEW-002 M1 (robot-lab architectural regrowth) | Closed | ❌ **Recurred** (file regrew; severity raised) |
| REVIEW-002 M2 (implementation-status stale/inconsistent) | Closed | ❌ **Recurred** (severity raised) |
| REVIEW-002 m1 (README stale structure path) | Closed | ❌ **Recurred** (severity raised) |

---

## 6) Story traceability (stories in scope)

Legend: **Met / Partly / Not met / Untested**

### US-003 — Provide a parent settings area

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Settings area opens separately from gameplay | `js/robot-lab.js:115`, `js/features/shell/ui/shell-view.js:123`, `js/features/shell/ui/shell-view.js:127` | `tests/e2e/parent-settings.test.mjs:6` | Met |
| Sound effects can be enabled/disabled | `js/robot-lab.js:150`, `js/features/learning-progress/infrastructure/local-storage-parent-settings-repository.js:10` | `tests/e2e/parent-settings.test.mjs:43` | Met |
| Clearing progress requires confirmation | `js/robot-lab.js:125`, `js/robot-lab.js:132` | `tests/e2e/persist-learning-progress.test.mjs:105`, `tests/e2e/persist-learning-progress.test.mjs:130`, `tests/e2e/persist-learning-progress.test.mjs:148` | Met |
| Leaving parent settings does not discard saved progress | `js/robot-lab.js:121` | `tests/e2e/parent-settings.test.mjs:32`, `tests/e2e/parent-settings.test.mjs:34` | Met |
| Parent area does not request unnecessary personal information | `index.html:39` | `tests/e2e/parent-settings.test.mjs:24`, `tests/e2e/parent-settings.test.mjs:121` | Met |

### US-030 — Guide first-time users

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Tutorial appears on first use or on demand | `js/features/shell/application/tutorial-controller.js:17`, `js/robot-lab.js:163`, `js/robot-lab.js:431` | `tests/e2e/first-time-tutorial.test.mjs:6` | Met |
| Each tutorial step focuses one action | `js/features/shell/application/tutorial-controller.js:72`, `js/features/shell/ui/shell-view.js:178`, `js/features/shell/ui/shell-view.js:183`, `js/features/shell/ui/shell-view.js:188` | `tests/e2e/first-time-tutorial.test.mjs:6` | Met |
| Tutorial identifies toolbox, workspace, and Play | `js/shared/i18n/ar.js:89`, `js/shared/i18n/ar.js:94`, `js/shared/i18n/ar.js:99` | `tests/e2e/first-time-tutorial.test.mjs:40`, `tests/e2e/first-time-tutorial.test.mjs:43` | Met |
| Tutorial can be skipped and replayed | `js/features/shell/application/tutorial-controller.js:24`, `js/features/shell/application/tutorial-controller.js:43` | `tests/e2e/first-time-tutorial.test.mjs:46`, `tests/e2e/first-time-tutorial.test.mjs:55` | Met |
| Tutorial does not obscure every part of screen at once | `css/app.css:122` | `tests/e2e/first-time-tutorial.test.mjs:29`, `tests/e2e/first-time-tutorial.test.mjs:37` | Met |
| Tutorial text and narration are Arabic | `js/shared/i18n/ar.js:81`, `js/features/shell/infrastructure/audio-feedback.js:95` | `tests/e2e/first-time-tutorial.test.mjs:71`, `tests/e2e/first-time-tutorial.test.mjs:107` | Met |

### US-031 — Work offline

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Home/core levels/simulation work offline after initial availability | `service-worker.js:1`, `service-worker.js:52`, `js/app.js:6` | `tests/e2e/work-offline.test.mjs:16`, `tests/e2e/work-offline.test.mjs:34` | Met |
| Core assets do not depend on external CDN | `index.html:13`, `index.html:14`, `js/app.js:1` | `tests/e2e/network-safety.test.mjs` (in full suite), plus `npm run test:browser-safety` 60/60 | Met |
| No network request required to play a core level | `service-worker.js:79`, `service-worker.js:84` | `tests/e2e/work-offline.test.mjs:31`, `tests/e2e/work-offline.test.mjs:34` | Met |
| README documents local run | `README.md:33` | Documentation check by inspection | Met |
| Third-party local-bundling/license method documented | `README.md:39`, `README.md:43` | Documentation check by inspection | Met |

### US-032 — Keep saved data local

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Sound settings, progress, and projects stored locally | `js/features/shell/infrastructure/local-storage-app-data-repository.js:1`, `js/features/shell/infrastructure/local-storage-app-data-repository.js:5` | `tests/e2e/parent-settings.test.mjs:121`, `tests/e2e/persist-learning-progress.test.mjs:105` | Met |
| App does not collect child name/photos/location | `docs/UBIQUITOUS_LANGUAGE.md:27` (local-only data model) | `tests/e2e/parent-settings.test.mjs:121`, `tests/e2e/parent-settings.test.mjs:169` | Met |
| No external analytics/advertising | `index.html:13` (CSP) | `tests/e2e/parent-settings.test.mjs:157`, `tests/e2e/parent-settings.test.mjs:170` | Met |
| Storage failures handled with clear message | `js/robot-lab.js:137`, `js/robot-lab.js:138` | `tests/e2e/persist-learning-progress.test.mjs:172`, `tests/e2e/persist-learning-progress.test.mjs:195` | Met |
| Parent area can delete local app data | `js/robot-lab.js:125`, `js/features/shell/infrastructure/local-storage-app-data-repository.js:18` | `tests/e2e/persist-learning-progress.test.mjs:105` | Met |

### US-041 — Document contribution conventions and track story status

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| `CONTRIBUTING.md` documents naming conventions | `CONTRIBUTING.md:15`, `CONTRIBUTING.md:25` | Manual inspection | Met |
| PR template requires story ID, AC checklist, commands/results, Arabic/RTL verification | `.github/pull_request_template.md:3`, `.github/pull_request_template.md:13`, `.github/pull_request_template.md:21`, `.github/pull_request_template.md:33` | Manual inspection | Met |
| `docs/implementation-status.md` tracks every story accurately | `docs/implementation-status.md:14`..`docs/implementation-status.md:79` | `npm run status:check` fails with six stale `In Review` rows | Partly |

### US-057 — Respect reduced motion, contrast, and target size

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Animations respect `prefers-reduced-motion` | `css/app.css:542` | `tests/e2e/accessibility-comfort.test.mjs:185`, `tests/e2e/accessibility-comfort.test.mjs:191` | Met |
| Text and key graphics meet WCAG AA contrast | `css/app.css:60`, `css/app.css:280`, `css/app.css:285`, `css/app.css:290` | `tests/e2e/accessibility-comfort.test.mjs:30`, `tests/e2e/accessibility-comfort.test.mjs:110`, `tests/e2e/accessibility-comfort.test.mjs:125` | Met |
| Touch targets are at least 64 CSS pixels on child-facing screens | `css/app.css:365`, `css/app.css:367` (`.program-step__remove` is 36px) | Browser measurement in this review: `.program-step__remove` = 36x36; selector not covered by `tests/e2e/accessibility-comfort.test.mjs:21` | **Not met** |

### US-061 — Introduce vertical-slice structure and architecture check

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Slice folders + public APIs exist | `js/features/robot-simulation/index.js:1`, `js/features/program-editing/index.js:1`, `js/features/program-execution/index.js:1`, `js/features/levels/index.js:1`, `js/features/learning-progress/index.js:1`, `js/features/shell/index.js:1` | Repository tree inspection | Met |
| Existing simulator/level behavior remains in slice architecture | `js/robot-lab.js:1` imports slice APIs only | Full unit/browser suites pass | Met |
| `architecture:check` enforces boundaries/effects/state rules with empty allowlist | `scripts/check-architecture.mjs:6`, `scripts/check-architecture.mjs:74`, `scripts/check-architecture.mjs:87`, `scripts/architecture-allowlist.json:1` | `npm run architecture:check` passed | Met |
| Check runs in CI and deliberate violation was verified once then reverted | `.github/workflows/ci.yml:42` | CI runs the check; deliberate-violation proof not re-executed in this review | Untested |
| Existing unit and browser tests pass | N/A | `npm test` 135/0, `npm run test:browser-safety` 60/0 | Met |

### US-068 — Add the production-readiness gate

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| `npm run check` is the full gate and CI runs the same command | `package.json:20`, `.github/workflows/ci.yml:42` | Command exists, but currently fails on status-check mismatch/CI ancestry false-positives | Partly |
| `npm run build` outputs `dist/` shipped files only and validates CSP | `scripts/build.mjs:10`, `scripts/build.mjs:39`, `scripts/build.mjs:66` | `npm run build` passed | Met |
| Unexpected exception shows friendly Arabic message and logs through logger port | `js/robot-lab.js:237`, `js/features/shell/application/report-runtime-error.js:1` | `tests/e2e/unexpected-error-handling.test.mjs:6` | Met |
| `npm audit --omit=dev` output recorded in PR | `docs/implementation-status.md:79` (references PR #45 evidence comment) | Evidence link present; local `npm ci` reported 0 vulnerabilities | Met |
| README/docs cover setup, commands, structure, conventions, review process, branch protection | `README.md:15`, `README.md:51`, `docs/recommended-branch-protection.md` | README contains required sections, but structure section has stale path (`js/i18n/`) | Partly |

---

## 7) Findings

### B1 — **Blocker** — `status:check` is CI-hostile on shallow checkout and keeps default-branch CI red

- **Story impact:** US-041, US-068
- **Evidence:**
  - `.github/workflows/ci.yml:20` uses `actions/checkout@v4` without `fetch-depth: 0`.
  - `scripts/check-implementation-status.mjs:84` and `scripts/check-implementation-status.mjs:86` require `git merge-base --is-ancestor` for many historical SHAs.
  - Latest master run `41232417321` and PR run `41232409952` fail with multiple `HEAD ancestry check failed` violations.
- **Why it matters:** The release gate is red on current `master`; this blocks trustworthy CI signal and delivery.
- **Fix task:** `fix/US-041-make-status-check-ci-shallow-safe`
  1. Either fetch full history in CI (`fetch-depth: 0`) or fetch required SHAs before ancestry checks.
  2. In `check-implementation-status.mjs`, distinguish “commit object missing in shallow clone” from “not ancestor”.
  3. Re-run CI and verify `npm run check` can complete on PR and push events.

---

### B2 — **Blocker** (recurrence of REVIEW-002 M2) — `docs/implementation-status.md` is stale after stack merge

- **Status:** **Closed** in `fix/US-041-reconcile-status-after-pr-66`.
- **Story impact:** US-041
- **Evidence:**
  - `docs/implementation-status.md:42` (US-031), `:43` (US-032), `:52` (US-041), `:68` (US-057), `:72` (US-061), `:79` (US-068) are still `In Review`.
  - Their PRs are merged (`#63`, `#64`, `#61`, `#65`, `#60`, `#59`).
  - `npm run status:check` fails on these six rows.
- **Closure evidence:**
  - US-031, US-032, US-041, US-057, US-061, and US-068 were reconciled from `In Review` to `Done` with merged-PR next-action notes.
  - `npm run status:check` passed after reconciliation.
- **Why it matters:** The source-of-truth status file is no longer truthful, and the repo gate fails locally and in CI.
- **Fix task:** `fix/US-041-reconcile-status-after-pr-66`
  1. Move merged stories out of `In Review` unless an explicit manual blocker remains.
  2. Keep `In Review` only for rows with **open** PRs or explicit manual-review blocker text.
  3. Re-run `npm run status:check` and `npm run check` and record results.

---

### B3 — **Blocker** (recurrence of REVIEW-002 M1, severity raised) — `js/robot-lab.js` regrew into a multi-responsibility god module

- **Story impact:** US-061
- **Evidence:**
  - `js/robot-lab.js` currently measures **438 lines** (local line-count check).
  - Module-level mutable state remains concentrated at `js/robot-lab.js:33`..`js/robot-lab.js:41`.
  - The same file still owns parent-area, tutorial, execution lifecycle, persistence coordination, error routing, and UI wiring (`js/robot-lab.js:115`, `:125`, `:163`, `:237`, `:382`, `:412`, `:426`).
- **Why it matters:** This is direct recurrence of the previously closed orchestration-regrowth finding and increases coupling/risk for every new story.
- **Fix task:** `fix/US-061-complete-robot-lab-split`
  1. Move mutable runtime session state behind slice-level controllers/factories.
  2. Keep `robot-lab.js` as composition wiring only (target `<300` immediately, `<200` guideline target).
  3. Add unit tests for extracted controllers and keep full suite green.

---

### M1 — **Major** — US-057 touch-target criterion is not fully met (`.program-step__remove` is 36x36)

- **Story impact:** US-057
- **Evidence:**
  - CSS sets remove button size below criterion: `css/app.css:365`..`css/app.css:367` (`min-block-size: 36px`).
  - Manual browser measurement in this review reported `.program-step__remove` = `36x36`.
  - The automated touch-target test list omits this control (`tests/e2e/accessibility-comfort.test.mjs:21`).
- **Why it matters:** This misses the stated “64 CSS pixels” target-size acceptance criterion for child-facing interaction.
- **Fix task:** `fix/US-057-raise-program-step-remove-target-size`
  1. Increase remove-control touch target to at least `64x64` (or equivalent accessible redesign).
  2. Extend `tests/e2e/accessibility-comfort.test.mjs` touch selector coverage to include `.program-step__remove`.
  3. Re-verify on mobile-sized viewport.

---

### M2 — **Major** — Tutorial local-storage repository can throw during construction in blocked-storage environments

- **Story impact:** US-030, US-032
- **Evidence:**
  - `js/features/shell/infrastructure/local-storage-tutorial-state-repository.js:2` uses `storage = globalThis.localStorage` without a safe getter.
  - `js/robot-lab.js:30` constructs this repository at startup.
  - Reproduction in this review: overriding `globalThis.localStorage` getter to throw caused `createLocalStorageTutorialStateRepository()` to throw `blocked-storage`.
- **Why it matters:** In restricted browser storage contexts, tutorial initialization can crash instead of failing gracefully.
- **Fix task:** `fix/US-030-harden-tutorial-storage-access`
  1. Replace default parameter access with `getDefaultStorage()` guarded by `try/catch` (same pattern as other repositories).
  2. Add unit coverage for throwing `localStorage` getter and unavailable storage.
  3. Keep behavior as graceful fallback (`false`/no crash).

---

### M3 — **Major** (recurrence of REVIEW-002 m1, severity raised) — README structure path is stale

- **Story impact:** US-058 / release docs
- **Evidence:**
  - `README.md:56` still lists `js/i18n/`, but this path does not exist in the repository.
- **Why it matters:** Developer onboarding documentation is currently inaccurate.
- **Fix task:** `fix/US-058-correct-readme-structure-paths`
  1. Remove stale `js/i18n/` reference and keep canonical `js/shared/i18n/`.
  2. Add a lightweight docs consistency check (optional but recommended) to prevent regression.

---

## 8) Stale branches / PRs / revert-commit risk

### Closed PRs to delete or archive (stale)

- `#56` (`feat/US-029-optional-sound-effects` -> `master`) is closed and unmerged; superseded by merged story flow.
- Historical stacked closed PRs `#2`..`#35` are superseded by later merged stack and can be archived for hygiene (already non-actionable for delivery).

### Branches with stale checkpoint-only tip commits (ahead by 1, behind master)

- `origin/feat/US-030-guide-first-time-users`
- `origin/feat/US-031-work-offline`
- `origin/feat/US-032-keep-saved-data-local`
- `origin/feat/US-057-accessibility-comfort`
- `origin/fix/US-003-reenable-primary-actions-after-run`
- `origin/fix/US-041-sync-status-with-git-and-pr-state`
- `origin/fix/US-061-split-robot-lab-orchestrator`
- `origin/fix/US-068-record-audit-evidence`

(Also present: older stale branch set from prior stack cleanup.)

### Revert commits still on remote branches (must not be merged)

- `origin/feat/US-041-document-contribution-conventions`
  - `9fa936a Revert "feat(US-043): enforce CSP and static safety checks"`
- `origin/feat/US-064-introduce-repository-ports`
  - `66ecbfa Revert "feat(US-063): extract ProgramEditor model and workspace UI"`

---

## 9) Positives worth keeping

- Tutorial flow extraction is cleanly test-backed (`tutorial-controller` + e2e tutorial flow).
- Offline support integration is cohesive (service worker + registration + dedicated unit/e2e coverage).
- Parent-area local-data controls include explicit confirmation and failure-path messaging tests.
- Audio feedback and run-session orchestration extraction are isolated and unit-tested.
- Browser suite breadth increased and remains stable at **60 passing tests**.

---

## 10) Must-close list before new feature work

1. **B1** — Make `status:check` CI-safe under shallow checkout (or switch CI checkout depth to full history).
2. ✅ **B2** — Reconcile stale `In Review` rows now that PRs `#59/#60/#61/#63/#64/#65` are merged.
3. **B3** — Stop `robot-lab.js` regrowth and finish the orchestration split.
4. **M1** — Meet US-057 64px touch-target requirement for remove controls.
5. **M2** — Harden tutorial local-storage initialization against throwing storage access.
6. **M3** — Correct README structure paths to match repository reality.
