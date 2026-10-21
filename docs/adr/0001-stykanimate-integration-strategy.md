# ADR-0001: StykAnimate integration strategy

- **Status:** Proposed (preliminary, not accepted)
- **Date:** 2026-10-21
- **Upstream inspected:** https://github.com/filippocalippo/StykAnimate-App, `main` branch README only. **Commit SHA: not yet pinned.**
- **Decision owner:** repository maintainer. Legal interpretation requires qualified legal review.

## Context

MiniBot Studio is a local, offline, Arabic-first educational app for a five-year-old. Story Studio needs a simple animation experience. StykAnimate is a free stick-figure animation app.

## Technical findings (from the upstream README)

- Electron desktop app plus a browser build at app.stykanimate.com; the README says the browser build works offline once loaded (service worker).
- WebGPU renderer.
- Python 3.11+ backend ("codec service") used for importing Pivot and Stick Nodes files. Node.js 22+ to build.
- Features include a simple frame-strip timeline, an advanced layered timeline, exports (MP4, WebM, GIF, APNG, frames, `.piv`/`.stk`), a touch interface, 27 interface languages.
- Everything runs locally; optional consent-based diagnostics exist.
- Upstream asks modified versions to use a different name and logo.

## Licensing findings (preliminary)

- README and repository badge state GPL-3.0-or-later. Third-party components keep their own licenses (see upstream THIRD_PARTY_NOTICES.md).
- Copying or modifying upstream code, or distributing a combined application that includes it, brings GPL obligations (source availability and GPL-compatible licensing of the combined work). Whether an iframe, submodule or separate process avoids those obligations is a legal question; this ADR does not assume it does.

## Unverified (to resolve in MB-SET-004)

1. Pinned commit SHA or release tag.
2. Full LICENSE text and third-party notices, including assets and fonts.
3. Arabic and right-to-left support in the upstream UI.
4. Any documented embedding or integration API.
5. Whether the browser build runs without WebGPU and without the Python backend.
6. Whether the simple timeline can be configured to hide advanced tools.
7. Real offline behavior of the browser build, tested locally.

## Options

| | A – Integrated | B – Separate workspace | C – Original simple workspace |
|---|---|---|---|
| Licensing risk | Highest: GPL on combined distribution | Lower, but external dependency; legal review if bundled | Lowest (no upstream code) |
| Effort | High (build chain, Python, WebGPU) | Low | Medium |
| UX for a 5-year-old | Poor unless heavily simplified | Poor (full adult editor) | Best (tailored) |
| Offline | Possible, heavy | Not guaranteed (external site) | Yes |
| Arabic/RTL | Unverified | Unverified | Controlled by us |
| Maintainability | Tracks upstream changes | Minimal | Our code only |
| Security | Large surface | External origin | Small surface |
| Project import/export | Rich, upstream formats | Upstream formats | Our own validated format |

## Proposed decision (pending MB-SET-004)

- **Option C** is the core Story Studio (a small original workspace; StykAnimate used only as a feature reference, no code or assets copied).
- **Option B** may be added later as an adult-gated, clearly labeled external link (MB-ANIM-007).
- **Option A**: no-go for the MVP. Reconsider only if the owner chooses to license all of MiniBot Studio as GPL-3.0-or-later and the unverified items above are resolved favorably.

## Required notices if any upstream material is ever distributed

License text, copyright notices, source availability statement, notice of modifications, third-party notices, and renaming of modified builds per upstream request.

## Remaining risks

Unresolved legal interpretation; upstream changes; Option C effort for a frame editor.

## Go / no-go

Option A: **no-go (MVP)**. Option B: **conditional go** (P2, after verification). Option C: **go**. All pending acceptance in MB-SET-004.
