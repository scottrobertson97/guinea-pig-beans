# Guinea Pig Beans Agent Guide

Use this as the first-read guide for working in this checkout. Keep changes game-first, visible to the player, and aligned with the existing cozy management loop.

## Project Shape

- This is a Phaser 3 + TypeScript + Vite browser game.
- GitHub Pages deployment builds the Vite `dist` output from `main`.
- The app combines a Phaser canvas with DOM HUD controls and modal sections.
- Existing deeper docs:
  - `FEATURE_PROGRESS.md`: current systems, backlog, and implementation notes.
  - `POLISHING_PLAN.md`: polish workflow and technical map.
  - `ART_ASSET_PLAN.md`: asset workflow, prompts, paths, and naming.
  - `OUTLINE.md`: original design intent.

## Commands

- `npm run dev`: start Vite on `127.0.0.1`.
- `npm run build`: run TypeScript and Vite production build.
- `npm run preview`: serve the production build locally.
- There is no dedicated test script. For gameplay/UI changes, use build plus a focused browser smoke check.
- If PowerShell cannot find `npm`, run the local tools through the bundled Node runtime:
  - `C:\Users\scott\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc`
  - `C:\Users\scott\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vite\bin\vite.js build`

## Architecture Map

- `src/simulation/types.ts`: persistent state shape and shared game enums.
- `src/simulation/state.ts`: initial state, entity creation, targeting, placement, and log helpers.
- `src/simulation/balance.ts`: shared costs, capacities, formulas, and perk/furniture definitions.
- `src/simulation/actions.ts`: player-triggered spending, cleaning, unlocks, abilities, events, and prestige.
- `src/simulation/systems.ts`: timed simulation tick, derived cage stats, events, pig needs/goals, automation, survival, and cleanup systems.
- `src/simulation/persistence.ts`: save/load, reset, save status events, and save hydration.
- `src/scenes/GameScene.ts`: Phaser rendering, pointer input, canvas feedback, sprite sync, and visible world reactions.
- `src/ui/hud.ts` plus `index.html`: DOM HUD, section dock, modal content, player controls, status copy, and action bindings.
- `src/ui/events.ts`: shared browser events that bridge HUD, scene feedback, sound, and tutorial behavior.
- `src/ui/devTools.ts`: development-only hooks for controlled unlocks, resources, and smoke-test setup.

## Implementation Rules

- Put resource math and player action outcomes in the simulation layer, then expose the result through HUD and/or scene feedback.
- New autonomous pig behavior belongs in `src/simulation/systems.ts`; `GameScene` and `Hud` should make it visible, not own the simulation rules.
- New persistent fields need save hydration or migration thought in `src/simulation/persistence.ts`. The current save key is `gpb-save-v1`.
- Wire new persistent systems through all needed layers: types/state, actions/systems, HUD/HTML, scene feedback if visible, and dev tools when deterministic testing needs setup.
- Keep high-frequency care/status information visible. Put deeper controls in the existing dock and modal pattern unless the task calls for persistent chrome.
- Place always-needed utility controls, such as recovery/reset-style actions, in the topbar utilities rather than burying them in a modal.
- Explain purchasables and late-game unlocks directly in button/status copy when their effect is not obvious.
- Reuse assets under `public/assets/...` before adding placeholders. Follow `ART_ASSET_PLAN.md` for new art paths and naming.
- When gameplay systems change meaningfully, update player-facing HUD/copy and `FEATURE_PROGRESS.md` in the same pass so the repo narrative stays current.

## Verification Habits

- For code changes, run `npm run build` first. Retry once if Vite hits a transient Windows `ENOTEMPTY` cleanup error in `dist`.
- For gameplay, UI, layout, input, or rendering changes, run a short browser smoke check after the build.
- Prefer a strict known local port, commonly `5176`, when starting Vite for this checkout so another app is not tested by accident.
- Before interacting, confirm the browser is serving this checkout by checking unique page text or controls related to the current change.
- If a local page looks stale, restart Vite in a fresh process and re-check the unique page marker.
- For modal content checks, open the relevant dock section first. For example, click `#open-herd` before asserting `#pig-roster` rows.
- Phaser renders through WebGL, so avoid `getImageData()` as a primary canvas proof. Prefer DOM assertions, console checks, or `locator.screenshot()` for nonblank canvas checks.
- Avoid `Math.random = () => 0` in deterministic browser tests. Use a short deterministic sequence instead.
- If the in-app browser cannot reach localhost or fails to attach, use a compact headless Playwright smoke test from the repo context.

## Windows And Git Notes

- Git commands may need the safe-directory prefix:
  - `git -c safe.directory=D:/Documents/GitHub/guinea-pig-beans status --short`
- Generated `dist/` output may appear after builds or verification. Remove it only when a clean working tree is needed and it is not part of the intended change.
- This checkout has local dependencies installed, but shell PATH may not expose every Node shim. Prefer local binaries or the bundled Node fallback when needed.

