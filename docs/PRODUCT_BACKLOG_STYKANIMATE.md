# MiniBot Studio – Product Backlog

> **Status: standalone planning draft.** It was written without access to the MiniBot Studio repository.
> Every story marked "reconcile" must be checked against the real repository before work starts (see MB-SET-001).
> Nothing here has been implemented, tested, committed or pushed.

## 1. Conventions

**Estimates (relative, not time promises):** S = small, one focused PR, mostly known work. M = medium, one PR with real design decisions. L = large, expect to split further during refinement.

**Priorities:** P0 = MVP or critical safety/quality gate. P1 = important for the complete core product. P2 = valuable, deferrable.

**ID prefixes:** `MB-SET` setup and engineering, `MB-UI` interface, `MB-CORE` simulator, interpreter and blocks, `MB-LESSON` curriculum, `MB-SAVE` persistence and offline, `MB-ANIM` Story Studio, `MB-TEST` testing, `MB-SEC` security and privacy, `MB-DOC` documentation and parent guide.

**Language rule:** documentation, code comments, stories and PRs in English. Child-facing UI in Modern Standard Arabic, right-to-left. Code identifiers are never translated.

**Repository reconciliation rule:** for every story, first check whether the feature already exists. If it exists and meets the acceptance criteria, mark it `Done` in `docs/implementation-status.md` with evidence instead of re-implementing it.

## 2. Architecture decisions that shape the backlog

1. **No dynamic code execution.** Programs are validated data (a typed command tree) run by a controlled interpreter. No `eval`, no `new Function`. Blockly's JavaScript generator is not used for execution.
2. **Limits are mandatory.** Maximum loop count, nesting depth, total steps and wall-clock time are enforced by the interpreter.
3. **Local only.** No account, no telemetry, no upload, no external AI service for core features.
4. **StykAnimate (provisional, see ADR-0001):** Option C (original, simple animation workspace) is the planned core. Option B (optional adult-assisted link) is a P2 add-on. Option A (embedding upstream code) is not planned for the MVP. No upstream code or assets may be copied before ADR-0001 is accepted.
5. **TypeScript:** decide in MB-SET-001 after inspecting the repository. Default is plain JavaScript with JSDoc types checked by `tsc --checkJs` only if the repo already has a TypeScript toolchain.

## 3. Epics

1. Foundation and developer experience
2. Arabic-first child interface
3. Robot simulator
4. Visual programming
5. Educational curriculum
6. Local persistence and project portability
7. Offline operation
8. Story Studio and animation
9. Accessibility
10. Testing and quality assurance
11. Security and child privacy
12. Parent and teacher support
13. Documentation and release engineering

## 4. Stories

Format per story: User story, Rationale, Scope, Dependencies, Acceptance criteria (AC). Estimates and priorities are in the heading.

### Epic 1 – Foundation and developer experience

#### MB-SET-001 – Repository assessment and baseline (P0, S)
**As a** maintainer, **I want** a verified inventory of what exists, **so that** no work is duplicated.
- Rationale: this backlog was drafted without repo access.
- Scope: read spec, README, sources, scripts, tests, workflows; run existing install, test and build commands; record results; decide TypeScript yes/no.
- Dependencies: none.
- AC: (1) `docs/repo-assessment.md` lists each backlog story as Existing / Partial / Missing with file paths as evidence. (2) Baseline command output, including pre-existing failures, is recorded verbatim. (3) The TypeScript decision is recorded as an ADR. (4) `docs/implementation-status.md` statuses are updated to match.

#### MB-SET-002 – Continuous integration (P0, S)
**As a** maintainer, **I want** CI that fails when required checks fail, **so that** regressions are caught per PR.
- Scope: extend or add `.github/workflows/ci.yml` using only scripts that exist in `package.json`.
- Dependencies: MB-SET-001.
- AC: (1) CI runs on pull requests and pushes to the default branch. (2) It runs install, lint (if present), unit tests and build. (3) A deliberately failing test makes the job fail (verified once, then reverted). (4) No workflow triggers itself or creates branches or PRs.

#### MB-SET-003 – Contribution conventions and PR template (P0, S)
**As a** contributor, **I want** documented branch, commit and PR rules, **so that** every story is traceable.
- Dependencies: MB-SET-001.
- AC: (1) `CONTRIBUTING.md` documents branch, commit and PR naming from this backlog. (2) `.github/pull_request_template.md` exists and includes story ID, AC checklist, commands run, results, RTL check and risks. (3) `docs/implementation-status.md` exists with every story listed.

#### MB-SET-004 – StykAnimate decision record (P0, M) – licensing gate
**As a** maintainer, **I want** a verified integration decision, **so that** no incompatible code is copied.
- Scope: pin an upstream commit or release; read LICENSE, THIRD_PARTY_NOTICES.md, docs/ARCHITECTURE.md, docs/WEB.md; test the browser build locally; verify Arabic and RTL, WebGPU requirement, Python-backend requirement and embedding options; update ADR-0001.
- Dependencies: none.
- AC: (1) ADR-0001 states the pinned commit SHA or release tag. (2) Each item in the ADR "Unverified" list is resolved with evidence or marked still unknown. (3) The ADR ends with an explicit go or no-go per option. (4) Anything legally ambiguous is flagged for qualified legal review. (5) No upstream code or assets are added to the repo.

#### MB-SET-005 – Copilot agent validation (P1, S)
**As a** maintainer, **I want** the custom agent file checked against current GitHub docs, **so that** it loads correctly.
- Dependencies: MB-SET-003.
- AC: (1) Frontmatter fields match the current GitHub custom agents configuration reference. (2) The agent appears in the repository's agent picker (manual check recorded). (3) Repository agent instructions do not contradict `AGENTS.md` if present.

### Epic 2 – Arabic-first child interface

#### MB-UI-001 – RTL and Arabic typography foundation (P0, M)
**As a** child, **I want** the app to read right to left in Arabic, **so that** it feels natural.
- Scope: `dir="rtl"` and `lang="ar"` on the document, logical CSS properties, bundled Arabic-capable font (license checked, no CDN), mixed Arabic/Latin and number handling, localization string table.
- Dependencies: MB-SET-001.
- AC: (1) No user-facing string is hard-coded outside the string table. (2) Layout uses logical properties; a test asserts no `left`/`right` physical properties in app CSS except documented exceptions. (3) Coordinates and numbers display correctly inside Arabic sentences (visual check recorded with screenshots). (4) Font is bundled and its license is listed in notices.

#### MB-UI-002 – Arabic home screen (P0, S)
- Scope: icon-led screen with large buttons for Robot Lab and Story Studio (Story Studio can be hidden until MB-ANIM-003).
- Dependencies: MB-UI-001.
- AC: (1) Home shows one tappable card per available workspace. (2) Touch targets are at least 64 CSS pixels. (3) Every card has an icon plus an Arabic label. (4) Keyboard focus is visible and ordered right to left.

#### MB-UI-003 – Narration hooks (P2, S)
- Scope: a `narrate(textId)` interface with a no-op default, so Arabic voice can be added later without touching lesson code.
- Dependencies: MB-UI-001.
- AC: (1) Each lesson instruction and feedback message has a stable text ID. (2) A test asserts the interface is called with the expected ID on level start and on success. (3) No network request is made.

#### MB-UI-004 – Accessibility pass (P1, M)
- Dependencies: MB-UI-002, MB-CORE-008.
- AC: (1) Interactive elements have accessible names in Arabic. (2) Animations respect `prefers-reduced-motion`. (3) Color is never the only success/failure signal. (4) Automated accessibility check (axe or equivalent) reports no critical issues on home and a lesson screen.

### Epic 3 – Robot simulator

#### MB-CORE-001 – World model and schema (P0, M)
- Scope: grid size, robot position and heading, walls, goals, collectibles; a versioned JSON schema and validator.
- Dependencies: MB-SET-001.
- AC: (1) A level is plain data validated against a schema. (2) Invalid levels (out-of-bounds robot, unknown cell type) are rejected with specific error codes. (3) Unit tests cover valid and invalid levels. (4) The model has no DOM dependency.

#### MB-CORE-002 – Command types and program validation (P0, M)
- Scope: typed commands (move forward, turn left/right, repeat, if, collect), program tree, validator.
- Dependencies: MB-CORE-001.
- AC: (1) Programs are data only; a validator rejects unknown command types, excessive nesting and oversized programs. (2) A test asserts the interpreter module contains no `eval` or `new Function` (static check in CI). (3) Limits are constants with tests at and above the boundary.

#### MB-CORE-003 – Deterministic command runner (P0, M)
- Dependencies: MB-CORE-001, MB-CORE-002.
- AC: (1) The same level and program always produce the same ordered list of steps. (2) Movement into a wall or the edge leaves the robot in place and emits a `blocked` step. (3) Turning cycles through four headings correctly. (4) Runner output is a pure data trace.

#### MB-CORE-004 – Grid renderer (P0, M)
- Dependencies: MB-CORE-001, MB-UI-001.
- AC: (1) Renderer draws the world from level data only. (2) Robot orientation is visually distinct in all four headings. (3) Rendering never inserts untrusted strings as HTML. (4) Resizes without overlap on a 360 px wide viewport.

#### MB-CORE-005 – Goals, completion and retry (P0, S)
- Dependencies: MB-CORE-003.
- AC: (1) Each level declares explicit completion conditions (reach goal, collect all). (2) Success and failure each produce a distinct Arabic message. (3) Retry resets to the initial state with no leftover state (test compares full state).

#### MB-CORE-006 – Execution limits (P0, S)
- Dependencies: MB-CORE-003.
- AC: (1) Maximum total steps and maximum loop iterations are enforced. (2) A program that would exceed limits stops with a `limit_exceeded` trace and a friendly Arabic message. (3) Wall-clock timeout is enforced for runner-driven playback.

#### MB-CORE-007 – Conditions and sensors (P1, M)
- Dependencies: MB-CORE-006.
- AC: (1) At least "wall ahead" and "on goal" conditions exist. (2) `if` and `if/else` blocks evaluate from world state only. (3) Tests cover true and false branches and nesting depth limit.

#### MB-CORE-008 – Run, pause, step and reset controls (P0, M)
- Dependencies: MB-CORE-003, MB-CORE-004.
- AC: (1) Buttons for run, pause, step and reset with icons and Arabic labels. (2) Step advances exactly one trace entry. (3) Reset works in every state including mid-run. (4) The currently executing block is highlighted (after MB-CORE-009).

#### MB-CORE-009 – Blockly integration with Arabic toolbox (P0, L – split in refinement)
- Dependencies: MB-CORE-002, MB-UI-001.
- AC: (1) Blockly is bundled locally (no CDN). (2) Toolbox labels and block text are Arabic with RTL workspace enabled. (3) Only blocks allowed by the current level appear. (4) Workspace loads and saves without error in offline mode. (5) Blockly's license is listed in notices.

#### MB-CORE-010 – Block-to-command compiler (P0, M)
- Dependencies: MB-CORE-009.
- AC: (1) Compiler output is the validated program tree, not JavaScript source. (2) Unknown or disconnected blocks produce specific, child-friendly errors. (3) Round-trip tests: workspace to program to trace for every block type.

### Epic 5 – Curriculum

#### MB-LESSON-001 – First guided lesson (P0, M)
- Dependencies: MB-CORE-005, MB-CORE-010.
- AC: (1) A level teaches sequencing with at most two block types. (2) Instructions are an icon plus short Arabic text with narration IDs. (3) A browser test completes the lesson end to end.

#### MB-LESSON-002 – Sequence levels (P0, M)
- Dependencies: MB-LESSON-001.
- AC: (1) At least five sequence levels with increasing length. (2) Each level is validated by the schema test. (3) Each is solvable (a reference solution passes in a test).

#### MB-LESSON-003 – Repetition levels (P1, M)
- Dependencies: MB-CORE-006, MB-LESSON-002.
- AC: (1) A repeat block with a bounded count. (2) At least four levels where repeat is the intended solution. (3) Reference solutions pass.

#### MB-LESSON-004 – Condition levels (P1, M)
- Dependencies: MB-CORE-007, MB-LESSON-003.
- AC: as MB-LESSON-003 for conditions.

#### MB-LESSON-005 – Hints (P1, S)
- Dependencies: MB-LESSON-002.
- AC: (1) Each level has an ordered list of Arabic hints. (2) Hints appear progressively after failed attempts. (3) A hint never reveals the full solution before the last tier.

### Epic 6 and 7 – Persistence and offline

#### MB-SAVE-001 – Local progress (P0, S)
- Dependencies: MB-LESSON-001.
- AC: (1) Completed levels and stars are stored locally, versioned. (2) Corrupted storage falls back to a clean state without crashing. (3) Data never leaves the device (test asserts no network calls).

#### MB-SAVE-002 – Workspace persistence (P1, S)
- Dependencies: MB-CORE-010.
- AC: (1) Each level's workspace is restored on reopening. (2) Switching to Story Studio and back preserves it.

#### MB-SAVE-003 – Export and import with validation (P1, M)
- Dependencies: MB-SAVE-001.
- AC: (1) Export creates a versioned JSON file. (2) Import enforces a maximum file size and nesting depth, validates against the schema, and rejects anything else with a clear message. (3) Fuzz-style tests with malformed files never throw uncaught errors or execute content.

#### MB-SAVE-004 – Offline operation (P1, M)
- Dependencies: MB-LESSON-001.
- AC: (1) After first load, the app reopens with the network disabled (browser test). (2) Cache versioning updates cleanly. (3) The app tells an adult, in Arabic, if a feature needs the network.

#### MB-SAVE-005 – Local reset and data controls (P1, S)
- Dependencies: MB-SAVE-001.
- AC: (1) An adult-gated control deletes all local data. (2) Export is available from the same place. (3) The gate is not solvable by pure tapping (for example a simple arithmetic or hold-to-confirm gesture).

### Epic 8 – Story Studio

All ANIM stories other than MB-ANIM-001 require MB-SET-004 to be accepted first.

#### MB-ANIM-001 – Story brief contract (P1, S)
- Dependencies: MB-CORE-005.
- AC: (1) A versioned schema defines title, scene description, goal, action list and optional non-identifying metadata. (2) A completed level can produce a brief. (3) Briefs contain no personal data fields. (4) Robot Lab progress is unchanged by producing a brief.

#### MB-ANIM-002 – Story Studio entry point (P1, S)
- Dependencies: MB-UI-002, MB-ANIM-001, MB-SET-004.
- AC: (1) Entry point opens the chosen workspace and returns to Robot Lab. (2) Returning preserves Robot Lab state. (3) The UI states, for adults, whether the workspace is local or external.

#### MB-ANIM-003 – Frame editor, simple (P1, L – split in refinement)
- Dependencies: MB-ANIM-002 (Option C path).
- AC: (1) A child can place and move one character and add frames. (2) At most a small, fixed tool set is visible. (3) Works with touch and mouse. (4) No upstream code is used unless ADR-0001 permits it.

#### MB-ANIM-004 – Playback (P1, M)
- Dependencies: MB-ANIM-003.
- AC: (1) Play, pause and restart. (2) Frame timing is deterministic. (3) Respects reduced-motion preference where applicable.

#### MB-ANIM-005 – Save and export animation (P1, M)
- Dependencies: MB-ANIM-004, MB-SAVE-003.
- AC: (1) Projects save locally and import with the same validation rules as Robot Lab. (2) Export formats limited to those verified working (for example project JSON, then GIF or frames if implemented).

#### MB-ANIM-006 – Activity cards (P2, S)
- Dependencies: MB-ANIM-004.
- AC: (1) At least five Arabic activity cards with illustrated steps. (2) Each card has an adult-assist note.

#### MB-ANIM-007 – Optional external StykAnimate link (P2, S) – only if ADR-0001 approves Option B
- AC: (1) The link is behind the adult gate. (2) A clear Arabic warning states that it opens an external site. (3) No MiniBot data is transmitted.

### Epic 10 and 11 – Testing and security

#### MB-TEST-001 – Unit test harness (P0, S)
- Dependencies: MB-SET-001.
- AC: (1) A test runner is configured (use the existing one if suitable). (2) `npm test` (or the real script) runs in CI. (3) Core modules have a coverage report (informational, no arbitrary threshold).

#### MB-TEST-002 – Browser smoke tests (P1, M)
- Dependencies: MB-LESSON-001.
- AC: (1) A Playwright test completes the first lesson in Chromium. (2) It runs in CI. (3) It checks `dir="rtl"` on the document.

#### MB-TEST-003 – RTL and Arabic regression checks (P1, S)
- Dependencies: MB-UI-001.
- AC: (1) Screenshot or DOM checks cover home, lesson and a mixed Arabic/Latin string. (2) Changing a string to a longer Arabic text does not overflow its container in the checks.

#### MB-SEC-001 – Privacy and security tests (P0, S)
- Dependencies: MB-SAVE-001.
- AC: (1) A browser test fails on any request to a non-local origin during normal use. (2) A static check forbids `innerHTML` with untrusted data, `eval` and `new Function` outside documented exceptions. (3) A Content-Security-Policy is defined and tested.

### Epic 12 and 13 – Parent guide and docs

#### MB-DOC-001 – Parent and teacher guide (P1, S)
- AC: (1) Arabic and English guide explains levels, goals and how to export or reset data. (2) States clearly that no data leaves the device.

#### MB-DOC-002 – README and developer docs (P1, S)
- Dependencies: MB-SET-003.
- AC: (1) README covers setup, commands, tests, architecture, story conventions, agent usage, StykAnimate status, offline behavior and limitations. (2) Every command in the README exists in `package.json`.

#### MB-DOC-003 – Release checklist and verification (P1, S)
- AC: the release checklist below is executed and recorded.

## 5. Dependency map

```
MB-SET-001 ──► MB-SET-002, MB-SET-003, MB-TEST-001, MB-UI-001, MB-CORE-001
MB-CORE-001 ─► MB-CORE-002 ─► MB-CORE-003 ─► MB-CORE-005, MB-CORE-006 ─► MB-CORE-007
MB-CORE-003 + MB-UI-001 ─► MB-CORE-004 ─► MB-CORE-008
MB-CORE-002 + MB-UI-001 ─► MB-CORE-009 ─► MB-CORE-010 ─► MB-LESSON-001 ─► MB-LESSON-002 ─► 003 ─► 004
MB-LESSON-001 ─► MB-SAVE-001, MB-SAVE-004, MB-TEST-002
MB-SET-004 (gate) ─► MB-ANIM-002..007
MB-CORE-005 ─► MB-ANIM-001 ─► MB-ANIM-002 ─► 003 ─► 004 ─► 005
```

## 6. Suggested sprints

| Sprint | Goal | Stories | Exit criteria |
|---|---|---|---|
| 0 | Guardrails and decisions | SET-001..005, TEST-001 | Baseline recorded, CI green, ADR-0001 accepted or explicitly deferred |
| 1 | First playable robot | UI-001, UI-002, CORE-001..006, CORE-008 (partial) | Robot moves on a grid from a hard-coded program; core tests pass |
| 2 | Visual programming MVP | CORE-009, CORE-010, LESSON-001, TEST-002 | Child completes lesson 1 with blocks; browser smoke test green |
| 3 | Curriculum and persistence | LESSON-002, 003, 005, SAVE-001, 002, SEC-001 | Progress persists; limits enforced; no outbound requests |
| 4 | Conditions and offline | CORE-007, LESSON-004, SAVE-003, 004, 005, UI-003, DOC-001 | App reopens offline; import fuzz tests pass |
| 5 | Story Studio (gated by ADR-0001) | ANIM-001..005 | Brief hand-off works; Robot Lab progress preserved |
| 6 | Polish and release | ANIM-006, 007, UI-004, TEST-003, DOC-002, 003 | Accessibility check clean; release checklist signed off |

A sprint is a planning grouping. Every story still has its own branch, commit and PR.

## 7. Risks and gates

- **Licensing gate:** no upstream StykAnimate code or assets before ADR-0001 is accepted. GPL-3.0-or-later obligations apply to any distributed combined work; legal review required where interpretation is unclear.
- **WebGPU and Python dependencies** of StykAnimate may make embedding impractical for a young child's device.
- **Blockly RTL quality** must be verified early (MB-CORE-009).
- **Scope creep in Story Studio:** keep the tool set tiny; adult-assisted onboarding.
- **Child safety:** adult-gated controls must not be bypassable by a child tapping randomly.

## 8. Definition of ready

A story is ready when: acceptance criteria are testable; dependencies are `Done`; repository reconciliation is recorded; licensing and privacy implications are noted; it fits in one PR.

## 9. Definition of done

1. Every AC is met and checked off in the PR.
2. Automated tests exist and actually passed (commands and output recorded).
3. Build and lint pass.
4. Docs updated; RTL and Arabic verified for UI changes.
5. Security and privacy constraints still hold.
6. Changes limited to the story; one dedicated commit with the story ID; one PR.
7. `docs/implementation-status.md` updated accurately (a story with an open PR is `In Review`, not `Done`).

## 10. Release checklist

- [ ] All P0 stories `Done`; remaining P1/P2 documented as `Deferred`.
- [ ] CI green on the release commit.
- [ ] Offline reopen verified manually on the target device.
- [ ] Network-silence test passes.
- [ ] Notices file lists Blockly, fonts and any other dependency licenses.
- [ ] ADR-0001 status matches what is shipped.
- [ ] Parent guide reviewed by a native Arabic reader.
- [ ] A real child session with an adult observer recorded (what confused them, what to fix).
