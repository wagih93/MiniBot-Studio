#!/usr/bin/env bash
# Creates one GitHub issue per story from docs/story-index.tsv, so each can be
# assigned to Copilot (with the minibot-backlog-implementer agent) one at a time.
# Requires: GitHub CLI (gh) logged in, run from the repository root.
# NOT RUN by the author: review with DRY_RUN=1 first (default).
set -euo pipefail
DRY_RUN="${DRY_RUN:-1}"

if [ "$DRY_RUN" != "1" ]; then
  for l in story P0 P1 P2 sprint-0 sprint-1 sprint-2 sprint-3 sprint-4 sprint-5 sprint-6 sprint-7; do
    gh label create "$l" --force >/dev/null 2>&1 || true
  done
fi
tail -n +2 docs/story-index.tsv | while IFS=$'\t' read -r id title priority estimate sprint deps; do
  issue_title="[$id] $title"
  body="Story **$id** - $title

- Priority: $priority
- Estimate: $estimate points
- Sprint: $sprint
- Depends on: $deps

Full story and acceptance criteria: docs/PRODUCT_BACKLOG_STYKANIMATE.md (search for \"$id\").
Follow the naming conventions in section 5.6 and the agent rules in .github/agents/minibot-backlog-implementer.agent.md."
  if [ "$DRY_RUN" = "1" ]; then
    echo "DRY RUN: gh issue create --title \"$issue_title\" --label story,sprint-$sprint,$priority"
  else
    gh issue create --title "$issue_title" --body "$body" --label "story,sprint-$sprint,$priority"
  fi
done
