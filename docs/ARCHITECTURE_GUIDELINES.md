# MiniBot Studio architecture guidelines

These rules apply to every story. The implementer agent follows them while coding, and the reviewer agent checks them in every review. If a rule is wrong for a story, write an ADR in the same PR instead of silently breaking it.

## 1. Style: vertical slices in plain JavaScript

Group code by **feature (slice)**, not by technical layer. One slice contains everything one capability needs, so a change to a feature touches one folder.

```
js/
  app.js                         composition root: creates adapters and slices, wires them, nothing else
  shared/                        shared kernel, kept tiny and generic
    i18n/ar.js                   all child-facing text
    result.js                    Result helpers (ok / err)
    runtime-config.js            RuntimeConfig type and defaults
  features/
    robot-simulation/            World, Cell, Robot, movement and turning rules
      domain/                    pure rules, no DOM, no storage, no timers
      application/               use cases (moveRobot, turnRobot, resetWorld)
      ui/                        world-grid-view.js (DOM rendering only)
      index.js                   the slice's public API
    program-editing/             Program, ProgramStep, toolbox, drag and drop, edit rules
    program-execution/           Run, ExecutionLimits, validateProgram, runProgram, RunController
    levels/                      Level, level validation, registry, level data
    learning-progress/           saved progress and saved programs (ports + localStorage adapter)
    shell/                       home screen, navigation, later the parent area
tests/
  unit/<slice>/                  fast tests, no browser, mirror the slice folders
  e2e/                           a few key child flows only
  fixtures/                      invalid levels and other test data (never shipped)
```

Slice names and terms come from `docs/UBIQUITOUS_LANGUAGE.md`. Existing folders (`js/simulator`, `js/levels`, `js/robot-lab.js`) are migrated into this shape by stories US-061 to US-064, one slice at a time, without changing behavior.

## 2. Dependency rules (enforced by `npm run architecture:check`, US-061)

1. A slice may import another slice **only through that slice's `index.js`**. Never import its internal files.
2. Inside a slice the direction is `ui -> application -> domain`. `infrastructure` (storage, timers) implements ports declared by `application`. `domain` imports nothing outside itself except `shared`.
3. `domain` and `application` never touch `document`, `window`, `localStorage`, `setTimeout`, `Date.now`, `Math.random` or `console`. These arrive through injected ports (`clock`, `delay`, `repository`, `logger`).
4. `shared` imports from no slice.
5. No module-level mutable state (`let` variables holding app state). State lives in objects created by factory functions in the composition root.
6. `app.js` contains wiring only.

## 3. SOLID in this codebase

- **Single responsibility.** One reason to change per file. Target: files under 200 lines, functions under 40 lines, at most 4 parameters. A file that renders, validates, stores and runs is wrong.
- **Open/closed.** New block types (repeat, if, sensor blocks) are added by registering a `BlockDefinition` (`type`, `labelId`, `iconId`, `validate`, `execute`) in a registry, not by adding another branch to a switch or `if` chain.
- **Liskov.** Every adapter honors its port's contract. Provide one contract test per port and run it against each adapter (localStorage, in-memory fake).
- **Interface segregation.** Small ports: `ProgressRepository { loadCompletedLevelIds, saveCompletedLevel }`, `ProgramRepository { load, save }`, `Delay { wait(ms, signal) }`. No "storage manager" with ten methods.
- **Dependency inversion.** Use cases receive ports as arguments. Nothing in `domain` or `application` creates its own dependencies.

## 4. Other quality rules

- **Pure core, effects at the edges.** Domain functions take state and return new state. They do not mutate arguments. (`updateChallengeProgress` mutating its argument is the kind of thing to fix.)
- **Errors are values or typed errors.** No empty `catch`, no swallowing, no `console.warn` as error handling. Return `Result` or throw a named error that the edge turns into a child-friendly Arabic message.
- **Configuration is injected.** Production ignores URL parameters for behavior. Tests build their own `RuntimeConfig` through a test entry point (see US-065).
- **No test code in shipped files.** Fixtures live in `tests/fixtures/`. The build excludes `tests/`.
- **All user-visible text goes through i18n.** Level titles and hints use keys or are loaded from localized level content, never inline in logic files.
- **No magic numbers.** Name and document limits in one constants module per slice.
- **No duplication.** The third copy of a pattern becomes a function.
- **Comments explain why, not what.** Names carry the what.

## 5. Test pyramid

- **Unit tests (most):** domain and application code with `node --test`, no browser, no DOM. The execution engine, program validation, edit rules, level validation and repositories must be fully unit-testable.
- **Adapter tests:** run each port's contract test against its real adapter.
- **E2E tests (few):** Playwright for key flows (open level, build program, run, see success, reload and keep progress, offline reopen, RTL). One e2e file per user story is a smell; prefer unit tests and extend a shared flow test.
- Coverage is informational, but every domain and application file must have tests; list any exception in the PR.

## 6. Production-ready checklist (every PR and the release)

- CI green: lint, unit, e2e, safety check, architecture check, build.
- No leftover TODO, debug output or dead code.
- Failure paths handled and tested (storage unavailable, invalid saved data, invalid level, aborted run).
- No `eval`, `new Function`, unsafe HTML insertion, external requests, telemetry.
- Accessible: names, focus, keyboard, reduced motion, target size.
- Arabic and RTL verified; direction icons not mirrored.
- Docs updated: README, ADRs, status file.

## 7. Smells that must be fixed in review

God file or class; shared mutable state; boolean flag parameters; deep nesting (more than 3 levels); feature logic inside DOM event handlers; DOM queries inside domain code; the same concept with two names; copy-paste; commented-out code; tests that only assert "it did not crash"; one-off test hooks in production code.
