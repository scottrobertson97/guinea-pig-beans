---
name: guinea-pig-beans-gameplay-systems
description: Work on Guinea Pig Beans gameplay systems. Use when changing simulation rules, resources, progression, pig autonomy, events, contracts, recipes, Wisdom or Mythos unlocks, persistence, save hydration, dev-tool setup for deterministic states, or FEATURE_PROGRESS.md system notes in the D:\Documents\GitHub\guinea-pig-beans checkout.
---

# Guinea Pig Beans Gameplay Systems

Use this skill for changes where the game rules matter more than presentation. Keep the cozy management loop visible: pigs, care, beans, upgrades, requests, events, and progression should feed each other instead of becoming isolated features.

## First Read

- Read `FEATURE_PROGRESS.md` for current systems, backlog tickets, and implementation notes.
- Read `DESIGN_DOC.md` when the work changes the player-facing loop or long-term progression fantasy.
- Inspect `src/simulation/types.ts`, `state.ts`, `balance.ts`, `actions.ts`, `systems.ts`, and `persistence.ts` before choosing where rules belong.
- Check `src/ui/devTools.ts` when deterministic browser verification needs seeded resources, unlocks, or pig states.

## Implementation Workflow

1. Define the player-visible outcome first: what changes in choices, feedback, risk, pacing, or pig behavior.
2. Put shared costs, capacities, formulas, and definitions in `src/simulation/balance.ts`.
3. Put player-triggered spending, unlocks, cleaning, abilities, event choices, and prestige outcomes in `src/simulation/actions.ts`.
4. Put timed behavior, derived cage stats, pig needs/goals, automation, events, cleanup, and survival pressure in `src/simulation/systems.ts`.
5. Update `src/simulation/types.ts` and `src/simulation/state.ts` for new persistent fields or initial entities.
6. Hydrate old saves in `src/simulation/persistence.ts` whenever saved shape changes. Current save key: `gpb-save-v1`.
7. Surface the result through HUD copy, controls, scene feedback, or modal status. Do not leave meaningful systems invisible.
8. Update `FEATURE_PROGRESS.md` when the implemented system changes current mechanics, backlog status, or design notes.

## Guardrails

- Keep pig autonomy in the simulation layer. `GameScene` and HUD should display pig goals and reactions, not own the rules.
- Prefer fixed-zone ecology and management interplay unless the user explicitly reopens scope for free placement, minigames, or genre changes.
- Do not add orphan resources or upgrades. Every new mechanic needs a reason to matter to at least one other loop.
- Explain purchasables and late-game unlocks directly in button/status copy when their effect is not obvious.
- Add dev-tool hooks only when they make verification meaningfully more deterministic.

## Done Criteria

- Rules live in the simulation layer and are visible through UI or scene feedback.
- Save compatibility is handled for new persistent fields.
- `FEATURE_PROGRESS.md` stays current for meaningful gameplay changes.
- Verification follows `$guinea-pig-beans-browser-verification` for code changes.
