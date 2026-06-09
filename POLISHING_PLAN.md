# Guinea Pig Beans Polishing Plan

## Goal

Move the current playable prototype from "functional and charming" to "intentionally polished" without changing the core cozy management loop. The first polishing target is the first 60 seconds of play: the player should immediately understand that cleaning beans matters, feel rewarded for doing it, and see the cage, HUD, dock, and objective system react as one coherent game surface.

Current screenshot anchor: `tmp/polish-screenshot-2026-06-03.png`

Current local review URL: `http://127.0.0.1:5176/`

## Current Read

What already works:

- The pigs and cage art carry the game's identity well.
- The canvas-first play area gives the loop a clear focal point.
- The care strip and dock keep common actions reachable without a permanent side panel.
- Existing feedback systems already cover cleanup pops, floating text, dock badges, section modals, save status, tutorial hints, and SFX.

What still feels prototype-like:

- The top stat bar gives every resource equal weight, so early priorities compete with late-game counters.
- The cage is the strongest visual element, but the surrounding canvas/background area still feels like a broad neutral container rather than a staged playfield.
- The first tutorial hint reads as a generic UI toast instead of an authored in-game objective prompt.
- The dock icons are useful, but the action states need clearer hierarchy between "available now", "needs attention", "locked/quiet", and "selected".
- Cleanup feedback exists, but the first bean cleanup should be more ceremonious because it teaches the whole game.

## Technical Map

Primary implementation surfaces:

| Area | Files | Existing hooks |
| --- | --- | --- |
| HUD hierarchy | `index.html`, `src/styles.css`, `src/ui/hud.ts` | `.topbar`, `.stats`, `Hud.render()`, `setText()` |
| First-run guidance | `index.html`, `src/styles.css`, `src/ui/tutorialController.ts`, `src/ui/events.ts` | `#tutorial-hint`, `emitPlayerAction()`, tutorial action steps |
| Cleanup feel | `src/scenes/GameScene.ts`, `src/simulation/actions.ts`, `src/ui/events.ts` | `cleanAtWithResult()`, `playCleanFeedback()`, `playBeanPop()`, `addFloatingText()`, `addBurst()` |
| Cage staging | `src/scenes/GameScene.ts`, `src/styles.css` | `drawCage()`, `redrawCage()`, `drawAmbientCageDetails()`, `updateCleanlinessVisuals()` |
| Dock and modal states | `index.html`, `src/styles.css`, `src/ui/hud.ts` | `.section-dock`, `.dock-button`, `.dock-badge`, `updateSectionIndicators()`, `openSection()` |
| Audio polish | `src/ui/audioManager.ts`, `src/ui/events.ts`, `src/main.ts` | `emitUiSound()`, `AudioManager`, sound toggle persistence |

## Pass 0: Baseline And Review Harness

Purpose: make visual iteration repeatable before changing anything substantial.

Implementation direction:

- Keep using a strict Vite port for this checkout, preferably `5176`, so screenshots do not accidentally hit another running instance.
- Capture desktop and mobile screenshots after each polish slice.
- Add a tiny smoke script later if this becomes a repeated workflow: load the page, assert the title, assert the canvas exists, assert no console errors, click one bean, and screenshot the result.
- Treat `npm run build` plus a browser screenshot as the completion gate for UI/canvas polish.

Done when:

- Baseline screenshot exists for desktop and one narrow/mobile viewport.
- Browser console is clean.
- The review URL is confirmed to be this checkout.

## Pass 1: First 60 Seconds

Purpose: make the first cleanup, first objective, and first care decisions feel authored.

### 1A. Make First Cleanup Feel Like A Moment

Implementation direction:

- Keep all resource/state changes in `cleanAtWithResult()` and the simulation layer.
- In `GameScene.playCleanFeedback()`, add a first-clean branch based on `state.stats.cleanedPoops` before/after the clean result. Use a stronger but still short animation only for the first successful cleanup.
- Extend `playBeanPop()` with a small theme map by bean type:
  - `color`
  - `burstCount`
  - `labelScale`
  - optional `sound`
- Cap simultaneous floating labels and bursts so mess piles or rapid clicks do not create visual noise.
- Clamp floating labels inside the cage bounds so edge beans do not send text out of frame.
- Keep the reduced-motion path readable by showing reward text and avoiding burst/tween-heavy effects.

Suggested code shape:

- Add local constants in `GameScene.ts`, near the existing feedback constants:
  - `MAX_FLOATING_LABELS`
  - `FIRST_CLEAN_BURST_COUNT`
  - `CLEAN_FEEDBACK_THEMES`
- Add a small helper:
  - `getCleanFeedbackTheme(cleaned: CleanedPoop)`
  - `isFirstSuccessfulClean(result: CleanResult)`
- Keep `getCleanRewardText()` as the source of display text so reward labels stay aligned with simulation value.

Done when:

- The first cleaned bean has a distinct pop, burst, sound, and reward label.
- Normal repeated cleaning remains quick and not overwhelming.
- Rare beans still read stronger than normal beans.

### 1B. Pulse Objective Progress

Implementation direction:

- Track the previous objective signature in `Hud`, similar to `updateGoalAndLogMarkers()`.
- When `objective.id`, `progress`, or completion changes, add a short CSS class to:
  - `#quick-objective-title`
  - `#quick-objective-progress`
  - optionally the top `#combo-value` when streak changes
- Use the existing `pulseElement()` helper pattern instead of adding a new animation system.
- Keep the objective pulse visual in CSS under `.quick-objective.is-progressing` or a small reusable `.ui-pulse` class.

Done when:

- Cleaning toward "Clean 3 beans quickly" visibly updates the objective card.
- The pulse does not resize the care strip or shift nearby meters.

### 1C. Restyle Tutorial Hint Into A Game Prompt

Implementation direction:

- Keep `TutorialController` behavior and action sequencing.
- Restyle `.tutorial-hint` so it feels attached to the playfield:
  - smaller vertical footprint
  - stronger title/body hierarchy if copy needs two lines
  - subtle arrow or border accent toward the cage
  - less generic white-card feeling
- Keep `pointer-events: none` on the hint body and `pointer-events: auto` on dismiss so it never blocks cleanup.
- Consider moving the first hint to the upper-left or lower-left based on where beans spawn least often.

Done when:

- The first prompt feels intentional and does not hide beans or pigs.
- Dismissing still works.
- Mobile layout keeps the hint within the canvas bounds.

## Pass 2: HUD Hierarchy

Purpose: make the HUD teach priority instead of presenting a flat resource spreadsheet.

Implementation direction:

- In `index.html`, add stable classes or data attributes to stat cards:
  - primary early-loop stats: `Beans`, `Pigs`, `Clean`, `Streak`
  - secondary/late stats: `Compost`, `Squeaks`, `Gold`, `Wisdom`, `Furniture`
- In `Hud.render()`, toggle semantic classes on stat cards rather than changing DOM order every render:
  - `.stat-primary`
  - `.stat-secondary`
  - `.stat-danger`
  - `.stat-unlocked`
  - `.stat-dormant`
- Quiet late-game zero counters until they are relevant. Prefer opacity/visual treatment over removal so layout remains stable.
- Give `Clean` a warning state below thresholds already used in cage visuals.
- Give `Streak` a positive state while combo is active.
- Keep all values visible somewhere; polish should reduce noise, not hide information players need.

Potential helper functions in `Hud`:

- `updateStatEmphasis()`
- `setStatState(id: string, className: string, active: boolean)`
- `isResourceUnlocked(resourceId)`

Done when:

- A fresh run visually emphasizes cleaning, pigs, beans, and objective progress.
- Late-game counters no longer dominate the first read.
- No stat text overflows at desktop or mobile widths.

## Pass 3: Cage Staging And Visual Cohesion

Purpose: make the cage feel like a deliberate game scene, not a sprite rectangle sitting in a large neutral panel.

Implementation direction:

- In CSS, tune `#canvas-wrap` so the playfield feels framed:
  - warmer border color
  - slightly stronger inner/outer shadow
  - less dead visual space around the cage
  - no layout shift when the browser height changes
- In `GameScene.redrawCage()`, add more dimensional cage treatment:
  - top-left rim highlight
  - bottom-right rim shadow
  - subtle inner bedding shadow
  - sparse stitching or fleece line detail through `drawAmbientCageDetails()`
- Keep ambient detail non-clickable and below pigs/beans/decor in depth.
- Preserve bean contrast at all cleanliness levels by checking low-cleanliness tint against normal and golden bean sprites.
- Revisit `resize()` only if the cage continues to feel too small inside the available canvas. The current camera zoom centers the cage, so CSS height and canvas aspect ratio may be the first place to tune.

Done when:

- The cage reads as the main object on the screen.
- The beige outer area looks intentional, not leftover space.
- Pigs, beans, hay, water, and decor share a consistent shadow/depth language.

## Pass 4: Dock And Modal Scan Polish

Purpose: make the dock tell the player where to go next without forcing modal hunting.

Implementation direction:

- Build on existing `updateSectionIndicators()` and `.dock-badge`.
- Split badge meaning into clear visual states:
  - attention: `!` for urgent care/event/request
  - available: number badge for purchasable/usable actions
  - selected: active modal section
  - quiet: no badge, muted surface
- In `openSection()` and modal close handling, keep the selected dock button styled until the dialog closes.
- Refine `.dock-button.available-now`, `.dock-alert`, `.attention`, and badge CSS so alert states are legible without looking like errors.
- Do not increase dock height during hover/press/selected animations.
- On mobile, keep the horizontal dock scroll stable and avoid badge clipping.

Done when:

- The player can tell where an action is available without opening every modal.
- Alert states are visually distinct from ordinary availability.
- The active modal and selected dock button feel connected.

## Pass 5: Modal Content Polish

Purpose: make hidden sections feel intentional once opened.

Implementation direction:

- Continue using existing modal panels and `SECTION_META`.
- Strengthen modal header theming using the existing dock icon paths.
- Use available/disabled states already computed in `Hud` to style action rows:
  - available rows get a subtle highlight
  - disabled rows keep reason text visible in their `strong` status slot
  - purchased/unlocked rows get a calm completed state
- Add short empty states in `renderHerd()`, goals rendering, and log rendering for low-content starts.
- Avoid sorting during this pass unless sections become too hard to scan; sorting can create click targets that move under the cursor.

Done when:

- Opening a modal quickly answers "what can I do here?"
- Disabled buttons explain themselves without extra popovers.
- Empty/early sections do not feel broken.

## Pass 6: Sound And Microinteraction Pass

Purpose: add warmth to repeated actions without creating noise.

Implementation direction:

- Use `AudioManager` and `emitUiSound()` only after user interaction.
- Keep cleanup, rare cleanup, purchase, ability, modal, and pig sounds short and soft.
- Throttle repeated cleanup sounds so rapid cleaning does not stack aggressively.
- Tie DOM button press/purchase feedback to existing `runAction()` success paths.
- Keep mute state visible and persisted through the current existing audio preference flow.

Done when:

- First cleanup, purchases, ability use, and modal open/close have subtle sound/press feedback.
- Sound can be muted easily.
- The game remains calm during rapid repeated actions.

## Pass 7: Verification Checklist

Run this after every polish implementation slice:

- `npm run build`
- Start or reuse strict local server for this checkout: `npm run dev -- --port 5176 --strictPort`
- Run the automated smoke from another shell: `npm run smoke:polish`
- Open `http://127.0.0.1:5176/`
- Confirm page title is `Guinea Pig Beans`
- Confirm no console errors or warnings
- Screenshot desktop viewport
- Screenshot mobile/narrow viewport
- Manual smoke:
  - clean first bean
  - refill hay
  - refill water
  - open one dock modal
  - close modal
  - check save indicator still behaves normally

## Recommended First Slice

Start with Pass 1A and 1B together:

- First-clean ceremony in `GameScene.ts`
- Objective progress pulse in `Hud` and `src/styles.css`
- One screenshot after first cleanup

This is the smallest slice likely to make the game feel meaningfully more polished while keeping simulation risk low. It also gives us a concrete before/after to judge the tone of future polish.

## Backlog Mapping

This plan organizes the existing polish backlog into implementation passes:

- Pass 1: PB-001, PB-011, PB-018
- Pass 2: PB-003, PB-004, PB-012, PB-019
- Pass 3: PB-006, PB-007, PB-008, PB-009
- Pass 4: PB-003, PB-010, PB-014, PB-016
- Pass 5: PB-004, PB-010, PB-016, PB-017
- Pass 6: PB-005, PB-013, PB-015
