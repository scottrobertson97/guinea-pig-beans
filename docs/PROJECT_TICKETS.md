# Project Tickets

Use this as the durable Project Manager work queue for broad Guinea Pig Beans tasks. Keep tickets implementation-ready, scoped to the cozy management loop, and tied to visible player outcomes.

## Ticket Schema

- ID: short stable ID, such as `PM-001`, `SYS-009`, or `POL-032`.
- Goal: one sentence describing the player-facing or repo-facing outcome.
- Owner role: Project Manager, Gameplay Worker, UI/HUD Worker, Art Worker, Verification Worker, Reviewer, or Lead Agent.
- Files/scope: expected ownership area; use disjoint scopes for parallel workers.
- Acceptance criteria: concrete checks that define done.
- Verification: build, browser smoke, screenshot, save hydration check, docs readback, or review pass as appropriate.
- Dependencies: prerequisite tickets, user decisions, assets, or blocked technical work.
- Status: Proposed, In Progress, Blocked, or Done.

## Proposed

Use this template for new PM tickets:

```markdown
### <ID>: <Title>

Status: Proposed

Owner role: <Role>

Goal: <One-sentence outcome.>

Files/scope: <Owned files, modules, docs, or asset paths.>

Acceptance criteria:

- <Criterion 1>
- <Criterion 2>
- <Criterion 3>

Verification:

- <Command or check>
- <Browser/assertion/doc readback as needed>

Dependencies:

- <None, or ticket/user/asset dependency>

Notes:

- <Implementation hints, risks, or coordination notes>
```

## In Progress

Move tickets here when the lead agent or a sub-agent starts implementation.

## Blocked

Move tickets here when progress requires a user decision, missing asset, failing external dependency, or conflicting active work.

## Done

Move tickets here after implementation, verification, and lead-agent integration are complete.
