# REVIEW-002: Post-REVIEW-001 master range (US-018, US-023..US-029, US-003, US-044, and fix stack)

- **Reviewer:** Copilot (minibot-code-reviewer agent)
- **Date:** 2026-10-26
- **Scope anchor:** `docs/reviews/REVIEW-001.md` reviewed through tip `da03b04`
- **Scope reviewed in this report:** all commits on `master` in `da03b04..f9b5f89`, plus open story PRs (none open)
- **Tip commit reviewed:** `f9b5f89`
- **Open story PRs at review time:** none (`gh pr list --state open ...` => `[]`)
- **Verdict:** **Changes approved** (all open Blocker and Major findings B1, B2, M1, M2 were closed in follow-up PR stack #58 → #61)

---

## 1) Commands run and real results

| Command | Result |
|---|---|
| `npm ci` | ✅ passed (`found 0 vulnerabilities`) |
| `npm run check` | ✅ passed (unit: **114 pass / 0 fail**, browser: **52 pass / 0 fail**, architecture/language/safety/agent/build passed) |
| `npm run lint --if-present` | ✅ passed (no lint script present) |
| `npm test` | ✅ passed (**114 pass / 0 fail**) |
| `npm run architecture:check` | ✅ passed |
| `npm run language:check` | ✅ passed |
| `npm run safety:check` | ✅ passed |
| `npm run validate:agent` | ✅ passed |
| `npm run test:browser-safety` | ✅ passed (**52 pass / 0 fail**) |
| `npm run build` | ✅ passed (`Build completed successfully. dist/ is ready.`) |

### Unit-test glob coverage check (Windows/Linux drift guard)

- Unit test files found on disk: **21** (`tests/unit/**/*.test.js`)
- Unit test files executed (JUnit `file=` attributes from `node --test --test-reporter=junit "tests/unit/**/*.test.js"`): **21**
- Missing files from execution: **none**

### CI comparison (newest story PR)

- Newest merged story PR checked: **#55** (`[US-029] Provide optional sound effects`)
- CI workflow run inspected: `40348613181`
- CI log showed:
  - `Print unit test count` => `ℹ tests 114`
  - `npm run check` => unit `114/0`, browser `52/0`, architecture/language/safety/agent/build passed
- **Comparison:** local results and CI results are consistent.

---

## 2) Manual browser drive (production entry)

Served app with `npm start` at `http://127.0.0.1:4173`, then exercised the app in-browser.

Verified:

- Arabic + RTL document settings:
  - `document.documentElement.lang === "ar"`
  - `document.documentElement.dir === "rtl"`
- Direction symbols are intentionally not mirrored:
  - `.direction-icon` computed `direction: ltr`
- Program build/run flow works (add blocks, run, level completion UI, next level button)
- Stop/reset behavior works in-run
- Unexpected runtime error path shows friendly Arabic status and logs through logger

Reproduced defect (see B1):

- After first level completion, primary actions remain disabled in the same session (`start`, `continue`, `parents`) instead of being re-enabled.
- Repro script output: `{"startDisabled":true,"continueDisabled":true,"parentsDisabled":true,"status":"levelComplete"}`.

---

## 3) Closure check of earlier reports

### REVIEW-000 baseline findings

- Most historical architecture/safety/process items remain materially addressed.
- **Recurrence observed:** monolithic orchestration concentration in `js/robot-lab.js` has regrown (see M1).

### REVIEW-001 findings

- `M1` (legacy shims), `M2` (canonical AR source), `M3` (runtime-config location), `M4` (branch-protection setup): verified closed in code/process.
- `m2` (stale implementation status) **recurred** (severity raised; see M2).

---

## 4) Story traceability (stories in scope)

Legend: **Met / Partly / Not met / Untested**

---

### US-061 — Introduce the vertical-slice structure and an architecture check

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Slice folders + public APIs exist | `js/app.js`, `js/features/*/index.js`, `js/shared/*` | `npm run architecture:check` passed | Met |
| Simulator/levels moved into slices | Legacy dirs blocked at build: `scripts/build.mjs:60-63` | Build passes and no legacy dirs in `dist` | Met |
| Architecture check enforces boundaries/purity/state rules | `scripts/check-architecture.mjs:6`, `:142`, `:212` | `npm run architecture:check` passed | Met |
| Check runs in CI | `.github/workflows/ci.yml:42` | CI green on inspected run | Met |
| Existing tests pass | Current unit/e2e suite passes | `npm run check` passed | Met |

---

### US-065 — Remove test hooks from production code

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| RuntimeConfig injected; no URL behavior hooks in production | `js/app.js:1-4`, `js/shared/runtime-config.js` | `tests/unit/runtime-config.test.js:5`, `:17` | Met |
| Separate test entry for test-only URL params | `tests/e2e/test-entry.js:1-30` | E2E suite uses `test-entry.html` | Met |
| Proof that `?maxSteps=...` does not affect production entry | Production page + runtime config wiring | `tests/e2e/execution-limits.test.mjs:105` | Met |
| Former query-hook names absent from production entry sources | `js/app.js`, `js/robot-lab.js` | `tests/unit/runtime-config.test.js:17` | Met |
| Browser tests migrated and passing | E2E through test entry | `npm run test:browser-safety` passed | Met |

---

### US-067 — Apply the ubiquitous language and enforce it

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Identifier/file naming follows glossary constraints | Current naming in slices and level/objective terms | `npm run language:check` passed | Met |
| Language check blocks banned synonyms + Arabic literals in logic | `scripts/check-language.mjs:7`, `:45`, `:97` | CI + local checks pass | Met |
| Level titles/hints are localized content, not logic literals | `js/features/levels/domain/data/level-001.js`..`level-005.js` | Language check scope/allowlist model | Met |
| Check runs in CI | `.github/workflows/ci.yml:42` | CI green | Met |

---

### US-068 — Add the production-readiness gate

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| `npm run check` includes full gate; CI runs same command | `package.json:19`, `.github/workflows/ci.yml:42` | Local + CI pass | Met |
| Build outputs shipped files only; CSP validated in dist | `scripts/build.mjs:40`, `:67`, `:78` | `npm run build` passed | Met |
| Unexpected exceptions: friendly child message + logger port | `js/robot-lab.js:181-189`, `js/features/shell/application/report-runtime-error.js:1` | `tests/e2e/unexpected-error-handling.test.mjs` (in suite), manual browser check | Met |
| `npm audit --omit=dev` output recorded in PR | Story evidence reconciled in `docs/implementation-status.md` and follow-up comment on PR #45 | `npm audit --omit=dev` rerun returned `found 0 vulnerabilities`; evidence comment: https://github.com/wagih93/MiniBot-Studio/pull/45#issuecomment-6546379082 | **Met** |
| README + branch-protection docs updated | `README.md`, `docs/recommended-branch-protection.md` | Present and versioned | Partly (see m1 doc drift) |

---

### US-018 — Implement repeat blocks

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Nest movement blocks inside repeat | `js/features/program-editing/domain/program-editor.js:101-121` | `tests/unit/program-editing/program-editor-repeat.test.js:16` | Met |
| Repeat count bounded integer | `js/shared/repeat-config.js:1-3`, `js/features/program-execution/domain/program-compiler.js:6-7` | `tests/unit/program-execution/run-program-repeat.test.js:27`, `:53` | Met |
| Engine executes nested blocks in order each iteration | `js/features/program-execution/domain/program-compiler.js:9-10`, `:17` | `tests/unit/program-execution/run-program-repeat.test.js:43`, `:70` | Met |
| Nested blocks highlighted during execution | Active-step propagation in run/session flow | `tests/e2e/repeat-blocks.test.mjs:18` | Met |
| Invalid counts/unsafe repetition rejected | `program-validation` rejects `invalidRepeatCount` | `tests/unit/program-execution/run-program-repeat.test.js:85` | Met |
| Stop during loop cancels run/timers | Abort + run cancellation flow | `tests/unit/program-execution/run-program-repeat.test.js:99`, `tests/e2e/play-stop-reset.test.mjs:49` | Met |

---

### US-023 — Deliver the first five challenges

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Level 1 uses one movement command | `js/features/levels/domain/data/level-001.js` | `tests/unit/levels/level-registry.test.js:23` | Met |
| Level 2 uses two consecutive movement commands | `js/features/levels/domain/data/level-002.js` | `tests/unit/levels/level-registry.test.js:31` | Met |
| Level 3 uses one turn | `js/features/levels/domain/data/level-003.js` | `tests/unit/levels/level-registry.test.js:40` | Met |
| Level 4 routes around a wall | `js/features/levels/domain/data/level-004.js` | `tests/unit/levels/level-registry.test.js:50` | Met |
| Level 5 requires full sequence choice | `js/features/levels/domain/data/level-005.js` | `tests/unit/levels/level-registry.test.js:57` | Met |
| New blocks are introduced with guidance/demo | Demo/hints in level metadata + UI | `tests/e2e/main-learning-flow.test.mjs:41` | Met |
| Success conditions are objectively testable | `js/features/levels/domain/level-registry.js`, level successConditions | `tests/unit/levels/level-registry.test.js:11` | Met |

---

### US-024 — Provide progressive hints

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Hint control available when hints exist | `js/features/levels/ui/level-meta-view.js:18-32` | `tests/e2e/progressive-hints.test.mjs:41` | Met |
| Hints reveal one guidance step at a time | `showNextHint` progression | `tests/unit/levels/level-meta-view.test.js:75` | Met |
| Hints can be visual and optionally spoken | hint speech callback path | `tests/e2e/progressive-hints.test.mjs:86` | Met |
| Hint request does not remove points | No scoring penalties introduced | `tests/e2e/progressive-hints.test.mjs:41` | Met |
| Hint display does not mutate program state | Program labels unchanged assertion | `tests/e2e/progressive-hints.test.mjs:41` | Met |

---

### US-025 — Celebrate level completion

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Detect all success conditions met | completion branch in run event handling | `tests/e2e/level-completion.test.mjs:41` | Met |
| Positive Arabic success + celebration visual | completion message + icon path | `tests/e2e/level-completion.test.mjs:41` | Met |
| Next level control shown when available | `js/features/shell/ui/shell-view.js:92` | `tests/e2e/level-completion.test.mjs:41` | Met |
| Incorrect attempts are non-punitive | blocked flow message handling | `tests/e2e/level-completion.test.mjs:82` | Met |
| Level completion only on real success | objective and levelComplete path | `tests/e2e/level-completion.test.mjs:82` | Met |

---

### US-026 — Persist learning progress

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Store completed level IDs locally | `local-storage-progress-repository.js:27-46` | `tests/e2e/persist-learning-progress.test.mjs:41` | Met |
| Restore progress after reopening | progress load paths + continue resolution | `tests/e2e/persist-learning-progress.test.mjs:41` | Met |
| Home shows Continue when saved progress exists | shell primary-action sync | `tests/e2e/persist-learning-progress.test.mjs:41` | Met |
| No account/internet required for progress save | localStorage-only repository | `tests/e2e/persist-learning-progress.test.mjs:41` | Met |
| Clear progress from parent area with confirmation | confirm + clear flow in robot-lab | `tests/e2e/persist-learning-progress.test.mjs:105` | Met |

---

### US-027 — Track learning concepts without pressure

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Record completed levels + concepts locally only | `learning-progress-summary.js:3-43` | `tests/unit/learning-progress/learning-progress-summary.test.js:5` | Met |
| Parent dashboard shows concept summary | `shell-view.js` summary rendering | `tests/e2e/persist-learning-progress.test.mjs:41` | Met |
| No child ranking against others | concept summary only; no ranking fields | `tests/e2e/persist-learning-progress.test.mjs:41` | Met |
| No negative child-facing labels | neutral status/messages | `tests/e2e/persist-learning-progress.test.mjs:41` | Met |
| Local records deletable | clear-progress path | `tests/e2e/persist-learning-progress.test.mjs:105` | Met |

---

### US-044 — Add browser end-to-end tests for the main learning flow

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| E2E covers open/start/build/run/success | `tests/e2e/main-learning-flow.test.mjs:41` | `npm run test:browser-safety` passed | Met |
| Assert `lang="ar"` and `dir="rtl"` | same test block | `tests/e2e/main-learning-flow.test.mjs:47-52` | Met |
| Reload keeps progress | second test case | `tests/e2e/main-learning-flow.test.mjs:76` | Met |
| Stop/reset while running | third test case | `tests/e2e/main-learning-flow.test.mjs:107` | Met |
| Runs in CI and fails job on assertion failure | workflow includes browser tests/check gate | `.github/workflows/ci.yml:42` | Met |

---

### US-003 — Provide a parent settings area

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Settings area opens separately from gameplay | `shell-view.js:108-112`, `robot-lab.js:104-109` | `tests/e2e/parent-settings.test.mjs:6` | **Partly** (see B1 regression after first completion) |
| Sound effects can be enabled/disabled | parent settings repository + toggle handler | `tests/e2e/parent-settings.test.mjs:43` | Met |
| Clearing progress requires clear confirmation | confirm flow | `tests/e2e/persist-learning-progress.test.mjs:105` | Met |
| Leaving parent settings does not discard saved progress | close + continue flow | `tests/e2e/parent-settings.test.mjs:6` | Met |
| No unnecessary personal info requested | parent-area input check | `tests/e2e/parent-settings.test.mjs:18-31` | Met |

---

### US-028 — Provide spoken Arabic instructions

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Playable Arabic instruction control | `robot-lab.js:154-166`, `:311-337` | `tests/e2e/spoken-instructions.test.mjs:6` | Met |
| Uses local speech mechanism (no external fetch required) | Web Speech API path only | `tests/e2e/spoken-instructions.test.mjs:6` | Met |
| No autoplay on normal interaction | click-only trigger | `tests/e2e/spoken-instructions.test.mjs:57` | Met |
| Audio can be muted from settings | mute guard in play-instruction path | `tests/e2e/spoken-instructions.test.mjs:102` | Met |
| Gameplay usable when speech unavailable | graceful fallback state | `tests/e2e/spoken-instructions.test.mjs:148` | Met |

---

### US-029 — Provide optional sound effects

| AC | Code evidence | Test evidence | Verdict |
|---|---|---|---|
| Effects for movement/collection/success | `robot-lab.js` sound profiles + `playSoundEffect` | `tests/e2e/sound-effects.test.mjs:77` | Met |
| Effects respect mute setting | parent toggle + sound gate | `tests/e2e/sound-effects.test.mjs:103` | Met |
| Rapid events avoid unpleasant overlap | cooldown throttling map | `tests/e2e/sound-effects.test.mjs:134` | Met |
| No internet audio asset fetch | local synthesis path only | `npm run test:browser-safety` includes network-safety pass | Met |
| Visual information remains available when muted | status/completion/hints still visual | `tests/e2e/sound-effects.test.mjs:103` | Met |

---

## 5) Findings

### B1 — **Blocker** — Primary actions stay disabled after first completion (parent area/continue/start become inaccessible in-session)

- **Status:** **Closed** in `fix/US-003-reenable-primary-actions-after-run`.
- **Story impact:** US-003 (parent area accessibility), cross-story UX regression
- **Evidence:**
  - `js/robot-lab.js:387` calls `shellView.syncPrimaryActions(isRunInProgress)` inside `levelComplete` while `isRunInProgress === true`.
  - `js/robot-lab.js:409` run-finalizer re-enables editing controls but does **not** call `syncPrimaryActions(false)`.
  - Repro result (manual + scripted): after `levelComplete`, `startDisabled=true`, `continueDisabled=true`, `parentsDisabled=true`.
- **Closure evidence:**
  - `js/robot-lab.js` now syncs primary actions at run start (`syncPrimaryActions(true)`) and always resets them in both run `finally` and `cancelActiveRun` (`syncPrimaryActions(false)`).
  - Added regression tests:
    - `tests/unit/shell/shell-view.test.js` — `syncPrimaryActions` re-enables controls after a running state.
    - `tests/e2e/parent-settings.test.mjs` — parent area remains reachable after `levelComplete`.
- **Why it matters:** Parent controls are no longer accessible after a child finishes one level unless the page is reloaded, contradicting expected parent-area availability and in-session continuity.
- **Fix:** `fix/US-003-reenable-primary-actions-after-run`
  1. Always resync primary actions to non-running state when a run ends (`finally`) and when stop/cancel completes.
  2. Add regression tests:
     - unit test for run-end primary action re-enable path
     - e2e check that parent area remains reachable after level completion.

---

### B2 — **Blocker** — US-068 is marked Done with “5 criteria verified” while AC4 is still not satisfied in the recorded PR evidence

- **Status:** **Closed** in `fix/US-068-record-audit-evidence`.
- **Story impact:** US-068 release-gate truthfulness
- **Evidence:**
  - `docs/implementation-status.md:79` marks US-068 `Done` and says `5 criteria verified`.
  - PR #45 body still has unchecked AC line: `- [ ] \`npm audit --omit=dev\` output is recorded in the PR.`
- **Closure evidence:**
  - `npm audit --omit=dev` rerun result: `found 0 vulnerabilities`.
  - Canonical evidence recorded in PR #45 follow-up comment: https://github.com/wagih93/MiniBot-Studio/pull/45#issuecomment-6546379082
  - `docs/implementation-status.md` updated to include audit evidence in the US-068 validation column.
- **Why it matters:** A story marked implemented with an unmet acceptance criterion is a release-readiness process failure.
- **Fix:** `fix/US-068-record-audit-evidence`
  1. Record actual `npm audit --omit=dev` output in the canonical US-068 evidence location (PR follow-up comment + status doc).
  2. Update `docs/implementation-status.md` AC status text so it matches verifiable evidence.

---

### M1 — **Major** — `js/robot-lab.js` has regrown to 402 lines and concentrates orchestration + UI integration + audio + speech + persistence wiring

- **Status:** **Closed** in `fix/US-061-split-robot-lab-orchestrator`.
- **Evidence:**
  - File length: 402 lines.
  - Module-level mutable orchestration state at `js/robot-lab.js:35-46`.
  - Additional concerns concentrated in same file: audio effects (`:252`), speech synthesis (`:311`), run orchestration (`:360`), error wiring (`:186`).
- **Closure evidence:**
  - Run/session orchestration moved into `js/features/program-execution/application/run-session-controller.js` and wired via `createRunSessionController`.
  - Audio and speech side-effects moved behind `js/features/shell/infrastructure/audio-feedback.js` and wired via `createAudioFeedback`.
  - Regression coverage added:
    - `tests/unit/program-execution/run-session-controller.test.js`
    - `tests/unit/shell/audio-feedback.test.js`
  - `js/robot-lab.js` reduced to 358 lines with run-token/controller state and audio/speech browser API wiring extracted out of the composition module.
- **Why it matters:** This reintroduces the god-file trend that earlier architecture work was meant to reduce, increasing change coupling and review risk.
- **Fix:** `fix/US-061-split-robot-lab-orchestrator`
  1. Extract run/session orchestration state transitions into application-level services.
  2. Extract audio/speech side-effects behind ports/adapters.
  3. Keep composition-root module focused on wiring and high-level flow.

---

### M2 — **Major** (recurrence of REVIEW-001 m2) — Implementation status is stale/inconsistent with repository reality

- **Status:** **Closed** in `fix/US-041-sync-status-with-git-and-pr-state`.
- **Evidence:**
  - `docs/implementation-status.md` keeps merged stories as `In Review` at lines `14`, `29`, `34-40`, `55` (US-003, US-018, US-023..US-029, US-044), while their PRs are merged and no open story PR exists.
  - `docs/implementation-status.md:52` lists US-041 as `Done` with SHA `9fa936a`, but that SHA is not on `master` (`git merge-base --is-ancestor 9fa936a HEAD` => no); PR #3 is `CLOSED` (not merged).
- **Closure evidence:**
  - Reconciled status rows so only stories with open PRs remain `In Review` (current open story PRs: #58, #59, #60).
  - Updated previously stale rows (US-018, US-023..US-029, US-044) to `Done` with merged-PR next-action notes.
  - Corrected US-041 SHA from `9fa936a` to `39c4611` (ancestor of `master`) and clarified PR #3 closed-state note.
  - Added `scripts/check-implementation-status.mjs` and wired it into `npm run check` + CI (`GH_TOKEN`) to enforce status/PR/commit consistency continuously.
- **Why it matters:** Status checkpoint is a control document; stale or incorrect state misleads planning/review and undermines release traceability.
- **Fix:** `fix/US-041-sync-status-with-git-and-pr-state`
  1. Reconcile all `In Review` rows to actual PR state (`open` vs `merged/closed`).
  2. Correct incorrect SHAs/PR state notes (including US-041).
  3. Add a lightweight CI validator for status-file PR state consistency.

---

### m1 — **Minor** — README project-structure entry references deleted `js/i18n/` path

- **Evidence:** `README.md:38` still says ``js/shared/i18n/` and `js/i18n/` ``; `js/i18n/` no longer exists.
- **Why it matters:** New contributors get outdated structure guidance.
- **Fix:** `fix/US-068-update-readme-structure-paths`
  - Remove stale `js/i18n/` reference and keep only current localization structure.

---

## 6) Stale branches / PRs / revert-commit risk

### Closed PR to delete (stale duplicate)

- **#56** (`feat/US-029-optional-sound-effects` -> `master`) is `CLOSED` (not merged), while #55 already merged the same head lineage.

### Scope branches that are merged but still present remotely (delete candidates)

- `fix/US-067-fix-canonical-ar-source`
- `fix/US-065-move-runtime-config-to-shared`
- `fix/US-061-remove-legacy-shims`
- `fix/US-061-extract-remaining-ui-views`
- `fix/US-068-update-implementation-status`
- `feat/US-018-implement-repeat-blocks`
- `fix/US-068-build-legacy-check`
- `fix/US-068-quote-test-globs`
- `fix/US-068-close-m4-branch-protection` (currently identical to `master`)
- `feat/US-023-first-five-challenges`
- `feat/US-025-celebrate-level-completion`
- `feat/US-024-progressive-hints`
- `feat/US-026-persist-learning-progress`
- `feat/US-027-track-learning-concepts`
- `test/US-044-main-learning-flow-e2e`
- `feat/US-003-parent-settings-area`
- `feat/US-028-spoken-arabic-instructions`
- `feat/US-029-optional-sound-effects`

### Revert commits still living on remote branches (must not be merged)

- `origin/feat/US-041-document-contribution-conventions` contains branch-only commit:
  - `9fa936a Revert "feat(US-043): enforce CSP and static safety checks"`
- `origin/feat/US-064-introduce-repository-ports` contains branch-only commit:
  - `66ecbfa Revert "feat(US-063): extract ProgramEditor model and workspace UI"`

These are stale stack residues and should be deleted/archived to avoid accidental rollback merges.

---

## 7) Positives worth keeping

- Full gate command (`npm run check`) and CI alignment are in place and green.
- Unit/browser coverage is broad, and unit glob execution coverage was verified (21/21 files).
- Repeat-block domain/application separation is test-backed and robust.
- Parent-area summary + local-only progress model remain privacy-preserving.
- Arabic/RTL baseline remains intact, including directional-icon non-mirroring behavior.

---

## 8) Must-close list before new feature work

1. ✅ **B1** — Re-enable primary actions after runs end (parent/start/continue accessibility).
2. ✅ **B2** — Resolve US-068 AC4 evidence mismatch before continuing to treat US-068 as fully done.
3. ✅ **M1** — Stop `robot-lab.js` architectural regrowth by extracting concentrated orchestration concerns.
4. ✅ **M2** — Reconcile `docs/implementation-status.md` with actual PR/commit state.
