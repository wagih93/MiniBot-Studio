# ADR-0001: StykAnimate integration strategy

- **Status:** Proposed. Becomes Accepted when the owner merges the decision under US-045.
- **Date:** 2026-10-21
- **Upstream:** https://github.com/filippocalippo/StykAnimate-App
- **Inspected commit:** `def97214c2b491fbce82647f625a73f78416c6d8` (2026-10-19), package version 1.2.5, shallow clone and file reading
- **Legal note:** this ADR is a technical summary, not legal advice. Points that depend on legal interpretation are flagged for qualified review.

## Context

MiniBot Studio is a local, offline, Arabic-first educational app for a five-year-old. Story Studio needs a real animation tool, introduced gradually with adult help.

## Technical findings (verified from the cloned repository)

- Static browser build with no server. `npm run web:build`, `web:verify` and `test:web` exist. A Python codec runs in the browser through WebAssembly (Pyodide). Offline after first load via a service worker (upstream `docs/WEB.md`).
- WebGPU renderer with a labeled Canvas 2D fallback when WebGPU is unavailable (upstream `docs/renderer.md`).
- An Arabic locale pack `src/locales/packs/ar.json` exists (about 7,000 strings); RTL support is described in upstream `docs/LOCALIZATION.md`.
- Full professional editor with a Simple frame-strip timeline and an Advanced timeline. Not designed for a five-year-old.
- No embedding API found. Production headers set `X-Frame-Options: DENY` and `frame-ancestors 'none'`. Only internal worker messaging was found.
- Optional consent-based diagnostics (`docs/telemetry.md`). A community library uses a server route `/community/*` in upstream's own deployment.
- No bundler. The web file set comes from the `web` filter in `package.json`.

## Licensing findings

- `LICENSE` is the GNU GPL version 3 text. `package.json` declares `GPL-3.0-or-later`. The README says the same.
- Third-party parts keep their own licenses (upstream `THIRD_PARTY_NOTICES.md`): resvg MPL-2.0; earcut ISC; opentype.js MIT; Noto Sans and Inter SIL OFL 1.1; zstd-wasm MIT/BSD-2; an adaptation of sticknodes-rs MIT. Desktop releases also ship FFmpeg (GPL-3.0), Electron and Python, which MiniBot would not use.
- Upstream asks that modified versions use a different name and logo.
- Consequences if MiniBot Studio is distributed together with StykAnimate: the distributed combination is expected to be offered under GPL-3.0-or-later with corresponding source, license text and notices. A separate window or path does not by itself change this. For purely private family use with no distribution, these obligations are not triggered. Flag for qualified legal review if distribution to others is planned and the owner wants a different license.

## Options

| | A' Vendored unmodified build, separate path and window | B External link to app.stykanimate.com | C Original minimal workspace |
|---|---|---|---|
| License effect | Distributed combination under GPL-3.0-or-later | No bundling, but depends on a third-party site | None from upstream |
| Offline | Yes (verify in US-049) | No (needs network first) | Yes |
| Arabic / RTL | `ar` pack present, quality unreviewed (US-048) | Same | Fully controlled |
| Child suitability | Needs adult help and cards | Same | Best |
| Effort | Medium (vendoring, audits, cards) | Low | High (US-055, 13 points) |
| Privacy | Verify no external requests (US-046) | Leaves the device | Local |
| Maintenance | Re-pin deliberately | None | Our code |

## Proposed decision

**Decision A (recommended):** license MiniBot Studio under GPL-3.0-or-later and use Option A'. Vendor an unmodified, pinned build under `third_party/stykanimate/`, open it in its own window from an adult-gated entry, share no data with it, show licenses and source links in the app (US-053), and keep Robot Lab's content security policy unchanged.

**Decision B (alternative):** keep other license terms, do not bundle upstream, and build the original minimal workspace (US-055). Option B in the table (external link) is not recommended because it breaks offline and privacy goals.

The owner chooses by merging this ADR with the chosen decision marked.

## Required notices if upstream material is distributed

GPL-3.0 license text; upstream copyright and third-party notices; pointer to the corresponding source at the pinned commit; statement of any modification (none are planned); renamed branding if anything is modified.

## Not verified yet

- Whether `web:build` needs network access during the build.
- Size of the built output.
- Translation quality of the Arabic pack and how to preselect Arabic without modifying upstream code.
- Service-worker scope and storage-key coexistence with MiniBot.
- Behavior on a device without WebGPU.

These are covered by US-046, US-048 and US-049.

## Risks

Legal interpretation; upstream changes after the pinned commit; an adult-grade editor for a young child; shared origin storage; large build size.

## Questions for qualified legal review

- Does planned distribution (GitHub releases, classroom sharing, app bundles) trigger GPL source-offer obligations for all distributed binaries and asset bundles in our intended channels?
- Is the planned NOTICE/source-link strategy sufficient for GPL-3.0-or-later + third-party-attribution compliance when bundling an unmodified upstream web build?
- Are there any additional trademark/branding obligations when distributing unmodified upstream assets under a new product name?
- Are there compatibility concerns between GPL-3.0-or-later distribution and any current or planned third-party dependencies (for example Apache-2.0 dependencies such as Blockly)?

## Go / no-go

Option A': **go, conditional** on the owner's decision in US-045. Option B: **no-go**. Option C: **fallback** if the owner decides not to use GPL-3.0-or-later.
