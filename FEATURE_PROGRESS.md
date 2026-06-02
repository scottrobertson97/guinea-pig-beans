# Feature Progress

## Implemented

- Pig identity basics: names, breeds, traits, favorite foods, quirks, and roster display.
- Special poop types: Normal, Golden, Compost, Stinky, Blessed, Mega, Mystery, Hay, Royal, and Cursed beans with distinct values, visuals, and log messages.
- Cleanliness loop: poop lowers cage cleanliness, and low needs/cleanliness affect pig mood and production.
- Automation: Poop Roomba can be purchased and sweeps nearby beans.
- Combo cleaning: quick consecutive cleanups build a timed Clean Streak and award bonus Beans.
- Goals and achievements: early quests and joke achievements track the first progression beats.
- Funny cage log: milestone, cleanup, pig, resource, and automation messages surface game personality.
- Expanded breeds and traits: Skinny Pig, Silkie, Crested, Royal Pig, Shy Beaner, Hay Goblin, Drama Pig, and Compost Mystic are now in the pig generator.
- Cage zones: fixed Hay Area, Tunnel Zone, Litter Tray corner, Hidey Zone, and Play/Compost areas now influence targeting, movement, cleanliness, and aging.
- Cage furniture: Hidey House, Tunnel, Litter Tray, Chew Toy, Snuggle Sack, Cardboard Castle, and Royal Throne are one-time static unlocks with distinct buffs.
- Furniture synergies: matching static furniture pairs now unlock combo bonuses for comfort, Zoomies, cleanup automation, and royal/compost strategy.
- Additional needs/resources: Enrichment, Socialization, Space, Compost, Squeaks, Golden Beans, and Cavy Wisdom are tracked.
- Random events: Zoomies, Hay Frenzy, Nap Time, Bottle Jam, Cage Inspection, Compost Bloom, and The Great Wheeking can trigger with three response choices each.
- Pig requests: one pig at a time can ask for a short-lived favor tied to care, cleanup, abilities, furniture, combo, or Compost.
- Pig social mechanics: bonded pairs are assigned as pigs join, and herd size contributes socialization.
- Active abilities: Wheek Call, Treat Bag, Deep Clean, Fresh Bedding, Snack Time, and Zoomie Mode are available with cooldowns.
- Rare/legendary pigs: legendary pig adoption uses Beans plus Golden Beans and creates stronger named pigs.
- Prestige: The Great Composting soft-resets the run, previews gained Wisdom, and feeds a branching Wisdom tree.
- Late-game mythos: Hay Dimension, Bean Exchange, Cavy Council, Squeak Choir, and Bean Singularity have first-pass unlocks.
- Interop pass: Static furniture buffs affect care, movement, herd support, automation, and rare bean odds; stronger abilities spend Squeaks, Compost can fuel automation overdrive, rare bean recipes unlock cross-system bonuses, events are weighted by cage state, and Cavy Wisdom feeds branching permanent perks.

## Current Early Goals

- Clean 10 beans.
- Reach 100 Beans.
- Adopt a second pig.
- Buy Better Scoop.
- Hit Clean Streak x5.
- Unlock Poop Roomba.
- Add cage furniture.
- Clean 5 rare beans.
- Use an active ability.
- Adopt a legendary pig.
- Enter the Great Composting.

## Current Achievements

- First Bean.
- Gold Rush.
- Cage Goblin.
- Oops, All Poop.
- Bean Counter.
- The Janitor Rises.
- Wheek Shall Overcome.
- Rare Bean Counter.
- Interior Designer.
- Eventful.
- Poop Baron.
- The Poopening.

## First-Pass Implemented, Needs Depth

- Cage zones are fixed regions, not yet player-placeable tiles.
- Furniture is auto-placed at fixed locations as one-time unlocks, not freely placed with footprints.
- Random events are timer-based, not yet driven by quest chains or event decks.
- Wisdom perks now use a first-pass branching tree with prerequisites; the next step is deeper presentation and tuning.
- Late-game systems unlock passive effects, but they need deeper dedicated interfaces and decisions.
- Minigames are still intentionally deferred until the main loop has more tuning data.

## Design Decisions Needed Later

- Whether cage zones should remain fixed regions or eventually support tile painting.
- Whether special poop aging should reward waiting more aggressively or mostly punish mess.
- Whether current Squeak ability costs should scale with repeated use or stay flat.
- Whether Cavy Wisdom should add mutually exclusive choices after the current non-exclusive tree is tuned.

## Core Loop Improvement Queue

- [x] Make poop placement matter more through stronger zone effects, litter tray auto-cleaning, compost aging, and clustered mess.
- [x] Convert furniture into static one-time unlocks with fixed cage locations.
- [x] Make pig personalities visibly drive behavior and preferred targets.
- [x] Add mess piles that form from clustered poops and require multiple cleans.
- [x] Add a visible happiness meter connected to cleanliness, needs, enrichment, socialization, and space.
- [x] Add rotating short-term objectives beyond static quests.
- [x] Make random events interactive instead of purely timed modifiers.
- [x] Tune early pacing around first poop, first special poop, first upgrade, second pig, first mess moment, and first automation.
- [x] Make upgrades and resources depend on each other through static furniture buffs, Squeak ability costs, Compost automation fuel, bean recipes, weighted events, and Wisdom perks.

## Active Core Loop Pass

- [x] Queued the core-loop improvements as a tracked checklist.
- [x] Convert furniture from passive-only purchases into static auto-placed unlocks.
- [x] Strengthen trait targeting so pigs make predictable, exploitable messes.
- [x] Add mess pile formation and multi-clean rewards.
- [x] Verify build and browser smoke test.

## Core Loop Pass Notes

- Furniture purchases now unlock one static object immediately at a fixed cage location.
- Neat Freak, Shy Beaner, Hay Goblin, Gremlin, and Royal Pig targeting now prefers relevant static objects or messy areas.
- Litter trays can auto-clean nearby beans.
- Clusters of four or more beans can merge into a mess pile with multiple clean hits and higher value.
- Happiness is now visible and affects production speed plus rare poop chance.
- Rotating objectives provide timed short-term tasks with Bean rewards.
- Active events expose three Care-modal response choices with light resource tradeoffs.
- Early costs and initial poop timing were lowered to hit the first upgrades and second pig sooner.

## Polish Backlog Tickets

Status default: not started. Prioritize P1 tickets first because they make the repeated clean-buy-care loop feel better without changing the core simulation.

### PB-001: Bean Cleanup Feedback

Priority: P1

Status: First pass implemented.

Description: Add immediate visual feedback when a bean is cleaned. The current loop updates counters and log text, but the click itself should feel rewarding every time. Cleaning a bean should produce a short pop, a floating reward label, and a small particle or sparkle burst. Rare beans should have more noticeable feedback than normal beans.

Acceptance criteria:

- Cleaning any bean plays a short pop/scale animation before the bean disappears.
- A floating reward label appears near the cleaned bean, such as `+1 Beans`, `+Gold`, or `+Compost`.
- Golden, rainbow, blessed, royal, cursed, and other rare bean types use distinct accent particles or color treatments.
- Feedback remains readable when several beans are cleaned quickly.
- Reduced-motion users still get readable reward text without excessive animation.

Implementation notes:

- Implement in `GameScene` where bean click/cleanup currently removes poop views.
- Keep particle counts small so large mess piles do not hurt performance.
- Reuse existing bean type data and value calculations rather than duplicating reward logic in the view layer.

### PB-002: Pig Personality Animations And Thought Bubbles

Priority: P1

Status: First pass implemented.

Description: Make pigs feel less like moving counters by adding small personality-driven idle and reaction states. Pigs should occasionally wiggle, sniff, eat, drink, pause, or show a tiny thought bubble tied to their current target or need.

Acceptance criteria:

- Pigs occasionally play at least three idle/reaction behaviors: wiggle/sniff, eat hay, drink water, or pause dramatically.
- Thought bubbles appear only when useful, such as hay, water, sleep, sparkle, or mess icons.
- Trait-driven behavior is visible: Neat Freaks care about litter trays, Hay Goblins seek hay, and Shy Beaners prefer hidey objects.
- Animations do not obscure bean cleanup targets.
- Multiple pigs can react without cluttering the cage.

Implementation notes:

- Keep this as a visual layer over existing movement and targeting.
- Start with simple sprite scale/rotation/tint changes before adding new animation frames.
- Use short-lived Phaser image or text objects for bubbles.

### PB-003: Dock Badges And Availability Indicators

Priority: P1

Status: First pass implemented.

Description: Add small badges to the bottom section dock so players know where attention is needed. The dock should surface available purchases, usable abilities, new goals, event readiness, and new log entries without reopening every modal.

Acceptance criteria:

- Care shows a badge or pulse when hay/water is low or an event response is ready.
- Shop/Furniture/Wisdom/Mythos show availability when at least one visible action can be purchased or unlocked.
- Abilities shows availability when at least one ability can be used.
- Goals shows a marker when objective or milestone progress changes meaningfully.
- Log shows a marker for new entries since the last time the log modal was opened.
- Badges clear or update when the relevant modal is opened or state changes.

Implementation notes:

- Add badge elements inside existing dock buttons in `index.html`.
- Compute badge state in `Hud.render()` from existing disabled/action state.
- Avoid blocking input on the dock button itself.

### PB-004: Disabled Button Reason Text

Priority: P1

Status: First pass implemented.

Description: Disabled modal buttons should explain why they cannot be used. This is especially important now that actions are hidden inside modals; players need quick feedback once they open a section.

Acceptance criteria:

- Shop buttons explain missing Beans, capacity, Golden Beans, Compost, or prerequisite state.
- Furniture buttons explain missing Beans or unlocked state.
- Ability buttons explain cooldowns or missing Squeaks.
- Recipe, Mythos, Wisdom, and Prestige buttons explain missing resources or already-active state.
- Reason text fits inside modal buttons on desktop and mobile.
- Enabled buttons still emphasize their cost or action status.

Implementation notes:

- Prefer updating existing `strong` status fields over adding new layout complexity.
- Centralize status text helpers in `Hud` where possible so disabled logic and reason text stay aligned.

### PB-005: Upgrade Purchase Ceremony

Priority: P1

Status: First pass implemented.

Description: Buying upgrades should produce a satisfying moment in the UI and cage. Purchases currently update state, but they should also briefly animate the button and the related cage object so players notice what changed.

Acceptance criteria:

- Successful purchases pulse the clicked button or show a small success flash.
- Better Hay, Better Scoop, Bigger Cage, Roomba, and furniture purchases trigger a brief cage-side visual response.
- Purchased/upgraded cage objects briefly glow, bounce, or emit a small sparkle.
- The modal remains usable after the animation and does not steal focus unexpectedly.
- Failed purchase attempts do not play success effects.

Implementation notes:

- Add a lightweight action result channel or event queue from `Hud.runAction()` to `GameScene` only if needed.
- For first pass, DOM button animation plus existing cage object pulse is enough.

### PB-006: Cleanliness Visual States

Priority: P1

Status: First pass implemented.

Description: Make cage cleanliness visible inside the playfield. The care strip shows a cleanliness number, but the cage should also communicate mess through bedding color, stain overlays, or localized dirty patches.

Acceptance criteria:

- Clean cage, moderate mess, and severe mess each have distinct visual states.
- Low cleanliness subtly darkens or stains the bedding without hiding beans.
- Mess pile areas feel dirtier than clean areas when possible.
- Cleaning beans or using cleaning abilities improves the visible state quickly.
- Visual state changes are smooth enough to avoid abrupt flashes.

Implementation notes:

- Start with a transparent overlay or tint based on `state.cage.cleanliness`.
- Add local dirty decals later if global tint is too blunt.
- Keep bean contrast high at all cleanliness levels.

### PB-007: Hay And Water Visual States

Priority: P2

Status: First pass implemented.

Description: Show hay and water levels directly in the cage, not only in meters. The hay rack and water bottle should visually change as resources fall, making upkeep easier to read at a glance.

Acceptance criteria:

- Hay has full, low, and empty visual states.
- Water has full, low, and empty visual states.
- Empty or critically low states are readable even when the care strip is not the focus.
- Refilling hay/water updates the cage visuals immediately.
- Visual changes reuse existing assets where possible before requiring new art.

Implementation notes:

- Existing full hay rack and water bottle sprites can be tinted, cropped, or swapped for first pass.
- Future art requests should add `hay_rack_low`, `hay_rack_empty`, `water_bottle_low`, and `water_bottle_empty`.

### PB-008: Sprite Depth And Shadow Pass

Priority: P2

Status: First pass implemented.

Description: Add soft shadows and consistent depth treatment to pigs, beans, decor, and upgrade sprites. This will help the cage read as a single coherent scene instead of separate pasted sprites.

Acceptance criteria:

- Pigs, beans, placed furniture, hay, water, and upgrade decor have subtle shadows.
- Shadows scale appropriately for small beans and larger objects.
- Shadows do not reduce click accuracy or obscure cleanup targets.
- The treatment is consistent across existing sprite categories.

Implementation notes:

- Prefer Phaser drop-shadow sprites/ellipses under objects instead of expensive filters.
- Sort depth so shadows stay below objects and all click targets remain accessible.

### PB-009: Ambient Cage Detail Pass

Priority: P2

Status: First pass implemented.

Description: Add small environmental details that make the cage feel hand-built and cozy: fleece stitching, loose hay strands, chew marks, rim highlights, and a few soft bedding variations.

Acceptance criteria:

- The cage has subtle non-interactive details that do not compete with beans.
- Details are sparse and tile-friendly across cage sizes.
- The cage rim and bedding feel more dimensional.
- The pass does not introduce fake objects that look clickable.

Implementation notes:

- Keep most detail baked into background/rim rendering.
- Avoid adding many independent sprites unless they are reused decor assets.

### PB-010: Modal Header Icons And Section Theming

Priority: P2

Status: First pass implemented.

Description: Give each modal section a stronger identity by adding the same graphic used in the dock to the modal header. The current modal is functional, but headers should reinforce where the player is.

Acceptance criteria:

- Each modal header shows an icon matching its dock button.
- Modal titles remain readable and aligned on mobile.
- The selected dock button and modal header feel visually connected.
- No modal content is pushed below the fold unnecessarily.

Implementation notes:

- Add a single modal header icon element and update it from `Hud.openSection()`.
- Store section icon paths in the same map as section titles.

### PB-011: Clean Streak And Combo Feedback

Priority: P1

Status: First pass implemented.

Description: Make clean streaks more exciting. The existing streak counter should pulse, bounce, or brighten when the combo increases, and the cage should show a short burst when a streak reward triggers.

Acceptance criteria:

- The streak stat animates when the combo count increases.
- Higher streaks use stronger but still brief feedback.
- Combo timeout or reset is visually clear without feeling punitive.
- Streak feedback works with rapid multi-cleaning and mess pile cleanup.

Implementation notes:

- Track previous combo count in `Hud.render()` to detect increases.
- Use CSS animation for the topbar stat and Phaser particles for cage-side reward bursts.

### PB-012: Event Readiness Callouts

Priority: P1

Status: First pass implemented.

Description: Events should be hard to miss when they require a response. The status line already says an event is active, but the Care dock button and Event buttons should visibly call for attention.

Acceptance criteria:

- When `state.event.active` and `responseReady` are true, the Care dock button shows a badge or pulse.
- Both quick Event and modal Event buttons use an attention state while enabled.
- Responding to the event clears the attention state immediately.
- Active but not-yet-ready events have a calmer state that does not imply action is available.

Implementation notes:

- Build on PB-003 badge infrastructure if implemented first.
- Keep pulse animation disabled under reduced-motion settings.

### PB-013: Cozy Sound Effects And Mute Toggle

Priority: P2

Status: First pass implemented.

Description: Add a small sound layer for repeated actions: cleanup, button click, pig squeak, upgrade purchase, event response, and modal open/close. Sound must be optional and easy to mute.

Acceptance criteria:

- Sound effects exist for bean cleanup, purchase, ability use, event response, and modal open/close.
- A mute toggle is available and persists for the session.
- Sounds are short, soft, and do not stack into noise during rapid cleanup.
- The game behaves normally if audio fails to load or the browser blocks autoplay.

Implementation notes:

- Start with a lightweight audio manager.
- Only play sound after user interaction to avoid autoplay restrictions.
- Use placeholder generated/royalty-free effects until final audio is chosen.

### PB-014: Dock Hover, Press, And Selected States

Priority: P2

Status: First pass implemented.

Description: Polish the bottom dock interaction states so it feels more like a game control surface. Buttons should clearly respond to hover, press, keyboard focus, and active modal state.

Acceptance criteria:

- Hover and press states animate the icon and not just the button background.
- Keyboard focus is visible and consistent with mouse focus.
- The active modal's dock button stays selected until the modal closes.
- States work on mobile where hover is unavailable.
- Text labels do not shift or overflow during state changes.

Implementation notes:

- Add CSS-only transitions first.
- Do not increase dock height during interaction.

### PB-015: Pig Reactions To Player Actions

Priority: P2

Status: First pass implemented.

Description: Add small pig reactions when the player cleans nearby beans, clicks near a pig, buys furniture, or triggers abilities. These reactions should make pigs feel aware of the player's actions.

Acceptance criteria:

- Cleaning a bean near a pig can trigger a short look, hop, squeak, or thought bubble.
- Clicking near a pig gives a harmless reaction without interrupting cleanup.
- Furniture purchases can attract nearby pigs briefly.
- Abilities create a visible herd reaction when appropriate.
- Reactions are rate-limited to avoid constant noise.

Implementation notes:

- Use distance checks in `GameScene` against pig positions.
- Keep reactions cosmetic so they do not disrupt production tuning.

### PB-016: Available-Now Highlighting In Modals

Priority: P2

Status: First pass implemented.

Description: Make actionable items easier to find inside modals. Available purchases and usable abilities should be visually highlighted or sorted above unavailable options.

Acceptance criteria:

- Enabled action buttons are visibly easier to scan than disabled buttons.
- Optional: available actions appear before unavailable actions within the same section.
- Sorting, if used, does not make buttons jump while the player is about to click.
- Locked/already-active states remain understandable.

Implementation notes:

- Start with highlight styling only.
- Consider sorting later if modal sections become too long.

### PB-017: Empty States For Herd, Goals, And Log

Priority: P3

Status: First pass implemented.

Description: Add friendly empty or low-content states to read-only sections. These modals should feel intentional even when there are few pigs, no new achievements, or a short log.

Acceptance criteria:

- Herd has a friendly description when only the starting bonded pair is present.
- Goals/Achievements explain what to do next when lists are short or complete.
- Cage Log has an empty state before meaningful entries exist.
- Empty states do not replace real list content once available.

Implementation notes:

- Implement in `Hud.render()` where roster, milestones, and log children are replaced.
- Keep copy short and in the existing game voice.

### PB-018: First-Run Tutorial Sequence

Priority: P2

Status: First pass implemented.

Description: Add a compact first-run tutorial for the earliest loop: clean a bean, refill care, open the shop, and buy the first upgrade. The tutorial should guide without blocking experimentation.

Acceptance criteria:

- The first-time player gets 3-4 short prompts tied to real actions.
- Prompts advance only when the player performs the relevant action.
- The tutorial can be dismissed or completed without returning.
- Prompts do not cover the center of the cage or block cleanup.
- Existing players can ignore the tutorial if persistence is added later.

Implementation notes:

- Use transient DOM hints near the relevant control or cage area.
- Store only session-level completion until save persistence exists.

### PB-019: Save And Load Indicator

Priority: P3

Description: When persistence is added or confirmed, show a small `Saved` indicator after meaningful state changes. Players should trust that progress is not lost without adding a large UI surface.

Acceptance criteria:

- A small saved indicator appears after state is persisted.
- The indicator does not appear for every animation-only render.
- Save errors, if detectable, show a calm warning.
- The indicator is hidden or deferred if no persistence system exists yet.

Implementation notes:

- This ticket depends on a real save/load implementation.
- If save/load is not in scope, leave this ticket blocked rather than faking persistence.

### PB-020: Keyboard Shortcuts For Section Dock

Priority: P3

Status: First pass implemented.

Description: Add keyboard shortcuts for opening modal sections and closing the modal. Escape already closes the modal through native dialog behavior; the dock should also be reachable through predictable keys.

Acceptance criteria:

- Number keys or another documented internal mapping open the primary dock sections.
- Escape closes the modal and returns focus to the launcher.
- Shortcuts do not fire while typing in future text inputs.
- Keyboard focus remains visible and predictable after using shortcuts.

Implementation notes:

- Add keydown handling in `Hud` or a small input helper.
- Do not add visible shortcut text to every button unless the UI has room.
