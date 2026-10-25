# Third-Party Notices

This file tracks third-party software and assets used by MiniBot Studio.

## Current dependencies and components

| Component | Source | License | Usage in this repository |
| --- | --- | --- | --- |
| Playwright | https://github.com/microsoft/playwright | Apache-2.0 | Development/test dependency used for browser safety checks. |
| Chromium for Testing (downloaded by Playwright) | https://chromium.googlesource.com/chromium/src | Chromium license set | Local test runtime only; not bundled in repository artifacts. |

## Planned third-party components (not yet bundled)

| Component | Planned source | License | Current status |
| --- | --- | --- | --- |
| Blockly | https://github.com/google/blockly | Apache-2.0 | Not yet added; planned for block editor stories. |
| StykAnimate | https://github.com/filippocalippo/StykAnimate-App | GPL-3.0-or-later | Blocked behind US-045 owner decision and merge. |

## Fonts

No third-party fonts are currently bundled in the repository.

Future stories must update this file when adding any new dependency, bundled asset, or license-relevant third-party material.
