# ADR 0001: StykAnimate integration strategy

- Status: Proposed
- Date: 2026-10-24

## Context

MiniBot Studio is an Arabic-first educational robot programming app. The backlog includes a Story Studio feature set that is explicitly tied to the upstream StykAnimate project. The repository must preserve child safety, local-first privacy, and a clear licensing path for any third-party code.

The architecture guidance in the project setup recommends defaulting to a lightweight local-first implementation, while the backlog explicitly notes that Story Studio should be based on StykAnimate only after the owner records a decision in US-045.

## Decision

MiniBot Studio will adopt the owner-approved default decision A:

- License the project under GPL-3.0-or-later.
- Permit vendoring the pinned StykAnimate upstream build under `third_party/stykanimate/` when approved by the owner.
- Keep all upstream material unmodified and separate from the project code.
- Continue to block Story Studio stories until the owner decision is recorded.

## Rationale

This keeps the project aligned with the backlog's safety and compliance guidance and gives the team a simple, auditable path for integrating StykAnimate without shipping unreviewed upstream code. GPL-3.0-or-later is the recommended licensing choice for a child-focused educational app that bundles third-party code and needs to remain open and traceable.

## Consequences

### Positive

- Clear compliance path for StykAnimate integration.
- Local-first Story Studio remains possible with unmodified upstream vendoring.
- The project can proceed with Story Studio work once the licensing decision is finalized.

### Negative

- The project must preserve GPL-compatible notices and vendor distribution requirements.
- Story Studio work remains blocked until the owner provides the formal decision.

### Follow-up

- Keep `US-045` blocked until the owner signs off.
- Add vendor notices and licensing status when the decision is approved.