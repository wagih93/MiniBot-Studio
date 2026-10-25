# US-042 Agent definition validation

## Scope

This document records the US-042 checks for `.github/agents/minibot-backlog-implementer.agent.md`.

## Automated validation

Command:

```text
npm run validate:agent
```

Checks performed by `scripts/validate-agent-frontmatter.mjs`:

- File contains YAML frontmatter.
- Required frontmatter fields are present and non-empty:
  - `name`
  - `description`

## Consistency review against repository instructions

Compared with:

- `docs/COPILOT_PROJECT_SETUP.md`
- `docs/PRODUCT_BACKLOG_STYKANIMATE.md`
- `.github/pull_request_template.md`

Findings:

- The agent's run-loop expectations are aligned with backlog section 20 sequencing.
- Branch, commit, and PR naming rules match backlog section 5.6.
- Story Studio licensing gate behavior is consistent with US-045/US-046 to US-054 blocking rules.

No direct instruction conflicts were found during this pass.

## Manual check required

The agent picker availability check is manual and must be confirmed by a human reviewer in the US-042 pull request before marking the story `Done`.
