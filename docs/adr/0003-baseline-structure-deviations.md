# ADR-0003: Baseline structure deviations from target tree

- **Status:** Accepted
- **Date:** 2026-10-24
- **Story:** US-039

## Context

`docs/COPILOT_PROJECT_SETUP.md` section 3 defines the target project tree for the full product implementation.  
The actual repository baseline (default branch snapshot during US-039) contains only onboarding and process scaffolding:

- `.github/`
- `docs/`
- `scripts/`

The target runtime, app source, and packaging layout are intentionally not present yet.

## Decision

Keep the existing scaffold as-is and adapt future implementation to it incrementally, without rewriting or relocating files only to match the target tree prematurely.

All baseline deviations are recorded and tracked here and in `docs/repo-assessment.md`.

## Baseline deviations

| Target path | Baseline state | Decision |
| --- | --- | --- |
| `index.html` | Missing | Create in the first shell/app story that requires it. |
| `css/` | Missing | Create when UI stories introduce styles. |
| `js/` | Missing | Create in core implementation stories; keep module boundaries from setup guidance. |
| `assets/` | Missing | Create when assets are introduced. |
| `vendor/` | Missing | Create only when local vendoring is required by story scope. |
| `third_party/stykanimate/` | Missing | Keep missing until US-045 decision is merged and US-046 starts. |
| `tests/` | Missing | Create as stories add executable behavior and validation. |
| `scripts/serve.mjs` | Missing | Add when local app serving is required by implementation stories. |
| `package.json` | Missing | Introduce with first story that needs real npm scripts/dependencies. |
| `README.md` | Missing | Add/update in documentation sprint stories. |
| `LICENSE` | Missing | Add under US-045 decision workflow. |
| `THIRD_PARTY_NOTICES.md` | Missing | Add with license and dependency notice stories. |

## Consequences

- Avoids duplicating or backfilling placeholder code just to satisfy a target shape.
- Preserves traceability: each structural addition is tied to the story that needs it.
- Keeps Story Studio paths blocked until the licensing gate is owner-approved and merged.
