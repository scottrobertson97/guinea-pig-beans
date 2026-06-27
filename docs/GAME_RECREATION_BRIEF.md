# Guinea Pig Beans Recreation Brief

This brief describes what Guinea Pig Beans is and how to recreate it from scratch. It is written for a future coding agent that may not have access to this repository. Treat it as the full product outline, system spec, and implementation roadmap.

For the current repo, the deeper reference files are:

- [DESIGN_DOC.md](DESIGN_DOC.md) for detailed current rules.
- [FEATURE_PROGRESS.md](FEATURE_PROGRESS.md) for implemented systems and backlog status.
- [OUTLINE.md](OUTLINE.md) for the original concept.
- [ART_ASSET_PLAN.md](ART_ASSET_PLAN.md) for asset direction.

## One-Sentence Pitch

Guinea Pig Beans is a cozy incremental management game where named guinea pigs wander around a cage, produce little "beans," and the player cleans those beans to grow a stranger, happier, more automated, more mythic guinea pig habitat.

## Core Identity

The game is not a pure clicker and not a harsh survival sim. It is a cozy management game with an incremental spine.

The player fantasy is:

- Be the caretaker of a growing guinea pig herd.
- Watch individual pigs roam, eat, drink, sleep, play, bond, and make messes.
- Clean beans for currency and rare resources.
- Use those resources to improve care, cage size, furniture, automation, abilities, recipes, and permanent Wisdom.
- Turn a tiny cage into an absurd, optimized, mythic cavy habitat.

The emotional arc is:

```text
cute -> messy -> optimized -> absurd -> mythic
```

The central joke must stay concrete:

```text
guinea pigs wander -> guinea pigs make beans -> player cleans beans -> beans become progress
```

The design should feel warm, funny, and slightly unhinged, but never mean-spirited. Neglect may create pressure and even pig loss, but the game must preserve recovery paths and a cozy management tone.

## Target Platform And Stack

The current implementation is a browser game with:

- Phaser 3 for the cage scene, sprites, animation, pointer input, and visual feedback.
- TypeScript for all game logic.
- Vite for local dev and static production builds.
- A DOM HUD layered around the Phaser canvas.
- `localStorage` persistence using save key `gpb-save-v1`.

The game should be deployable as static files. The current production build is Vite `dist/`, with GitHub Pages as the expected hosting target.

Recommended recreation stack:

```text
Phaser 3 + TypeScript + Vite
```

Core commands:

```bash
npm run dev
npm run build
npm run preview
```

The current preferred local verification port is:

```text
http://127.0.0.1:5176/
```

## Primary Screen

The first screen should be the game itself, not a landing page.

The screen is made of:

- A top bar with title, status line, save state, reset, sound toggle, and resource stats.
- A central cage playfield rendered in Phaser.
- A visible care strip with Hay, Water, Happiness, and the current Contract prompt.
- A dock of section buttons that open modal panels.
- A modal shell for deeper controls, shops, roster, goals, and log.

The cage is the star. Every major system should eventually show up through cage behavior, visible objects, pig motion, bean cleanup, HUD state, modal copy, log entries, or scene feedback.

## Fresh-Run Screen State

A fresh run should start with:

- 2 guinea pigs, entering as a bonded pair.
- 0 Beans.
- 0 Compost.
- 0 Squeaks.
- 0 Golden Beans.
- 0 Cavy Wisdom.
- Full Hay.
- Full Water.
- 100% Cleanliness.
- About 86% Happiness.
- No furniture.
- No robot.
- No recipes.
- No mythic systems.
- Fresh Contract offers in Goals.
- Pig Welcome cards in Herd.

Fresh-run dock sections:

- Care
- Shop
- Tech Tree
- Herd
- Goals
- Log

Advanced dock sections reveal later when they become actionable:

- Furniture
- Abilities
- Recipes

Do not expose dormant late-game systems at the start. Reveal systems when progress, resources, accepted Contracts, or cage pressure give the player a real reason to use them.

## Main Gameplay Loop

The loop is:

1. Pigs wander the cage.
2. Pigs produce beans near their positions.
3. Beans lower cleanliness while they remain in the cage.
4. The player clicks beans to clean them.
5. Cleaning awards Beans and sometimes rare resources.
6. Fast repeated cleaning builds a Clean Streak and bonus Beans.
7. Beans and rare resources buy Tech Tree unlocks, pigs, abilities, recipes, automation, and support systems.
8. Better care and support improve production, rare odds, and happiness.
9. More pigs and better systems create more mess, more opportunities, and deeper management decisions.

The loop creates soft tension between:

- Cleaning immediately to protect cleanliness and happiness.
- Letting some beans age or cluster for higher value.
- Growing the herd versus improving support.
- Spending on production versus spending on automation and care.
- Preserving rare beans for manual cleanup versus allowing automation to sweep.

## Resources

### Beans

Beans are the main currency. They come mostly from cleaning beans in the cage.

Use Beans for:

- Pig adoption.
- Tech Tree unlocks.
- Basic upgrades.
- Some event choices.
- Late-game exchange paths.

Lifetime Beans also drive Great Composting prestige progress.

### Compost

Compost is a secondary resource from compost beans, events, requests, recipes, and exchange.

Use Compost for:

- Automation fuel.
- Habitat and furniture care costs.
- Compost Catalyst.
- Singularity Experiment.
- Bean Exchange trades.

### Squeaks

Squeaks are the active-ability resource. They come from blessed beans, Wheek Call, requests, events, and late-game choir support.

Use Squeaks for:

- Active abilities.
- Bean Recipes.
- Event choices.
- Bean Exchange trades.

### Golden Beans

Golden Beans are rare currency from golden beans and late-game effects.

Use Golden Beans for:

- Legendary pig adoption.
- Rare recipes.
- Bean Exchange.
- Golden Scoop.

### Cavy Wisdom

Cavy Wisdom is the prestige currency gained by Great Composting.

Use Wisdom for permanent Tech Tree nodes and Caretaker Philosophy choices.

### Hay And Water

Hay and Water are visible shared supplies and individual pig need targets.

They should:

- Drain gradually based on herd size.
- Be refillable from the care strip and Care modal.
- Affect hunger, thirst, happiness, and production speed.
- Create pressure without feeling like constant punishment.

### Cleanliness

Cleanliness is derived from current bean load and bean types.

It affects:

- Happiness.
- Pig mood.
- Production speed.
- Visual dirt state.
- Event and request weighting.

### Happiness

Happiness is the main herd welfare score.

It comes from:

- Cleanliness.
- Hay and Water.
- Enrichment.
- Socialization.
- Space.
- Furniture.
- Events.
- Abilities.
- Wisdom.
- Relationship comfort.

It affects:

- Production interval.
- Rare bean odds.
- Pig mood.
- Neglect risk.

### Enrichment, Socialization, And Space

These are supporting welfare scores.

- Enrichment comes from toys, play, furniture, and rare-bean systems.
- Socialization comes from herd size, bonds, relationships, furniture, and synergies.
- Space comes from cage size, capacity, and herd pressure.

## Core Entities

### Game State

A recreated version should keep one authoritative simulation state object. At minimum it should include:

```ts
interface GameState {
  beans: number;
  compost: number;
  squeaks: number;
  goldenBeans: number;
  cavyWisdom: number;
  pigs: Pig[];
  relationships: PigRelationship[];
  poops: Poop[];
  robot: Robot | null;
  upgrades: {
    feedLevel: number;
    scoopLevel: number;
    cageLevel: number;
  };
  needs: {
    hay: number;
    water: number;
  };
  cage: {
    width: number;
    height: number;
    cleanliness: number;
    happiness: number;
    enrichment: number;
    socialization: number;
    space: number;
  };
  furniture: Record<FurnitureId, boolean>;
  abilities: Record<AbilityId, number>;
  automation: {
    overdrive: number;
    directive: AutomationDirectiveId;
  };
  recipes: Record<BeanRecipeId, boolean>;
  wisdom: Record<WisdomPerkId, boolean>;
  wisdomSpecialization: WisdomSpecializationId | null;
  event: EventState;
  contracts: ContractsState;
  pigRequest: PigRequestState;
  prestige: PrestigeState;
  tech: TechState;
  combo: ComboState;
  stats: GameStats;
  milestones: MilestoneState;
  log: string[];
}
```

### Pigs

Pigs must feel like individuals, not anonymous generators.

Each pig should have:

- ID.
- Name.
- Breed.
- Trait.
- Favorite food.
- Quirk.
- Position and target position.
- Speed.
- Bean production timer.
- Body and spot colors or sprite selection.
- Mood.
- Hunger.
- Thirst.
- Energy.
- Current goal.
- Favorite cage zone.
- Stress.
- Legendary flag.
- Bonded partner ID.

Current breeds:

- American
- Abyssinian
- Peruvian
- Skinny Pig
- Teddy
- Silkie
- Crested
- Rex

Current traits:

- Chonker
- Zoomer
- Neat Freak
- Gremlin
- Royal Pig
- Shy Beaner
- Hay Goblin
- Drama Pig
- Compost Mystic

Current pig goals:

- Roam
- Seek Food
- Eat
- Seek Water
- Drink
- Seek Sleep
- Sleep
- Seek Play
- Play With Pig
- Play With Furniture

Pigs choose behavior through weighted priorities, with urgent hunger and thirst overriding the normal roll. They should physically move toward hay, water, sleep spots, or play areas before satisfying the matching need.

### Relationships

The herd supports lightweight relationships:

- Bonded pair
- Buddy
- Nap partner
- Shy follower
- Rival

Relationships affect socialization, stress, zone preference, play behavior, requests, events, and Herd roster copy. Rivalry should create cozy management tension, not a failure spiral.

### Beans

Beans are clickable cage objects.

Each bean should have:

- ID.
- Type.
- Position.
- Base value.
- Current value.
- Age.
- Hits remaining.

Current bean types:

| Type | Role |
| --- | --- |
| Normal | Basic currency bean. |
| Golden | Awards Beans plus Golden Bean currency. |
| Compost | Awards Beans plus Compost. |
| Stinky | Low value, higher cleanliness pressure. |
| Blessed | Awards Squeaks and is gentler on cleanliness. |
| Mega | Higher value and requires multiple cleanup hits. |
| Mystery | Triggers a random bonus. |
| Hay | Higher-value care-themed bean. |
| Royal | Supports royal and legendary progression. |
| Cursed | High-value, high-pressure strange bean. |
| Mess Pile | Forms from clustered beans and requires multiple hits. |

Some beans should age:

- Normal beans gain value after enough time.
- Compost beans gain value repeatedly.
- Cursed beans gain value but increase pressure.
- Mess piles gain value and require several cleanup hits.

### Robot

The Poop Roomba is an automation entity.

It should:

- Wander when idle.
- Sweep toward target beans.
- Clean beans in a radius.
- Respect automation directives.
- Improve during overdrive.
- Surface automatic cleanup in the log and scene.

## Progression Systems

### Tech Tree

The Tech Tree is the canonical permanent unlock surface.

It should:

- Be visible from a fresh run.
- Contain branch-based nodes.
- Support prerequisites.
- Support multi-level nodes.
- Spend Beans, Compost, Squeaks, Golden Beans, or Wisdom depending on node.
- Unlock run systems, abilities, recipes, automation, furniture, and permanent Wisdom perks.
- Leave repeatable operations in their owning sections.

Branches:

- Care
- Habitat
- Automation
- Abilities
- Wisdom

Important design rule:

```text
The Tech Tree owns permanent unlocks. Gameplay sections own repeatable operations.
```

Examples:

- Tech Tree unlocks Poop Roomba.
- Furniture modal chooses automation directive and fuels overdrive.
- Tech Tree unlocks Bean Blessing.
- Recipes modal shows recipe status and repeatable Singularity operation.
- Tech Tree unlocks Wisdom Legacy nodes.
- Abilities modal fires active abilities.

### Shop

The Shop handles direct herd growth and any basic visible purchases still appropriate for a shop.

Core actions:

- Adopt Pig.
- Adopt Legendary Pig.

Historically, Shop also contained basic upgrades, but the current target structure centralizes those upgrades in the Tech Tree.

### Furniture

Furniture is currently static and auto-placed, not freely placed by the player.

Current furniture:

- Hidey House
- Tunnel
- Litter Tray
- Chew Toy
- Snuggle Sack
- Cardboard Castle
- Royal Throne

Furniture should affect multiple systems, such as:

- Pig target choice.
- Enrichment.
- Socialization.
- Space.
- Cleanliness cushion.
- Automation.
- Rare bean odds.
- Requests.
- Contracts.

Furniture synergies should exist when certain pieces are owned together:

- Cozy Corner
- Zoomie Playground
- Cleanup Circuit
- Royal Compost Court

### Cage Ecology And Habitat Care

The cage has fixed zones rather than free tile painting.

Current zones:

- Hay Corner
- Water Bottle
- Hidey Zone
- Play Run
- Litter Corner
- Open Fleece
- Royal Court

Each zone tracks:

- Mess.
- Comfort.
- Traffic.
- Appeal.
- Pig occupants.
- Status.
- Suggested action.
- Stewardship care and cooldown.

Ecology affects pig stress, favorite-zone comfort, requests, events, happiness, production, and scene feedback.

Habitat Care actions should be contextual and cost Beans or Compost. They improve zone condition and show feedback in the Furniture modal, log, and scene.

### Furniture Care

Owned furniture tracks condition and cooldowns.

Furniture can be:

- Well-loved.
- Stable.
- Overworked.

Care actions restore or improve furniture condition and should connect to ecology, automation, pig comfort, and Contracts.

### Active Abilities

Abilities are licensed through the Tech Tree and used from Abilities.

Current abilities:

| Ability | Role |
| --- | --- |
| Wheek Call | Calls pigs to hay and grants Squeaks. |
| Treat Bag | Boosts production. |
| Deep Clean | Cleans all beans. |
| Fresh Bedding | Restores cleanliness. |
| Snack Time | Raises happiness and rare odds. |
| Zoomie Mode | Speeds pig movement and production. |

Most abilities cost Squeaks and enter cooldown.

### Contracts

Contracts are the main short-term goal layer.

Rules:

- The player can have one active Contract.
- When none is active, Goals shows up to three offers.
- Contracts have multiple requirements, a timer, and rewards.
- Expired Contracts disappear without harsh penalty.
- Intro Contracts pace mechanic reveals.
- Later Contracts rotate based on progress and state.

Current Contract templates:

- Fresh Cage Delivery
- Room to Nest
- First Wheek
- Habitat Reset
- Cleanup Route
- Compost Starter
- Rare Sample Order
- Recipe Commission
- Great Composting Rumor
- Caretaker Philosophy

Contracts connect care, cleanup, automation, ecology, abilities, recipes, rare resources, herd size, Wisdom, requests, and the Log.

### Pig Requests

Pig Requests are personal, timed favors from individual pigs.

They should:

- Feature a named pig.
- Use pig traits and relationship state for weighting.
- Ask for short care, cleanup, combo, ability, furniture, compost, ecology, or relationship tasks.
- Reward Beans, Squeaks, Compost, Happiness, or stress relief.
- Expire without punishment.

### Records And Log

Goals contains Contracts. The Log contains:

- Progression Records.
- Achievement Records.
- Recent cage log messages.

Records preserve milestone flavor without becoming a second active checklist.

### Random Events

Events are timed situations with three response choices.

Current events:

- Zoomies
- Hay Frenzy
- Nap Time
- Bottle Jam
- Cage Inspection
- Compost Bloom
- The Great Wheeking
- Litter Revolt
- Hidey Squabble
- Zoomie Traffic

Each event should:

- Have a clear name and summary.
- Temporarily alter conditions or present a choice.
- Offer three responses with readable tradeoffs.
- Be weighted by cage state where possible.
- Produce log and HUD feedback.

### Bean Recipes

Recipes are mid-to-late unlocks that convert rare-resource history into strategic run bonuses.

Current recipes:

- Bean Blessing
- Compost Catalyst
- Royal Accord
- Singularity Experiment

Recipes should require a mix of current resources and historical cleaned bean stats.

### Bean Exchange

Bean Exchange is a late-game conversion track, housed in Recipes once unlocked.

Current trades:

- Beans to Compost.
- Compost to Squeaks.
- Golden Bean to Beans.
- Squeaks plus Beans to Golden Bean.

### Large Herd Support

Do not implement Cavy Council or repeatable decrees. Large-herd support should come from ordinary herd growth, cage capacity, space, relationships, furniture, furniture synergies, Royal Accord, care, and Contracts.
- Herd Charter.

### Great Composting And Wisdom

Great Composting is the prestige system.

Requirement:

- Reach the prestige lifetime Beans threshold.

On prestige:

- Gain Cavy Wisdom.
- Reset run resources, beans on the field, robot, upgrades, furniture, recipes, late-game unlocks, run Tech Tree levels, events, Contracts, and most run state.
- Keep permanent Wisdom and selected philosophy.
- Return to a two-pig herd with restored care.

Permanent Wisdom branches:

- Care
- Herd
- Automation
- Rare Beans

Current Wisdom perks:

- Roomy Start
- Steady Supplies
- Fresh Start
- Bonded Beginnings
- Social Memory
- Chorus Training
- Gentle Automation
- Compost Engine
- Tray Affinity
- Rare Instinct
- Golden Nose
- Royal Memory

Caretaker Philosophy unlocks after tier-3 Wisdom:

- Gentle Care
- Automation Steward
- Rare Bean Alchemy

Only one philosophy may be chosen. It should flavor future runs as a long-term caretaker identity.

## UI And Feedback Requirements

Every meaningful mechanic needs player-facing feedback.

Use:

- HUD stats for important current values.
- Quick care strip for Hay, Water, Happiness, and active Contract state.
- Dock badges for urgent attention, availability, and unread updates.
- Modal status text for costs, requirements, disabled reasons, and completed states.
- Cage log for flavorful state changes.
- Phaser scene effects for cleanup, purchases, unlocks, abilities, events, and care.
- Pig thought bubbles for active needs and goals.

Important feedback moments:

- Cleaning a bean should pop, show reward text, and play a small effect.
- Rare beans need distinct accent feedback.
- First successful cleanup should feel slightly ceremonial.
- Clean Streak increases should pulse.
- Contract progress should visibly respond.
- Event readiness should be hard to miss.
- Purchases and Tech Tree unlocks should produce scene and log feedback.
- Pigs should react to nearby cleanup and major care actions.

## Visual Direction

The art direction is cozy top-down 2D.

Visual traits:

- Rounded guinea pigs with readable body and spot colors.
- Small oval bean sprites.
- Warm cage bedding.
- Fixed cage objects with subtle shadows.
- Soft UI with compact game controls.
- Clear iconography for dock sections.
- Playfield-first layout.

The cage should visually evolve:

- More pigs.
- More beans and rare bean types.
- More furniture.
- Larger cage.
- Robot automation.
- Dirt and cleanliness changes.
- Ambient details and cozy bedding.

Do not make fake decorative objects look clickable unless they are clickable.

## Architecture To Recreate

Use a clear separation:

```text
src/
  main.ts
  styles.css
  scenes/
    GameScene.ts
  simulation/
    types.ts
    state.ts
    balance.ts
    actions.ts
    systems.ts
    persistence.ts
    techTree.ts
    contracts.ts
    pigRequests.ts
    pigWelcome.ts
    ecology.ts
    relationships.ts
    furnitureCare.ts
    furnitureDefinitions.ts
    milestones.ts
    utils.ts
  ui/
    hud.ts
    hudRenderers.ts
    progression.ts
    events.ts
    devTools.ts
    tutorialController.ts
    audioManager.ts
    dom.ts
```

Responsibilities:

- `types.ts`: shared state and ID unions.
- `state.ts`: initial state, pig creation, bean spawning, log helpers, entity counters.
- `balance.ts`: numeric tuning, costs, capacities, formulas, Wisdom definitions, ability costs.
- `actions.ts`: player-triggered outcomes such as cleaning, refills, purchases, abilities, event responses, recipes, exchange, and prestige.
- `systems.ts`: timed simulation updates, pig behavior, needs, production, cleanliness, events, automation, survival, mess piles.
- `persistence.ts`: save/load, migration, hydration, old-save compatibility.
- `techTree.ts`: Tech Tree definitions, costs, prerequisites, unlock behavior, status text.
- `contracts.ts`: Contract templates, offer generation, progress, completion.
- `pigRequests.ts`: personal pig favors.
- `pigWelcome.ts`: early Herd trait discovery.
- `ecology.ts`: fixed cage zones, metrics, stress, preferred targets.
- `relationships.ts`: relationship web and pairing behavior.
- `furnitureCare.ts`: furniture condition and care state.
- `GameScene.ts`: Phaser rendering, animation, pointer cleanup, scene feedback.
- `hud.ts`: DOM binding, rendering, button actions, modal control.
- `progression.ts`: section reveal logic.
- `devTools.ts`: dev-only deterministic test buttons and constants tools.

Keep simulation rules out of the scene and HUD. The scene and HUD should display and trigger rules, not own the rules.

## Save Compatibility

If recreating or extending the game, preserve the idea of save hydration.

Rules:

- Use a versioned save key.
- Load unknown or missing fields defensively.
- Backfill newly added persistent structures.
- Clamp numeric values.
- Remove invalid references after pig death or old saves.
- Sync entity ID counters after loading.

Current save key:

```text
gpb-save-v1
```

## Local Dev Tooling

In development, expose deterministic tools only in dev builds.

Useful tools:

- Add resources.
- Spawn specific bean types.
- Seed lifecycle status.
- Seed ecology stress.
- Unlock sections.
- Open or test modals.
- Edit selected constants from `balance.ts`.

The constants editor should be local-only. It should rewrite source literals for balance tuning and never appear as a player-facing runtime feature.

## Implementation Roadmap From Scratch

Build in slices. Do not start with all systems at once.

### Milestone 1: Heartbeat Prototype

Goal:

One guinea pig wanders around a cage, drops beans, and the player clicks beans to earn Beans.

Required:

- Vite + Phaser + TypeScript app.
- Canvas cage.
- One or two pigs with simple random movement.
- Bean spawn timer.
- Click cleanup.
- Beans counter.
- Basic log line.
- Build passes.

Done when:

- The first cleanup is understandable and satisfying.

### Milestone 2: Care Loop

Goal:

Make the loop about caretaking, not just clicking.

Add:

- Hay meter.
- Water meter.
- Refill buttons.
- Cleanliness.
- Happiness.
- Production penalties for low care.
- Pigs with hunger and thirst.
- Care strip always visible.

Done when:

- The player understands that care keeps the herd productive.

### Milestone 3: Growth And Upgrades

Goal:

Let the player spend Beans to change the run.

Add:

- Adopt Pig.
- Better Hay.
- Better Scoop.
- Bigger Cage.
- Initial Tech Tree shell.
- Basic costs and scaling.
- Save/load.

Done when:

- More pigs means more opportunity and more mess.

### Milestone 4: Pig Identity

Goal:

Make pigs memorable.

Add:

- Names.
- Breeds.
- Traits.
- Favorite foods.
- Quirks.
- Roster modal.
- Mood/status thought bubbles.
- Trait-driven behavior.

Done when:

- The player can tell pigs apart and understands at least one trait effect.

### Milestone 5: Bean Variety And Cleanup Juice

Goal:

Make cleaning more rewarding.

Add:

- Special bean types.
- Rare resource awards.
- Bean aging.
- Multi-hit beans.
- Clean Streak combo.
- Cleanup pop, reward text, and particles.
- First-clean ceremony.

Done when:

- Clicking beans feels good repeatedly and rare beans are exciting.

### Milestone 6: Furniture And Ecology

Goal:

Turn the cage into a managed habitat.

Add:

- Static furniture unlocks.
- Furniture placement visuals.
- Fixed ecology zones.
- Zone mess, comfort, traffic, appeal.
- Favorite zones.
- Pig stress.
- Habitat Care and Furniture Care.
- Furniture synergies.

Done when:

- Where pigs go and where mess forms matters.

### Milestone 7: Automation

Goal:

Introduce management choices beyond manual cleaning.

Add:

- Litter Tray auto-clean behavior.
- Poop Roomba.
- Automation overdrive.
- Automation directives.
- Rare Guard behavior.
- Scene feedback for automation cleanup.

Done when:

- The player can choose between protecting cleanliness and preserving valuable rare beans.

### Milestone 8: Goals And Events

Goal:

Create short-term direction.

Add:

- Contracts Board.
- Intro Contracts for reveal pacing.
- Pig Requests.
- Random Events with three choices.
- Records in Log.
- Dock badges and availability indicators.

Done when:

- The player always has an optional next goal without feeling railroaded.

### Milestone 9: Rare Economy

Goal:

Make rare resources matter.

Add:

- Active abilities.
- Bean Recipes.
- Bean Exchange.
- Legendary pigs.
- Golden Scoop.

Done when:

- Compost, Squeaks, and Golden Beans create strategic choices instead of only collecting numbers.

### Milestone 10: Prestige And Wisdom

Goal:

Add long-term replay structure.

Add:

- Great Composting prestige.
- Wisdom currency.
- Permanent Wisdom Tech Tree branch.
- Caretaker Philosophies.
- Save-safe reset behavior.

Done when:

- Restarting feels like a cozy ascension, not losing everything.

### Milestone 11: Polish And Verification

Goal:

Make the game feel alive and robust.

Add:

- Sound effects and mute.
- Tutorial hint sequence.
- Modal scan states.
- Responsive layout.
- Scene feedback for every major action.
- Build and browser smoke scripts.

Done when:

- A fresh player can learn the first minute unaided.
- The game builds and survives a focused browser smoke check.

## First-Minute Target

The first minute should teach:

1. Pigs are alive and moving.
2. Beans appear in the cage.
3. Clicking a bean cleans it and earns Beans.
4. Hay and Water matter but are not stressful.
5. The Shop or Tech Tree offers a clear first purchase.
6. The Herd modal shows that pigs are individuals.
7. The Log gives the game a funny voice.

The first minute should not require understanding:

- Prestige.
- Recipes.
- Wisdom.
- Automation directives.
- Detailed ecology.
- Event chains.

## Balance Starting Points

Use readable early numbers. Tune later.

Suggested early values:

```text
Starting pigs: 2
Starting Beans: 0
Starting Hay: 100
Starting Water: 100
Starting Cleanliness: 100
Starting Happiness: 86
Base bean interval: 5 seconds
First few beans: faster than base interval
Normal bean value: 1
Adopt Pig base cost: 15 Beans
Better Hay base cost: 25 Beans
Better Scoop base cost: 20 Beans
Bigger Cage base cost: 80 Beans
Poop Roomba base cost: 75 Beans
Clean Streak timer: about 2.25 seconds
Prestige threshold: 5000 lifetime Beans
```

Important tuning rule:

```text
Early progress should feel fast enough that the player reaches the first purchase before the joke wears thin.
```

## Agent Instructions For Recreation

If you are an agent recreating this game from scratch:

1. Build the heartbeat prototype first.
2. Keep all game rules in the simulation layer.
3. Keep Phaser focused on rendering, animation, pointer input, and scene feedback.
4. Keep DOM HUD focused on controls, modal sections, status text, and player actions.
5. Add save hydration as soon as persistence exists.
6. Add player-facing feedback in the same slice as each mechanic.
7. Use the Tech Tree as the permanent unlock surface.
8. Use Contracts as the short-term progression spine.
9. Reveal advanced sections only when actionable.
10. Prefer cozy management tension over punishment.
11. Make pig identity visible through behavior, roster text, requests, and feedback.
12. Do not add orphan systems. Every system should connect to at least two other loops and at least one visible feedback channel.

## Non-Negotiable Design Rules

- The cage is the center of the game.
- The player cleans beans as the primary active action.
- Pigs must have identity.
- Care should matter without becoming tedious.
- Growth should create more opportunity and more mess.
- Upgrades should interact with existing systems.
- Advanced systems should reveal progressively.
- Every meaningful mechanic needs visible feedback.
- Death or neglect must not create an unrecoverable fail state.
- Absurdity is a reward for mastering the simple care loop.

## Suggested Handoff Prompt

Use this prompt when handing the brief to another agent:

```text
Recreate Guinea Pig Beans from scratch as a Phaser 3 + TypeScript + Vite browser game. Use docs/GAME_RECREATION_BRIEF.md as the product spec. Build in milestones, starting with the heartbeat prototype: a top-down cage, two named guinea pigs, bean production, click-to-clean, Beans currency, visible Hay/Water/Cleanliness/Happiness, and a DOM HUD. Keep simulation rules separate from Phaser rendering and DOM UI. Make every new mechanic visible to the player through the cage, HUD, modal copy, log, or scene feedback. Do not implement late-game systems until the core loop feels good.
```
