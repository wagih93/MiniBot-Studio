# REVIEW-000: baseline review of the PR stack

- **Reviewer:** Claude (manual review, before the reviewer agent existed)
- **Date:** 2026-10-24
- **Reviewed:** branch `feat/US-015-save-and-restore-program` at commit `37e36b98191007902e4baa1b3e9833bdfd01db91` (tip of the stack: 55 commits ahead of `master`, covering US-001 to US-017, US-021, US-022, US-033, US-034, US-039 to US-043, US-045)
- **Verdict:** **Changes requested** (not merge-ready as architecture; behavior looks good)

## What was executed

| Command | Result |
| --- | --- |
| `npm ci` | succeeded |
| `npm test` | 9 passed, 0 failed |
| `npm run safety:check` | passed |
| `npm run validate:agent` | passed |
| `npm run build` | passed ("Build baseline check passed") |
| `npm run test:browser-safety` (21 Playwright files) | **not run** in this review; needs a browser download. CI is configured to run it, but the CI results of the PRs were not checked |

## What is good

- Every story has its own branch, commits scoped with the story ID and its own PR (26 open). Naming conventions are followed.
- CI is real and runs install, unit tests, safety check, agent validation, browser tests and build.
- Safety is enforced: a strict CSP, a static check against `eval`/`new Function`/unsafe HTML with an empty allowlist, and a network-silence browser test.
- The domain files that exist (`js/simulator/world.js`, `robot.js`, `js/levels/*`) are small, mostly pure and unit-tested.
- Plain JavaScript with ES modules and almost no dependencies (only Playwright), as decided in ADR-0002.

## Findings

Severity: **Blocker** (fix before building more), **Major**, **Minor**.

### B1 Blocker: `js/robot-lab.js` is a 1,053-line god file

It renders the world and the toolbox, runs drag and drop, owns all state in 15 module-level `let` variables, validates and executes programs, reads and writes `localStorage`, and wires every DOM event. It has about 70 functions and 19 `document.querySelector` calls at load time. Consequences: violates single responsibility, open/closed and dependency inversion; nothing in it can be unit-tested without a browser; every new story (repeat blocks, conditions, hints) will make it worse.
Fix: US-061 to US-064 (vertical slices, pure execution engine, program-editing model, repository ports). Behavior must not change; all existing tests must keep passing.

### B2 Blocker: the stack was never merged and `master` has no application code

`master` still contains only `.github`, `docs` and `scripts` (3 commits). All work lives in 26 stacked PRs. Review is impractical and the risk grows with every story.
Fix: human action, see `docs/NEXT_SESSION_PROMPTS.md` section 1.

### M1 Major: test pyramid is inverted

Only 9 unit tests cover the domain. The execution loop, program validation, step limits, edit rules and persistence are tested only through 21 browser test files. Slow, brittle, and not able to pinpoint failures.
Fix: US-062 to US-064 add unit tests as the logic is extracted; keep a few e2e flows.

### M2 Major: test hooks ship in production code

`js/robot-lab.js` reads URL query parameters `maxSteps`, `repeat` and `stepDelayMs` (and a level id) to change runtime behavior. Anyone who edits the URL changes execution. Values are bounded, but behavior configuration must not come from the URL.
Fix: US-065 (inject `RuntimeConfig`; production ignores the URL; tests use a test entry).

### M3 Major: test fixtures live in the shipped level folder

`js/levels/data/broken-level.js` and `test-level-validation.js` sit next to real levels and are served to the child.
Fix: US-066 (move to `tests/fixtures/`, keep out of the build).

### M4 Major: vocabulary is inconsistent

The same ideas have several names: block / blockType / program step / instruction; level / challenge; goal used for both the destination and collectibles (`goals` with `type: 'star'`); `challenge-manager.js` tracks objectives; `direction` means heading in one place and turn side in another.
Fix: `docs/UBIQUITOUS_LANGUAGE.md` and US-067.

### M5 Major: hard-coded Arabic outside i18n

`js/robot-lab.js` has Arabic literals at the fallback level title, the success sentence and the level indicator. Level files hold Arabic titles and hints inline.
Fix: move to `js/shared/i18n/ar.js` or localized level content keys (US-061, US-067).

### M6 Major: impure domain function

`updateChallengeProgress` in `js/levels/challenge-manager.js` mutates the state object it receives, while `robot.js` is pure. Mixed styles hide bugs.
Fix: return new state (US-062, as part of the execution slice).

### m1 Minor: planned structure from the setup guide was never created

ADR-0003 deferred `js/core`, `js/editor`, `js/storage`, creating folders "when a story needs them", but the stories put the logic into `robot-lab.js` instead. The slice layout in `ARCHITECTURE_GUIDELINES.md` replaces the old target tree.

### m2 Minor: the repository still has the older agent definition

`.github/agents/minibot-backlog-implementer.agent.md` in the repo describes the "sprint by sprint, one story at a time" version, not the long-run version with default decisions and stacked branches. Replace it with the new file.

### m3 Minor: manual checks and the license decision remain open

US-042 (agent picker check) and US-045 (license decision) wait on the owner. US-046 to US-054 stay blocked until then. See the next-session prompts, section 2, for the Story Studio tool choice.

### m4 Minor: build script is only a baseline check

`npm run build` verifies files exist; it does not produce a distributable. Acceptable now; covered by US-068.

## Required follow-up

The implementer agent must complete US-061 to US-068 before US-018 and later feature stories, because those stories would otherwise deepen B1.
