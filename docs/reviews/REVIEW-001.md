# REVIEW-001: Sprint 2.5 — US-061 to US-068

- **Reviewer:** Copilot (minibot-code-reviewer agent)
- **Date:** 2026-10-26
- **Scope:** All commits on `master` since REVIEW-000 baseline (`37e36b9`), covering Sprint 2.5 stories US-061 to US-068 (PRs #28–#35)
- **Tip commit reviewed:** `da03b04`
- **Story commits:**

| Story | Commit |
|-------|--------|
| US-061 | `1abc185` |
| US-064 | `71514c3` |
| US-063 | `3359d0d` |
| US-062 | `c5d3926` |
| US-065 | `454e035` |
| US-066 | `396e80e` |
| US-067 | `29203a5` |
| US-068 | `33d0980` |

- **Verdict:** **Changes approved** (all code findings closed; M4 is a process finding requiring owner action)

---

## Commands run and real results

| Command | Result |
|---------|--------|
| `npm ci` | ✅ succeeded, 0 vulnerabilities |
| `npm test` | ✅ **45 pass, 0 fail** |
| `npm run architecture:check` | ✅ passed |
| `npm run language:check` | ✅ passed |
| `npm run safety:check` | ✅ passed |
| `npm run validate:agent` | ✅ passed |
| `npm run build` | ✅ `dist/` produced and CSP validated |
| `npm run test:browser-safety` (33 Playwright files) | ✅ **33 pass, 0 fail** |
| `npm audit --omit=dev` | ✅ 0 vulnerabilities |

> **Note on "45 vs 34" concern:** `npm test` was run directly and returned 45 passing tests. The concern in the review brief does not materialise; 45 is the real count.

---

## REVIEW-000 closure verification

| Finding | Claimed | Verified |
|---------|---------|---------|
| B1 god file | Closed | ⚠️ **Partially** — domain and application extracted; UI views all stubs. See B1 below. |
| B2 master empty | Closed | ✅ All 8 story commits are on `master`. |
| M1 inverted pyramid | Closed | ✅ 45 unit tests vs 9 before; domain/application fully covered. |
| M2 test hooks in production | Closed | ✅ `runtime-config.test.js` verifies no URL params in `robot-lab.js` or `app.js`. |
| M3 fixtures in shipped folder | Closed | ✅ Fixtures in `tests/fixtures/`; build excludes `tests/`. |
| M4 vocabulary inconsistency | Closed | ✅ Language check passes; `objective-tracker` naming correct in code. |
| M5 hard-coded Arabic | Closed | ✅ Arabic only in `js/i18n/`, `js/shared/i18n/`, and level data. Language check enforces it. |
| M6 impure domain function | Closed | ✅ `updateObjectiveProgress` returns new state, no mutation. |
| m1 planned structure missing | Closed | ✅ `js/features/` tree exists; architecture check enforces it. |
| m2 agent definition | Closed | Not re-verified (repo config; out of code scope). |
| m3 manual/license gate | Owner-tracked | Not in scope. |
| m4 build only baseline | Closed | ✅ `dist/` produced with CSP validation. Qualified: see M1 below. |

---

## Story traceability

### US-061 — Introduce vertical-slice structure and architecture check

| # | Acceptance criterion | Evidence | Verdict |
|---|---------------------|----------|---------|
| 1 | Folders from ARCHITECTURE_GUIDELINES §1 exist: `js/app.js`, `js/shared/`, and `js/features/` slices with `index.js` | All 6 slices (`robot-simulation`, `program-editing`, `program-execution`, `levels`, `learning-progress`, `shell`) with `index.js` confirmed in workspace | **Met** |
| 2 | Existing simulator and level code moved into slices; imports updated | Domain code in `js/features/robot-simulation/domain/`, `js/features/levels/domain/`. Legacy folders `js/simulator/`, `js/levels/`, `js/i18n/` still present as backward-compat shims | **Partly** |
| 3 | `architecture:check` fails on cross-slice internal imports, effects in domain/application, shared→slice imports, module-level mutable state outside composition root; allowlist empty | All violation categories tested and enforced; allowlist is `{}` | **Met** |
| 4 | Check runs in CI | CI runs `npm run check` which includes `architecture:check` | **Met** |
| 5 | All existing unit and browser tests pass | 45 unit / 33 browser — all pass | **Met** |

### US-062 — Extract the execution engine

| # | Acceptance criterion | Evidence | Verdict |
|---|---------------------|----------|---------|
| 1 | `program-execution` exposes `validateProgram`, `compileProgram`, `runProgram` with injected `Delay`, `ExecutionLimits`, `AbortSignal` | `js/features/program-execution/index.js` exports all three; `runProgram` accepts `delay`, `signal`, `executionConfig` | **Met** |
| 2 | No DOM/storage/timer/console access; no argument mutation | Architecture check passes; `updateObjectiveProgress` returns new state | **Met** |
| 3 | Unit tests cover: move, turn, obstacle, grid edge, collect, objective completion, step limit, abort, empty program, invalid program | `tests/unit/program-execution/run-program.test.js` (8 test cases, all scenarios listed) | **Met** |
| 4 | `robot-lab.js` no longer contains execution or validation logic | `robot-lab.js` delegates to `runProgram`/`validateProgram`; no inline simulation logic | **Met** |
| 5 | Existing browser tests pass | 33 pass | **Met** |

### US-063 — Extract the program-editing model

| # | Acceptance criterion | Evidence | Verdict |
|---|---------------------|----------|---------|
| 1 | `program-editing` has a pure `ProgramEditor` with add, remove, move, clear enforcing available blocks | `js/features/program-editing/domain/program-editor.js` (153 lines); returns new program state | **Met** |
| 2 | Drag and drop and rendering live in `ui/` and call the model | `js/features/program-editing/ui/program-workspace-view.js` (207 lines) wraps `ProgramEditor` | **Met** |
| 3 | Unit tests cover insert positions, reorder, delete, unavailable blocks, unique step ids | `tests/unit/program-editing/program-editor.test.js` (6 test cases) | **Met** |
| 4 | No module-level state for program or pending drags | State is inside `programEditor` and `programWorkspaceView` objects created at init time | **Met** |
| 5 | Existing browser tests pass | 33 pass | **Met** |

### US-064 — Introduce repository ports and adapters

| # | Acceptance criterion | Evidence | Verdict |
|---|---------------------|----------|---------|
| 1 | `ProgressRepository` and `ProgramRepository` ports in `learning-progress`, with localStorage and in-memory adapters | `js/features/learning-progress/application/progress-repository-port.js`, `program-repository-port.js`; 4 adapters | **Met** |
| 2 | One contract test suite against both adapters | `tests/unit/learning-progress/repository-contract.test.js` (17 test cases covering both adapters for both ports) | **Met** |
| 3 | Corrupt data, unknown version, unavailable storage returns safe default, no throw | Contract tests include `'handles corrupt and unknown-version stores safely'` and `'returns safe defaults when storage is unavailable'` | **Met** |
| 4 | Nothing outside the adapter uses `localStorage`; enforced by architecture check | Grep of `js/features` shows localStorage only in `infrastructure/local-storage-*.js`; architecture check passes | **Met** |
| 5 | Existing browser tests pass | 33 pass | **Met** |

### US-065 — Remove test hooks from production code

| # | Acceptance criterion | Evidence | Verdict |
|---|---------------------|----------|---------|
| 1 | `RuntimeConfig` injected; production code never reads URL params | `createDefaultRuntimeConfig()` injected in `app.js`; `robot-lab.js` reads `runtimeConfig` only | **Met** |
| 2 | Tests use a separate entry point under `tests/` | `tests/e2e/test-entry.js` + `tests/e2e/test-entry.html`; reads URL params and builds config | **Met** |
| 3 | A test proves `?maxSteps=1` has no effect on production | `'Production entry ignores query parameter execution hooks'` browser test passes | **Met** |
| 4 | Build output contains none of the former query parameter names | `tests/unit/runtime-config.test.js` checks `robot-lab.js` and `app.js` sources for `maxSteps=`, `repeat=`, `stepDelayMs=` — none found | **Met** |
| 5 | Browser tests migrated to test entry point and pass | All 33 e2e tests use `test-entry.html`; pass | **Met** |

### US-066 — Move test fixtures out of shipped code

| # | Acceptance criterion | Evidence | Verdict |
|---|---------------------|----------|---------|
| 1 | `broken-level.js`, `test-level-validation.js` live under `tests/fixtures/` | Confirmed at `tests/fixtures/levels/` | **Met** |
| 2 | Level registry loads only real levels | `js/features/levels/domain/level-registry.js` imports only `level-001`, `level-002`, `level-collect` | **Met** |
| 3 | Build and `dist/` exclude `tests/` | `validateDistContents` checks for `'tests'` in `dist/js` entries — none found | **Met** |
| 4 | Unit tests for level validator still pass using fixtures | `tests/unit/level-validator.test.js` imports `brokenLevel` from `tests/fixtures/levels/broken-level.js`; passes | **Met** |

### US-067 — Apply the ubiquitous language and enforce it

| # | Acceptance criterion | Evidence | Verdict |
|---|---------------------|----------|---------|
| 1 | Code identifiers follow `UBIQUITOUS_LANGUAGE.md`; banned synonyms absent | `challenge-manager.js` gone; `objective-tracker.js` correct; `collectible` used consistently; language check passes | **Met** |
| 2 | `language:check` fails on banned synonyms and Arabic literals in logic files | Checked: passes; deliberate violation would fail (check enforces banned regex patterns) | **Met** |
| 3 | Level titles and hints in localized content, not inline in logic | Level data files (`js/features/levels/domain/data/`) contain Arabic inline; explicitly allowed by check. No Arabic in `robot-lab.js` or other logic | **Met** |
| 4 | Check runs in CI | `npm run check` includes `language:check`; CI runs `npm run check` | **Met** |

### US-068 — Add the production-readiness gate

| # | Acceptance criterion | Evidence | Verdict |
|---|---------------------|----------|---------|
| 1 | `npm run check` covers all sub-checks; CI runs same command | `package.json` `check` script confirmed; CI `.github/workflows/ci.yml` runs `npm run check` | **Met** |
| 2 | `npm run build` produces `dist/` with only shipped files; CSP validated | CSP validated ✅. However `dist/js/simulator/`, `dist/js/levels/`, `dist/js/i18n/` (legacy shims, 9 files) are shipped but serve no production function | **Partly** |
| 3 | Unexpected exception shows friendly Arabic message; reported through logger port; no raw stack trace | Browser test `'Unexpected runtime errors show a friendly status…'` passes; `reportRuntimeError` inspected | **Met** |
| 4 | `npm audit --omit=dev` recorded in PR | Run locally: 0 vulnerabilities | **Met** |
| 5 | README documents setup, commands, structure, conventions, review process; `docs/` explains branch protection | `README.md` has all sections; `docs/recommended-branch-protection.md` present | **Met** |

---

## Findings

### B1 — Blocker (reraised from REVIEW-000 B1): UI view factories are empty stubs; robot-lab.js (792 lines) still owns all UI rendering

**Verdict: Closed.** Fixed in `fix/US-061-extract-remaining-ui-views` (PR #40).

**File/Lines:** `js/features/robot-simulation/ui/world-grid-view.js:1`, `js/features/program-execution/ui/execution-status-view.js:1`, `js/features/shell/ui/shell-view.js:1`, `js/features/levels/ui/level-meta-view.js:1`, `js/features/learning-progress/ui/learning-progress-view.js:1`, `js/robot-lab.js:1-792`

**Evidence:**
```js
// js/features/robot-simulation/ui/world-grid-view.js
export function createWorldGridView() {
  return Object.freeze({ kind: 'world-grid-view' });
}
// All 5 UI view factories are identical empty stubs — same pattern.
```

`robot-lab.js` still contains:
- `renderWorldGrid` (~35 lines) — inline DOM creation for every cell
- `createBlockButton` + `renderAvailableBlocks` (~45 lines) — inline block toolbox rendering
- `renderLevelMeta`, `updateLevelIndicator`, `updateCollectionSummary` (~25 lines) — inline level meta rendering
- `applyStaticLabels`, `syncPrimaryActions` (~35 lines) — inline shell wiring
- 12 module-level `let` variables exempt from the architecture check via `compositionRootFiles`

REVIEW-000 B1 declared "closed" after US-061–US-068. The claim is inaccurate: extraction of domain and application logic is complete (good), but the UI layer extraction was never performed — five empty stub factories were added to satisfy the folder structure without moving any rendering logic. The file went from 1,053 → 792 lines but the REVIEW-000 finding identified rendering, toolbox, state management, localStorage, and execution as problems; only the last two were actually resolved.

Per the review rules, a returning Blocker is raised one severity level; it stays Blocker.

**Why it matters:** `renderWorldGrid`, `createBlockButton`, and `renderLevelMeta` are untestable without a browser; they will grow with every new block type, new level concept, or UI change. Having a 792-line "composition root" that also renders contradicts the guidelines ("app.js: creates adapters and slices, wires them, nothing else"). Future stories (US-023 levels, US-024 hints, US-018 repeat blocks) will add more rendering logic back into this file.

**Fix:** New story `US-069a` (or equivalent) — Extract remaining UI rendering from `robot-lab.js` into slice `ui/` files:
- `js/features/robot-simulation/ui/world-grid-view.js`: implement `createWorldGridView({ element, … })` with `render(level, robotState, animation)` and replace inline `renderWorldGrid`
- `js/features/program-editing/ui/block-toolbox-view.js`: `createBlockToolboxView` replacing `createBlockButton`/`renderAvailableBlocks`
- `js/features/levels/ui/level-meta-view.js`: implement `createLevelMetaView` replacing `renderLevelMeta`, `updateLevelIndicator`, `updateCollectionSummary`
- `js/features/program-execution/ui/execution-status-view.js`: implement `createExecutionStatusView` replacing `setStatus` and `setActiveProgramStep`
- `js/features/shell/ui/shell-view.js`: implement `createShellView` replacing `applyStaticLabels`, `syncPrimaryActions`

Acceptance criteria: `robot-lab.js` under 200 lines; no DOM-creating calls in `robot-lab.js`; all UI factories unit-testable (JSDOM); all browser tests still pass.

---

### M1 — Major: Legacy shim folders are shipped to `dist/` and bypass the architecture check

**Verdict: Closed.** Fixed in `fix/US-061-remove-legacy-shims` (PR #39).

**File/Lines:** `js/simulator/robot.js:1`, `js/simulator/world.js:1`, `js/levels/level-registry.js:1`, `js/levels/level-validator.js:1`, `js/levels/objective-tracker.js:1`, `js/levels/data/level-001.js:1`, `js/i18n/ar.js:1` (and 2 more level data shims); `scripts/build.mjs:14`

**Evidence:**
The build copies the entire `js/` folder to `dist/`. The `validateDistContents` check only verifies root entries and the absence of `tests/` paths. Legacy shim folders (`js/simulator/`, `js/levels/`, `js/i18n/`) pass this check and end up in `dist/`:
```
dist/js/simulator/robot.js        → 6-line re-export shim
dist/js/simulator/world.js        → 6-line re-export shim
dist/js/levels/level-registry.js  → 1-line re-export shim
dist/js/i18n/ar.js                → 90-line canonical AR file (also at js/shared/i18n/ar.js)
...
```

Additionally, the architecture check scans only files inside `js/features/` for cross-slice import violations. Files in `js/simulator/` and `js/levels/` import internal slice files directly (e.g., `js/levels/objective-tracker.js:8` imports `../features/levels/domain/objective-tracker.js`, not `../features/levels/index.js`) — an import pattern that would fail the check if done from inside a slice, but is invisible from outside.

Four unit test files still import through these shims:
- `tests/unit/world-movement.test.js:3-5` — imports from `js/levels/data/level-001.js`, `js/simulator/robot.js`, `js/simulator/world.js`
- `tests/unit/robot-rotation.test.js:3-4` — imports from `js/simulator/robot.js`, `js/levels/data/level-001.js`
- `tests/unit/level-validator.test.js:3,5` — imports from `js/levels/data/level-001.js`, `js/levels/level-validator.js`
- `tests/unit/objective-tracker.test.js:3,8` — imports from `js/levels/data/level-collect.js`, `js/levels/objective-tracker.js`

**Why it matters:** Production users download 9 extra shim files that are never requested by the browser. The architecture check's cross-slice import rule has a blind spot for files outside `js/features/`. US-068 AC "dist/ containing only shipped files" is not fully met.

**Fix:** `fix/US-061-remove-legacy-shims`
1. Update the 4 test files to import from slice public APIs (`js/features/robot-simulation/index.js`, `js/features/levels/index.js`, `js/features/program-execution/index.js`) — no behavior change, just path update.
2. Delete `js/simulator/`, `js/levels/`, and `js/i18n/ar.js` (after M2 is fixed; the canonical AR file moves to `js/shared/`).
3. Update `scripts/build.mjs` `validateDistContents` to assert that `dist/js` does not contain `simulator`, `levels`, or `i18n` directories.
4. Extend `scripts/check-architecture.mjs` to report cross-slice internal imports from files anywhere in `js/`, not just from inside `js/features/<slice>/`.

---

### M2 — Major: `js/shared/i18n/ar.js` is a backward shim; canonical AR strings are in the legacy path

**Verdict: Closed.** Fixed in `fix/US-067-fix-canonical-ar-source` (PR #37).

**File/Lines:** `js/shared/i18n/ar.js:1`, `js/i18n/ar.js:1`

**Evidence:**
```js
// js/shared/i18n/ar.js  (1 line)
export { arStrings } from '../../i18n/ar.js';

// js/i18n/ar.js  (90 lines — the real content)
export const arStrings = { pageTitle: 'MiniBot Studio - مختبر الروبوت', … };
```

The architecture guidelines (`ARCHITECTURE_GUIDELINES.md §1`) specify:
> `js/shared/i18n/ar.js` — all child-facing text

`robot-lab.js` imports from `./shared/i18n/ar.js`, which re-exports from `../../i18n/ar.js`. The canonical source is the legacy file; the architecture-mandated path is a pass-through. Both are shipped to `dist/`.

**Why it matters:** Any contributor who follows the guidelines and edits `js/shared/i18n/ar.js` is editing a shim, not the canonical source. The language check's `isArabicAllowedFile` function had to whitelist both paths (`js/shared/i18n/` and `js/i18n/`), which is a symptom of this confusion. The file that should be deleted (`js/i18n/ar.js`) is the one with the real content.

**Fix:** `fix/US-067-fix-canonical-ar-source`
1. Move the content from `js/i18n/ar.js` into `js/shared/i18n/ar.js` (replace the 1-line shim with the 90-line content).
2. Delete `js/i18n/ar.js`.
3. Remove the `js/i18n/` whitelist from `check-language.mjs` `isArabicAllowedFile` — only `js/shared/i18n/` should be allowed.
4. This fix is a dependency of M1 fix step 2 (delete `js/i18n/`).

---

### M3 — Major: `js/runtime-config.js` is at the wrong path

**Verdict: Closed.** Fixed in `fix/US-065-move-runtime-config-to-shared` (PR #38).

**File/Lines:** `js/runtime-config.js:1`, `ARCHITECTURE_GUIDELINES.md §1`

**Evidence:**
Architecture guidelines specify:
> `js/shared/runtime-config.js` — RuntimeConfig type and defaults

The file lives at `js/runtime-config.js` (70 lines, full implementation). It is imported by `js/app.js:2`, `js/robot-lab.js:24`, and `tests/e2e/test-entry.js:2`. The architecture check does not enforce this path because it only validates files inside `js/features/` and `js/shared/`.

**Why it matters:** The architecture check's blind spot for `js/runtime-config.js` means future contributors may place similar "shared kernel" code at `js/` root level, thinking it is the intended pattern.

**Fix:** `fix/US-065-move-runtime-config-to-shared`
1. Move `js/runtime-config.js` to `js/shared/runtime-config.js`.
2. Update import paths in `js/app.js`, `js/robot-lab.js`, and `tests/e2e/test-entry.js`.
3. Extend `check-architecture.mjs` to verify no `.js` files exist directly at `js/` root other than `app.js` and `robot-lab.js` (the two declared composition roots).

---

### M4 — Major: PRs #29–#35 were closed, not merged; formal review was bypassed for 7 of 8 stories

**Verdict: Owner action required.** This is a process finding — the repository owner must enable branch protection as described in `docs/recommended-branch-protection.md`.

**Evidence:**
```
gh pr list --state all --limit 10:
35  [US-068]  CLOSED   2026-10-25
34  [US-067]  CLOSED   2026-10-25
33  [US-066]  CLOSED   2026-10-25
32  [US-065]  CLOSED   2026-10-25
31  [US-062]  CLOSED   2026-10-25
30  [US-063]  CLOSED   2026-10-25
29  [US-064]  CLOSED   2026-10-25
28  [US-061]  MERGED   2026-10-25
```

All eight stories' commits are on `master` (direct push or stacked rebase), but only PR #28 was merged via the GitHub merge workflow. PRs #29–#35 were "CLOSED" (closed without a merge event). The `docs/recommended-branch-protection.md` document (added in US-068) explicitly recommends requiring at least one approving review before merge; this recommendation was not followed for 7 of the 8 Sprint 2.5 PRs.

The implementation status still shows all 8 stories as "In Review" (not "Done"), yet commits are live on master — the status and the repository state are contradictory.

**Why it matters:** The review process exists to catch the issues documented in this review (empty UI stubs, wrong canonical file path, legacy shims). Bypassing it means those issues go undetected. `docs/recommended-branch-protection.md` prescribes PR-only changes; the sprint violated this.

**Fix:**
- This is a process finding, not a code fix. The repository owner should enable branch protection (require PR + 1 approval before merge to master) as described in `docs/recommended-branch-protection.md`.
- `fix/US-068-update-implementation-status`: Update `docs/implementation-status.md` to reflect the real status: US-061 is "Done" (properly merged via #28); US-062–US-068 should be "Done" only after this review's Blockers/Majors are resolved and PRs are properly re-opened if warranted, or the owner explicitly acknowledges the bypass.

---

### m1 — Minor: `js/features/levels/domain/objective-tracker.js` is a conceptually misplaced re-export

**Verdict: Closed.** Fixed in `fix/US-061-remove-legacy-shims` (PR #39).

**File/Lines:** `js/features/levels/domain/objective-tracker.js:1`, `js/features/levels/index.js:1`

**Evidence:**
```js
// js/features/levels/domain/objective-tracker.js
export {
  createObjectiveProgress, getCollectedCollectibleCount,
  isCollectibleCollected, updateObjectiveProgress
} from '../../program-execution/index.js';
```

`js/features/levels/index.js` then re-exports these same functions. Objective progress tracking is a program-execution concern (it tracks what happens during a run), not a levels concern (levels define the static puzzle data). The levels slice ends up with 4 extra exports (`createObjectiveProgress`, etc.) in its public API that conceptually belong to program-execution.

The legacy shim `js/levels/objective-tracker.js` was the reason this re-export was created; once M1 is fixed (legacy shims deleted), the re-export chain disappears naturally.

**Fix:** Part of `fix/US-061-remove-legacy-shims` — delete `js/features/levels/domain/objective-tracker.js` and remove the objective-tracker re-exports from `js/features/levels/index.js`. Any remaining direct use of `createObjectiveProgress` should import from `js/features/program-execution/index.js`.

---

### m2 — Minor: Implementation status is stale; all Sprint 2.5 stories still show "In Review"

**Verdict: Closed.** Fixed in `fix/US-068-update-implementation-status` (PR #41).

**File/Lines:** `docs/implementation-status.md` rows US-061–US-068

**Evidence:** Every Sprint 2.5 story has status "In Review". But the code for all 8 stories is on master (commits `1abc185` through `33d0980`). The status column should reflect merged = "Done" (pending this review's sign-off) or "Done" after blockers/majors close.

**Fix:** `fix/US-068-update-implementation-status` — set status to "Done" for any story whose code is on master and whose Blockers/Majors are closed. Leave stories with open findings at "In Review" until fixes land.

---

### m3 — Minor: `js/features/learning-progress/domain/learning-progress-state.js` is unused

**Verdict: Closed.** Fixed in `fix/US-061-remove-legacy-shims` (PR #39).

**File/Lines:** `js/features/learning-progress/domain/learning-progress-state.js:1`

**Evidence:**
```js
export function createLearningProgressState() {
  return { savedLevelId: null };
}
```

This factory is exported from `js/features/learning-progress/index.js` but is not imported by any other file in the codebase. The localStorage and in-memory repository implementations do not use it. It was likely added to fill the `domain/` slot of the learning-progress slice but serves no function.

**Fix:** Part of `fix/US-061-remove-legacy-shims` — delete `js/features/learning-progress/domain/learning-progress-state.js` and remove its export from `js/features/learning-progress/index.js`. If a `LearningProgressState` domain concept is needed in future, add it with a concrete use case.

---

## What is good and worth keeping

- **Domain and application extraction is thorough.** `program-execution` (pure, fully unit-tested), `program-editing` (`ProgramEditor` model + `programWorkspaceView`), and `learning-progress` (repository ports + both adapters) are clean, well-tested slices. The extraction reduces robot-lab.js from 1,053 to 792 lines; that is real progress.
- **Architecture check has zero allowlist entries.** Every cross-slice violation, effect in domain/application, and module-level mutable state outside composition roots is enforced without exceptions. This is the right baseline to maintain.
- **Repository contracts are exemplary.** `repository-contract.test.js` runs 17 tests against both the in-memory and localStorage adapters using the same suite — correct Liskov-based test design. The corrupt-data, unavailable-storage, and unknown-version cases are all tested.
- **Test fixtures are fully isolated.** `tests/fixtures/` holds only test data; the level registry has only real levels; the build gate confirms fixtures never reach `dist/`.
- **RuntimeConfig injection is clean.** `test-entry.js` reads URL params and builds its own config; `app.js` passes `createDefaultRuntimeConfig()` to the lab. The two-test suite in `runtime-config.test.js` that reads the source files as text is an inexpensive and stable guard.
- **CSP is tight.** Both `index.html` and `test-entry.html` carry the full required CSP. The build script validates 11 directives against `dist/index.html`. The safety check is static; the network-silence browser test is dynamic.
- **No audit vulnerabilities.** `npm audit --omit=dev` → 0. Minimal dependency surface (Playwright only).

---

## Fix tasks for the implementer

| Id | Severity | Story | Branch | Summary |
|----|----------|-------|--------|---------|
| B1 | Blocker | new story (propose US-069a or add to backlog after US-068) | `fix/US-061-extract-remaining-ui-views` | Extract world-grid, block-toolbox, level-meta, execution-status and shell views from robot-lab.js into slice ui/ files; robot-lab.js under 200 lines |
| M1 | Major | US-061 | `fix/US-061-remove-legacy-shims` | Update 4 test files to import from slice public APIs, delete `js/simulator/`, `js/levels/`, `js/i18n/ar.js`, extend build validation and architecture check coverage |
| M2 | Major | US-067 | `fix/US-067-fix-canonical-ar-source` | Move 90-line AR content into `js/shared/i18n/ar.js`, delete `js/i18n/ar.js`, narrow language-check allowlist |
| M3 | Major | US-065 | `fix/US-065-move-runtime-config-to-shared` | Move `js/runtime-config.js` → `js/shared/runtime-config.js`, update 3 import paths, extend architecture check |
| M4 | Major | process | n/a (owner action) | Enable branch protection: require 1 PR review before merge; follow `docs/recommended-branch-protection.md` |
| m1 | Minor | US-061 | `fix/US-061-remove-legacy-shims` (same branch as M1) | Delete `js/features/levels/domain/objective-tracker.js` and its re-exports from levels/index.js |
| m2 | Minor | US-068 | `fix/US-068-update-implementation-status` | Update status column for US-061–US-068 to "Done" once Blockers/Majors land |
| m3 | Minor | US-064 | `fix/US-061-remove-legacy-shims` (same branch as M1) | Delete unused `js/features/learning-progress/domain/learning-progress-state.js` |

### Proposed new story: US-069a (or backlog addition)

**Title:** Extract remaining UI rendering from robot-lab.js into slice UI views

**User story:** As a developer, I want the rendering of the world grid, block toolbox, and level information to live in their respective slice `ui/` directories so that they are independently testable and robot-lab.js is a true composition root.

**Acceptance criteria:**
1. `js/features/robot-simulation/ui/world-grid-view.js` implements `createWorldGridView({ worldGridElement }) → { render(level, robotState, animation) }`. `robot-lab.js` calls it; `renderWorldGrid` is removed from robot-lab.js.
2. `js/features/program-editing/ui/block-toolbox-view.js` (or similar) implements the block button creation and block list rendering. `createBlockButton` and `renderAvailableBlocks` are removed from robot-lab.js.
3. `js/features/levels/ui/level-meta-view.js` implements `createLevelMetaView` replacing `renderLevelMeta`, `updateLevelIndicator`, `updateCollectionSummary`.
4. `js/features/program-execution/ui/execution-status-view.js` implements `createExecutionStatusView` replacing `setStatus` and `setActiveProgramStep`.
5. `js/features/shell/ui/shell-view.js` implements `createShellView` replacing `applyStaticLabels` and `syncPrimaryActions`.
6. `robot-lab.js` is ≤ 200 lines and contains only wiring (adapter creation, view instantiation, event delegation) — no `document.createElement` calls.
7. All 45 unit tests and 33 browser tests still pass.
8. Each new view has at least one unit test (JSDOM or similar) covering its render output for key states.

---

## Blockers and Majors that must close before new feature work

1. **B1** — Extract remaining UI rendering from robot-lab.js (new story required)
2. **M1** — Remove legacy shim folders; update 4 test imports; extend build/arch-check coverage
3. **M2** — Flip canonical AR source to `js/shared/i18n/ar.js`
4. **M3** — Move `runtime-config.js` to `js/shared/`
5. **M4** — Enable branch protection (owner action); re-open and merge any story branches as proper PRs

New feature stories (US-023 levels, US-024 hints, US-018 repeat blocks) should not start until B1 and M1–M3 land, or the world-rendering and toolbox code will grow unchecked inside robot-lab.js.
