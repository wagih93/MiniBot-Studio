#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-origin}"

cat <<'EOF'
US-001	Core game loop foundation
US-002	Block editor foundation
US-003	Arabic landing shell
US-004	Initial world and level state
US-005	Program execution model
US-006	Child-friendly execution feedback
US-007	Outcome and success conditions
US-008	Core challenge flow and controls
US-009	Level completion and progression
US-010	Toolbox and block availability
US-011	Workspace and serialization setup
US-012	Blockly integration
US-013	Arabic Blockly experience
US-014	Block validation and rules
US-015	Level content structure
US-016	Program data model
US-017	Editor actions and state
US-018	Repeat loop support
US-019	Conditional execution
US-020	Sensor-aware branching
US-021	Retry and replay handling
US-022	Robot movement and position model
US-023	Level registry
US-024	Challenge manager
US-025	Level progression model
US-026	Completion tracking and analytics
US-027	Polish and review loop
US-028	Parent dashboard
US-029	Sound and accessibility settings
US-030	Offline-first storage and privacy
US-031	Privacy and data guardrails
US-032	Reset and progress hygiene
US-033	Safety and recovery behavior
US-034	Data integrity and validation
US-035	Robotics lab and experiments
US-036	Backup and restore strategy
US-037	Documentation and support materials
US-038	Release notes and packaging
US-039	Baseline repository inspection and ADR capture
US-040	CI and engineering conventions baseline
US-041	Repository conventions and safety checks
US-042	License and notices review
US-043	Engineering foundation and process setup
US-044	Browser E2E coverage
US-045	License decision for Story Studio
US-046	Story Studio entry screen
US-047	Story Studio content workflow
US-048	Story Studio authoring tools
US-049	Story Studio content flow
US-050	Story Studio card UI
US-051	Story Studio licensing page
US-052	Story Studio asset safety
US-053	Story Studio adult-gated access
US-054	Story Studio release certification
US-056	Advanced behaviors and edge cases
US-057	MVP readiness gate
US-058	Release validation
US-059	Launch documentation
US-060	Final backlog closeout
EOF

# The script is intentionally a template for repository administrators. It creates a ready-to-use
# story issue list for gh issue create. GitHub CLI availability is checked in the repo workflow.
if ! command -v gh >/dev/null 2>&1; then
  echo 'GitHub CLI (gh) is not installed. Skipping issue creation.' >&2
  exit 0
fi

echo "This helper is a template; update the title/body mapping before use."
echo "Target repository: ${REPO}"