# Feature Progress

## Implemented

- Pig identity basics: names, breeds, traits, favorite foods, quirks, and roster display.
- Special poop types: Normal, Golden, Compost, Stinky, Blessed, Mega, Mystery, Hay, Royal, and Cursed beans with distinct values, visuals, and log messages.
- Cleanliness loop: poop lowers cage cleanliness, and low needs/cleanliness affect pig mood, production, and status bubbles.
- Automation: Poop Roomba is unlocked from the Tech Tree, then fueled and directed from Furniture.
- Combo cleaning: quick consecutive cleanups build a timed Clean Streak and award bonus Beans.
- Contracts and records: Contracts drive active short-term goals, while quest and achievement milestones live as Records in the Log.
- Funny cage log: milestone, cleanup, pig, resource, and automation messages surface game personality.
- Expanded breeds and traits: Skinny Pig, Silkie, Crested, Royal Pig, Shy Beaner, Hay Goblin, Drama Pig, and Compost Mystic are now in the pig generator.
- Cage zones: fixed Hay Area, Tunnel Zone, Litter Tray corner, Hidey Zone, and Play/Compost areas now influence targeting, movement, cleanliness, and aging.
- Tech Tree: One always-visible dock button opens a branch-based progression map for run unlocks, levelled upgrades, recipes, automation access, abilities, and permanent Wisdom Legacy nodes.
- Cage furniture: Hidey House, Tunnel, Litter Tray, Chew Toy, Snuggle Sack, Cardboard Castle, and Royal Throne are one-time static Tech Tree unlocks with distinct buffs.
- Furniture synergies: matching static furniture pairs now unlock combo bonuses for comfort, Zoomies, cleanup automation, and royal/compost strategy.
- Additional needs/resources: Enrichment, Socialization, Space, Compost, Squeaks, Golden Beans, and Cavy Wisdom are tracked.
- Random events: Zoomies, Hay Frenzy, Nap Time, Bottle Jam, Cage Inspection, Compost Bloom, and The Great Wheeking can trigger with three response choices each.
- Pig requests: one pig at a time can ask for a short-lived favor tied to care, cleanup, abilities, furniture, combo, or Compost.
- Pig social mechanics: bonded pairs are assigned as pigs join, and herd size contributes socialization.
- Weighted pig lifecycle: pigs now choose between roaming, seeking hay/water, sleeping, social play, and furniture play through tunable simulation weights with urgent hunger/thirst overrides, then leave consume/rest actions after a short satisfied-action timer.
- Dev constants editor: local Vite dev servers expose `/constants` for source-backed tuning of selected scalar literals in `src/simulation/balance.ts`; saves rewrite the source file and production builds do not serve the route.
- Active abilities: Wheek Call, Treat Bag, Deep Clean, Fresh Bedding, Snack Time, and Zoomie Mode unlock from the Tech Tree, then remain operational cooldown actions in Abilities.
- Rare/legendary pigs: legendary pig adoption uses Beans plus Golden Beans and creates stronger named pigs.
- Prestige: The Great Composting soft-resets the run, previews gained Wisdom, and feeds the Tech Tree's permanent Wisdom Legacy branch.
- Wisdom specializations: after tier-3 Wisdom, the player chooses one permanent Caretaker Philosophy: Gentle Care, Automation Steward, or Rare Bean Alchemy.
- Late-game systems: Hay Dimension is now a Better Hay capstone, Squeak Choir is folded into Chorus Training Wisdom, Cavy Council seats automatically from herd size, Golden Scoop turns cleanup into a run-limited magnet tool, and Bean Singularity now lives as the repeatable Singularity Experiment recipe; Bean Exchange remains the rare-resource trade track.
- Interop pass: Static furniture buffs affect care, movement, herd support, automation, and rare bean odds; stronger abilities spend Squeaks, Compost can fuel automation overdrive, rare bean recipes unlock cross-system bonuses, events are weighted by cage state, and Cavy Wisdom feeds branching permanent Tech Tree perks.
- Cage ecology: Fixed zones now track mess, comfort, traffic, appeal, pig occupants, and next actions; pigs have favorite zones and stress, and habitat pressure affects happiness, movement, production, bean odds, events, and requests.
- Automation directives: Roomba and Litter Tray can be switched between Balanced Sweep, Protect Cleanliness, Litter Focus, and Rare Guard modes from the Furniture modal, where Fuel Automation also lives.
- Furniture care: Owned furniture now tracks condition, can become well-loved or overworked, and can be tended from the Furniture modal for zone and automation benefits.
- Progressive mechanics reveal: Fresh runs show Care, Shop, Tech Tree, Herd, Goals, and Log; Furniture, Abilities, Recipes, Habitat Care, automation operations, and Caretaker Philosophy reveal when progress makes them actionable.
- Contract-led progression campaign: Intro Contracts now pace major mechanic reveals for Furniture, Abilities, Recipes, Automation, and Wisdom before ordinary rotating offers take over.

## Current Progression Records

- Clean 10 beans.
- Reach 100 Beans.
- Adopt a second pig.
- Unlock Better Scoop.
- Hit Clean Streak x5.
- Unlock Poop Roomba.
- Add cage furniture.
- Clean 5 rare beans.
- Use an active ability.
- Adopt a legendary pig.
- Enter the Great Composting.

## Current Achievement Records

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

- Cage zones now have derived ecology, but they are still fixed regions rather than player-placeable tiles.
- Furniture is auto-placed at fixed locations as one-time unlocks, not freely placed with footprints.
- Random events are ecology-weighted and interactive, but not yet driven by quest chains or event decks.
- Wisdom perks now live in the Tech Tree's Wisdom Legacy branch with prerequisites and a mutually exclusive Caretaker Philosophy layer.
- Late-game systems now live inside their owning sections, but they can still gain deeper section-level interactions later.
- Minigames are still intentionally deferred until the main loop has more tuning data.

## Design Decisions Needed Later

- Whether cage zones should remain fixed regions or eventually support tile painting.
- Whether special poop aging should reward waiting more aggressively or mostly punish mess.
- Whether current Squeak ability costs should scale with repeated use or stay flat.
- Whether Caretaker Philosophies should become per-run choices or remain permanent save-wide identity.

## Core Loop Improvement Queue

- [x] Make poop placement matter more through stronger zone effects, litter tray auto-cleaning, compost aging, and clustered mess.
- [x] Convert furniture into static one-time unlocks with fixed cage locations.
- [x] Make pig personalities visibly drive behavior and preferred targets.
- [x] Add mess piles that form from clustered poops and require multiple cleans.
- [x] Add a visible happiness meter connected to cleanliness, needs, enrichment, socialization, and space.
- [x] Replace rotating short-term objectives with an optional Contracts Board beyond static quests.
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
- Contracts provide timed multi-step care jobs with visible requirements, rewards, and system-specific progress.
- Intro Contracts prioritize the next unrevealed system, then ordinary Contract offers fill the remaining slots without duplicating templates.
- Active events expose three Care-modal response choices with light resource tradeoffs.
- Early costs and initial poop timing were lowered to hit the first upgrades and second pig sooner.
- Fixed cage zones now create ecology pressure: dirty, crowded, or uncomfortable zones can stress pigs and surface habitat actions in the Furniture modal.
- Pig favorite zones and stress make individual pigs respond differently to the same cage state; comfortable favorite zones slightly improve output, while stress slows production and raises messy outcomes.
- Ecology incidents such as Litter Revolt, Hidey Squabble, and Zoomie Traffic reuse the event response UI with zone-specific tradeoffs.
- Pig lifecycle choices now distinguish seeking from acting: hungry or thirsty pigs travel to the hay rack or water bottle before consuming, while play-seeking pigs look for a partner before falling back to play furniture or the Play Run.
- Active lifecycle statuses now surface as periodic over-pig thought bubbles instead of pig sprite color shifts.

## Systems Backlog Tickets

Status default: not started. These tickets should deepen system interdependence while keeping the cage, pigs, and cozy management loop at the center.

### SYS-001: Habitat Stewardship

Status: First pass implemented.

Description: Turn fixed ecology zones into player-tended habitat areas with contextual actions, short cooldowns, and visible zone improvements.

Acceptance criteria:

- Zone rows show actionable stewardship controls.
- Stewardship actions affect comfort, appeal, pig stress, care resources, or cleanup.
- Effects are visible in the Furniture modal, status line, cage log, and scene feedback.
- Old saves hydrate safely when stewardship state is missing.

### SYS-002: Pig Relationship Web

Status: Not started.

Description: Expand bonded pairs into lightweight herd relationships such as buddies, nap partners, shy followers, and rivals.

Acceptance criteria:

- Relationships affect socialization, requests, stress, and zone preferences.
- The Herd modal explains each visible relationship state.
- At least one request or event uses relationship state.

### SYS-003: Furniture Wear And Care

Status: First pass implemented.

Description: Let high-use furniture become overworked or well-loved, creating care tasks without harsh durability failure.

Acceptance criteria:

- Furniture can gain positive or negative condition states.
- Condition affects ecology, pig behavior, or automation.
- Modal copy explains upkeep and current condition.
- Tending restores or improves furniture condition.

### SYS-004: Event Chains

Status: Not started.

Description: Upgrade random events into short stateful arcs where choices influence later event weights and rewards.

Acceptance criteria:

- At least one multi-step event chain exists.
- Prior choices alter follow-up choices, weights, or rewards.
- Goals or Log surface chain progress.
- Ordinary events still work without entering a chain.

### SYS-005: Bean Orders Or Contracts

Status: First pass implemented.

Description: Add optional orders that ask for specific cleanup, rare bean, combo, or care outcomes.

Acceptance criteria:

- Contracts have clear requirements and rewards.
- Contracts connect cleanup, refills, ecology, furniture care, automation, rare beans, abilities, or recipes.
- Completion feedback appears in HUD and Log.

### SYS-006: Automation Directives

Status: First pass implemented.

Description: Give Roomba and Litter Tray simple selectable priorities, such as protect cleanliness, clear litter, or preserve rare beans.

Acceptance criteria:

- Automation has at least three modes.
- Mode changes affect targeting behavior.
- UI shows the current directive.
- Mode choice has visible tradeoffs.

### SYS-007: Recipe Families

Status: Not started.

Description: Group recipes into strategic families that reward particular cage styles, such as Compost Care, Royal Herd, or Gentle Automation.

Acceptance criteria:

- Recipe families track progress.
- At least one family bonus affects events, requests, or rare odds.
- Recipes modal explains each family direction.

### SYS-008: Wisdom Specializations

Status: First pass implemented.

Description: Add late-Wisdom caretaker philosophies that flavor future runs after the current tree is learned.

Acceptance criteria:

- Specializations unlock after tier-3 Wisdom.
- Choices provide distinct permanent bonuses.
- Prestige or the Tech Tree explains the tradeoff.

### SYS-009: Tech Tree Progression Map

Status: First pass implemented.

Description: Centralize one-time run unlocks and permanent Wisdom into a single progression tree while keeping repeatable operations in their existing gameplay sections.

Acceptance criteria:

- Tech Tree is visible from a fresh run as the progression map.
- Shop, Furniture, Recipes, and Wisdom no longer expose duplicate permanent unlock purchase buttons.
- Existing owned upgrades, furniture, recipes, late-game flags, Wisdom perks, and philosophies derive completed Tech Tree nodes from current save state.
- Multi-level tech nodes must be fully completed before child nodes unlock.
- New tech levels visibly affect care drain, cleaning combos, furniture care, habitat tending, automation, rare odds, abilities, and Singularity runs.
- Unlocks produce HUD state, cage log text, modal state changes, and scene feedback.

### No-Orphan-System Checklist

Status: Active design rule.

Every retained or new system should connect to at least two of Contracts, pig requests, events, habitat, automation, rare bean recipes, Wisdom, Log, or cage visuals, and it should produce visible HUD, modal, Log, or scene feedback.

Advanced systems also need a reveal trigger. Do not put a dormant late-game surface on the fresh-run dock unless it gives the player an immediate decision.

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
- Use simple sprite scale/rotation changes plus short-lived thought bubbles before adding new animation frames; avoid pig color shifts for lifecycle status.
- Use short-lived Phaser image or text objects for bubbles.

### PB-003: Dock Badges And Availability Indicators

Priority: P1

Status: First pass implemented.

Description: Add small badges to the bottom section dock so players know where attention is needed. The dock should surface available purchases, usable abilities, Contract updates, event readiness, and new log entries without reopening every modal.

Acceptance criteria:

- Care shows a badge or pulse when hay/water is low or an event response is ready.
- Shop/Furniture/Recipes/Tech Tree show availability when at least one visible action can be purchased, unlocked, or used.
- Abilities shows availability when at least one ability can be used.
- Goals shows a marker when Contract progress changes meaningfully.
- Log shows a marker for new entries or milestone Records since the last time the log modal was opened.
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

- Shop buttons explain missing Beans, capacity, Golden Beans, Compost, or prerequisite state for operational actions.
- Tech Tree nodes explain missing resources, incomplete prerequisites, current level, or already-active state.
- Ability buttons explain cooldowns or missing Squeaks.
- Recipe, late-game, Tech Tree, Wisdom Legacy, and Prestige buttons explain missing resources, prerequisites, or already-active state.
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

Description: Add friendly empty or low-content states to read-only sections. These modals should feel intentional even when there are few pigs, no Records, or a short log.

Acceptance criteria:

- Herd has a friendly description when only the starting bonded pair is present.
- Goals/Contracts and Log Records explain what to do next when lists are short or complete.
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

Status: First pass implemented.

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

### PB-021: First-Clean Ceremony

Priority: P1

Status: First pass implemented.

Description: Make the first successful bean cleanup feel like the moment the game begins. The current cleanup feedback is functional, but the very first clean should teach the economy with a slightly stronger pop, reward label, burst, and sound treatment.

Acceptance criteria:

- The first successful bean clean plays a distinct but brief ceremony.
- The ceremony uses existing cleanup state and does not duplicate reward calculations outside the simulation layer.
- Normal cleanup after the first bean remains fast and readable.
- Rare beans still have stronger feedback than normal beans.
- Reduced-motion users receive clear reward text without burst-heavy animation.

Implementation notes:

- Implement in `src/scenes/GameScene.ts` around `playCleanFeedback()` and `playBeanPop()`.
- Detect the first successful clean from existing `state.stats.cleanedPoops` / `CleanResult` timing.
- Add small local constants for first-clean burst size, label scale, and animation duration.
- Keep all resource updates in `cleanAtWithResult()` and only add view-layer ceremony here.

### PB-022: Cleanup Feedback Budgeting

Priority: P1

Status: First pass implemented.

Description: Keep rapid cleanup readable by limiting floating labels, bursts, and pop effects when several beans or mess piles are cleaned quickly. Polish should add juice without creating visual noise.

Acceptance criteria:

- Floating reward labels are capped or staggered during rapid cleanup.
- Reward labels clamp inside cage bounds and do not leave the visible playfield.
- Mess piles and multi-clean actions summarize or prioritize feedback instead of spawning excessive clutter.
- Cleanup still feels responsive when many beans are clicked quickly.
- Performance remains stable during dense mess cleanup.

Implementation notes:

- Add a small active-label tracker in `GameScene`.
- Consider helper functions such as `clampFeedbackPoint()` and `canShowFloatingLabel()`.
- Keep particle counts small and scale them by bean rarity rather than cleaned count alone.

### PB-023: Contract Progress Pulse

Priority: P1

Status: First pass implemented.

Description: Make contract progress visibly respond when player actions advance it. The quick contract card should pulse or brighten when requirements advance or a contract completes.

Acceptance criteria:

- The quick contract title or progress text animates when contract progress changes.
- The top contract row in the Goals modal remains accurate after the pulse.
- Contract completion uses a stronger but still short feedback state.
- The animation does not resize or shift the care strip.
- Reduced-motion settings avoid bounce/scale-heavy effects.

Implementation notes:

- Track a previous contract signature in `src/ui/hud.ts`, similar to `updateGoalAndLogMarkers()`.
- Reuse the existing `pulseElement()` helper pattern.
- Add CSS for a reusable pulse class in `src/styles.css`.

### PB-024: Tutorial Hint As Game Prompt

Priority: P1

Status: First pass implemented.

Description: Restyle the first-run tutorial hint so it feels like an authored in-game prompt attached to the cage, not a generic toast card. The prompt should guide the first cleanup without blocking beans, pigs, or clicks.

Acceptance criteria:

- The first tutorial prompt feels visually connected to the playfield.
- The prompt does not cover important cleanup targets on desktop or mobile.
- The dismiss button remains clickable while the hint body does not block playfield input.
- Prompt copy remains short and readable at narrow widths.
- Tutorial progression behavior remains unchanged.

Implementation notes:

- Keep behavior in `src/ui/tutorialController.ts`; make most changes in `src/styles.css`.
- Continue using `#tutorial-hint`, `#tutorial-hint-text`, and `#tutorial-dismiss`.
- Preserve `pointer-events: none` for the hint body and `pointer-events: auto` for dismiss.

### PB-025: HUD Stat Hierarchy

Priority: P1

Status: First pass implemented.

Description: Rework the top stat bar so fresh-run priorities are obvious. Early-loop information like Beans, Pigs, Clean, and Streak should read stronger than dormant late-game counters.

Acceptance criteria:

- Fresh runs emphasize Beans, Pigs, Clean, and Streak.
- Compost, Squeaks, Gold, Wisdom, and Furniture read quieter while they are zero or not yet central.
- Cleanliness receives a warning state at low thresholds.
- Active streaks receive a positive/energized state.
- Stat cards remain stable and do not overflow on desktop or mobile.

Implementation notes:

- Add stable stat classes or data attributes in `index.html`.
- Add helper logic in `src/ui/hud.ts`, such as `updateStatEmphasis()`.
- Prefer CSS emphasis/opacity/state changes over hiding stats or reordering them every render.

### PB-026: Cage Frame Staging

Priority: P1

Status: First pass implemented.

Description: Make the cage feel like the intentionally staged centerpiece of the screen. The current cage art is strong, but the canvas wrapper and outer beige area should feel more deliberate and less like unused background.

Acceptance criteria:

- The cage reads as the main object at first glance.
- The outer canvas area has a warmer, more intentional frame treatment.
- The frame does not reduce click accuracy or hide beans.
- Desktop and mobile layouts keep the cage comfortably visible.
- The canvas wrapper does not shift size during ordinary HUD updates.

Implementation notes:

- Tune `#canvas-wrap` and related layout rules in `src/styles.css`.
- Adjust only `GameScene.resize()` if CSS framing cannot solve the visual balance.
- Capture before/after screenshots at desktop and narrow widths.

### PB-027: Dimensional Cage Rendering

Priority: P2

Status: First pass implemented.

Description: Add subtle dimension to the Phaser-rendered cage so the rim, bedding, shadows, and ambient details feel cohesive with the pig and bean sprites.

Acceptance criteria:

- Cage rim has a readable highlight and shadow treatment.
- Bedding has subtle inner shadow or depth without reducing bean contrast.
- Ambient details remain sparse and non-clickable.
- Clean, moderate, and dirty cage states still remain distinct.
- Pigs, beans, hay, water, and decor share a consistent depth language.

Implementation notes:

- Implement in `src/scenes/GameScene.ts` around `drawCage()`, `redrawCage()`, and `drawAmbientCageDetails()`.
- Keep new details below interactive sprites in depth.
- Avoid expensive filters; prefer Phaser graphics and simple shadow ellipses.

### PB-028: Dock State Language

Priority: P1

Status: First pass implemented.

Description: Make dock button states communicate clear meaning: urgent attention, available actions, selected modal, and quiet/locked states should not all look like the same badge treatment.

Acceptance criteria:

- Urgent care, events, and pig requests use an attention state distinct from ordinary availability.
- Purchasable or usable sections can show count badges without looking like errors.
- The active modal's dock button remains selected until the modal closes.
- Hover, press, selected, and badge states do not increase dock height.
- Mobile horizontal dock scrolling does not clip badges.

Implementation notes:

- Build on `updateSectionIndicators()` and `setBadge()` in `src/ui/hud.ts`.
- Add selected-state handling in `openSection()` and dialog close logic.
- Refine `.dock-button`, `.dock-alert`, `.attention`, `.available-now`, and `.dock-badge` in `src/styles.css`.

### PB-029: Modal Scan States

Priority: P2

Status: First pass implemented.

Description: Make modal content faster to scan once opened. Available actions, disabled actions, purchased states, and empty sections should each have distinct visual treatment.

Acceptance criteria:

- Enabled action buttons are visually easier to find than disabled actions.
- Disabled actions keep reason text visible in their existing status fields.
- Purchased or completed rows use a calm completed state.
- Herd, Goals, and Log sections have intentional early/empty states.
- Modal content does not jump under the cursor while the player is deciding.

Implementation notes:

- Continue using existing modal panels and `SECTION_META` in `src/ui/hud.ts`.
- Prefer highlight styling before adding sorting.
- Keep reason text aligned with existing disabled logic and status helpers.

### PB-030: Polishing Verification Harness

Priority: P2

Status: First pass implemented.

Description: Add a repeatable lightweight verification workflow for polish slices. Visual changes need quick build, browser, console, screenshot, and interaction checks so regressions are caught before the next pass.

Acceptance criteria:

- A documented command or script verifies the page title, canvas presence, and lack of console errors.
- The workflow opens or targets the strict local review port for this checkout.
- Desktop and narrow/mobile screenshots are captured after visual polish changes.
- The smoke path includes cleaning a bean, refilling hay/water, opening a modal, closing it, and checking save status.
- Verification remains short enough to run after each polish slice.

Implementation notes:

- Keep the checklist in [POLISHING_PLAN.md](POLISHING_PLAN.md) as the human-readable source.
- If automated, add a small Playwright script under `scripts/`.
- Use strict Vite port `5176` for this checkout unless it is intentionally changed.

### PB-031: Sound And Microinteraction Throttle

Priority: P2

Status: First pass implemented.

Description: Refine repeated action sounds and button microinteractions so the game feels warm without becoming noisy during rapid cleanup or modal use.

Acceptance criteria:

- Cleanup, rare cleanup, purchase, ability, modal, and pig sounds remain short and soft.
- Rapid cleanup does not stack sounds aggressively.
- Successful DOM actions receive press/purchase feedback only on success.
- Mute remains easy to reach and continues to persist through the existing preference flow.
- The game behaves normally if audio is blocked or unavailable.

Implementation notes:

- Build on `src/ui/audioManager.ts`, `src/ui/events.ts`, and `Hud.runAction()`.
- Add throttling inside the audio manager rather than scattering timing checks across callers.
- Keep visual button feedback tied to action success paths.
