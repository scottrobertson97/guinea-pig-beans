---
name: guinea-pig-beans-ui-hud-polish
description: Work on Guinea Pig Beans UI, HUD, modal, dock, feedback, copy, responsiveness, CSS, and polish passes. Use when changing index.html, src/ui/hud.ts, src/ui/events.ts, src/scenes/GameScene.ts visual reactions, src/styles.css, POLISHING_PLAN.md items, or player-facing status/availability presentation in the D:\Documents\GitHub\guinea-pig-beans checkout.
---

# Guinea Pig Beans UI HUD Polish

Use this skill for player-facing presentation and interaction work. The UI should make the cozy management state easy to scan while keeping the Phaser cage as the center of play.

## First Read

- Read `POLISHING_PLAN.md` for polish priorities and technical map.
- Read relevant `FEATURE_PROGRESS.md` polish tickets when implementing backlog items.
- Inspect `index.html`, `src/ui/hud.ts`, `src/ui/events.ts`, `src/styles.css`, and `src/scenes/GameScene.ts`.
- Use `DESIGN_DOC.md` only when copy or layout changes affect the player-facing design language.

## UI Pattern

- Keep high-frequency care/status information visible.
- Put deeper controls in the existing section dock and modal disclosure pattern.
- Put always-needed utility controls, such as recovery or reset-style actions, in the topbar utilities.
- Open the relevant modal before querying or changing nested content.
- Prefer graphic launcher buttons, concise status copy, and readable availability states over dense explanatory panels.

## Feedback Pattern

- Reuse `src/ui/events.ts` for HUD-to-scene feedback instead of inventing parallel browser events.
- Let `src/scenes/GameScene.ts` handle canvas reactions, floating text, bursts, sprite sync, and visible world changes.
- Pair important actions with feedback: care, purchases, unlocks, contracts, events, prestige, and passive cleanup should all produce a player-visible response.
- Throttle repeated microinteractions when rapid updates would become noisy.

## Layout Guardrails

- Keep compact controls stable with explicit sizing, grid tracks, wrapping rules, or min/max constraints.
- Make status text fit inside buttons and modal rows on desktop and mobile.
- Avoid nested cards and decorative-only layout churn.
- Fix the visible symptom first when the user points to a specific UI artifact.
- Keep copy player-facing; do not describe implementation details in the game UI.

## Done Criteria

- The affected workflow is visible, readable, and responsive.
- Existing modal/dock bindings still work.
- Meaningful UI/gameplay presentation changes update `FEATURE_PROGRESS.md` or `POLISHING_PLAN.md` when they complete a tracked item.
- Verification follows `$guinea-pig-beans-browser-verification` for layout, input, and rendering changes.
