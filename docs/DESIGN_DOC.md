# Guinea Pig Beans Design Document

This document describes the current game mechanics and rules from a game-design perspective. It is not a code architecture document. Its job is to answer: what is the player doing, what systems are in play, what rules govern those systems, and what design shape the game currently has.

## Design Intent

Guinea Pig Beans is a cozy incremental management game about keeping a guinea pig cage productive, clean, and emotionally stable while the herd creates increasingly strange "beans."

The core joke is concrete and readable:

1. Guinea pigs wander around a cage.
2. Guinea pigs make beans.
3. The player cleans beans for currency.
4. Currency buys more pigs, better care, furniture, automation, and stranger late-game systems.
5. A larger, happier, better-supported herd creates more valuable chaos.

The intended emotional arc is:

`cute -> messy -> optimized -> absurd -> mythic`

The game should stay cozy and management-focused. Neglect can create risk, but the primary feeling should be "I am caring for a strange little system," not "I am being punished by a survival sim."

## Player Fantasy

The player is the caretaker, janitor, interior designer, logistics manager, and eventual mythic bean economist for a growing guinea pig herd.

Moment-to-moment, the player:

- Watches named pigs wander, eat, drink, sleep, and produce beans.
- Clicks beans in the cage to clean them and earn resources.
- Refills hay and water to keep the herd productive.
- Buys upgrades that make cleaning, care, and production stronger.
- Adds furniture that changes pig behavior and cage stats.
- Responds to short-lived events and pig requests.
- Converts rare resources into Tech Tree unlocks, abilities, recipes, automation fuel, mythic systems, and permanent Wisdom.

## Current Player Interface

The game is built around one primary playfield and several supporting sections.

The persistent screen shows:

- The cage playfield with pigs, beans, hay, water, furniture, dirt, and automation.
- Top stats: Beans, Pigs, Cleanliness, Streak, Compost, Squeaks, Gold, Wisdom, and Furniture.
- Quick care meters for Hay, Water, and Happiness.
- A current Contract prompt.
- Persistent utility controls for sound, save status, and reset.

The fresh-run section dock opens the core loop and progression map first:

- Care
- Shop
- Tech Tree
- Herd
- Goals
- Log

Advanced sections reveal when the player has a reason to use them:

- Furniture
- Abilities
- Recipes

High-frequency care information stays visible. Deeper decisions live behind dock sections.

## Starting State

A fresh run begins with:

- 2 guinea pigs.
- 0 Beans.
- 0 Compost.
- 0 Squeaks.
- 0 Golden Beans.
- 0 Cavy Wisdom.
- Full Hay.
- Full Water.
- 100% Cleanliness.
- 86% starting Happiness.
- No furniture.
- No robot.
- No recipes.
- No mythic systems.
- Fresh Contract offers in the Goals modal.
- Pig Welcome cards in the Herd modal.

The two starting pigs enter as a bonded pair. This matters because bonding contributes to the socialization layer, and because the game treats two pigs as the healthy baseline herd.

## Core Loop

The main loop is:

1. Pigs move around the cage and produce beans.
2. Beans reduce cleanliness while they remain in the cage.
3. The player clicks beans to clean them.
4. Cleaning awards Beans and sometimes rare resources.
5. Quick repeated cleaning builds a Clean Streak for bonus Beans.
6. Beans purchase pigs and Tech Tree unlocks for upgrades, cage expansions, furniture, automation, abilities, and recipes.
7. Better care, more space, furniture, abilities, events, and Wisdom improve production.
8. More production creates more mess and more opportunities.

The loop creates a soft tension between:

- Cleaning quickly to protect happiness and cleanliness.
- Letting some beans age or cluster for higher value.
- Spending resources on growth versus support.
- Expanding the herd versus keeping the cage livable.

### No-Orphan-System Rule

Every new or surviving system should connect to at least two other systems and one visible feedback channel.

Examples:

- Contracts connect care, ecology, automation, recipes, herd management, and Log feedback.
- Wisdom philosophies change multiple systems and show their tradeoff in the Tech Tree.
- Furniture and Habitat Stewardship affect pig stress, ecology, automation, requests, Contracts, and cage feedback.

A system is not considered complete if it only changes hidden state.

Mechanics should also reveal themselves at the moment they create a useful decision. Advanced dock sections should stay hidden on a fresh run, then appear when existing progress, resources, accepted Contracts, or cage pressure make them relevant.

## Resources

### Beans

Beans are the main currency. The player earns them primarily by cleaning beans in the cage. Beans buy pigs, Tech Tree unlocks, and some event or trade choices.

Lifetime Beans also drive prestige progress.

### Compost

Compost is a secondary resource earned mainly from compost beans and some request or event rewards. It is used for:

- Fueling automation overdrive.
- Unlocking Compost Catalyst.
- Unlocking and running the Singularity Experiment recipe.
- Bean Exchange trades.

### Squeaks

Squeaks are an active-ability resource. They come from blessed beans, requests, events, Wheek Call, and the Chorus Training choir effect.

Squeaks are used for:

- Stronger abilities.
- Bean Recipes.
- Event choices.
- Cavy Council decrees.
- Some Bean Exchange trades.

### Golden Beans

Golden Beans are rare currency earned by cleaning golden beans and through some late-game effects.

Golden Beans are used for:

- Legendary pig adoption.
- Bean Blessing.
- Royal Accord.
- Bean Exchange unlock and trades.
- Some mythic progression.

### Cavy Wisdom

Cavy Wisdom is the prestige currency. It is gained through the Great Composting and spent on permanent Wisdom Legacy nodes in the Tech Tree.

Wisdom perks are permanent run-to-run progression.

### Hay

Hay is both a shared cage supply and an individual pig need target. It drains over time based on herd size and can also be consumed directly by hungry pigs.

Hay affects:

- Pig hunger recovery.
- Poop production speed.
- Happiness.
- Death risk if critically low for long enough.

### Water

Water is a shared cage supply and individual pig need target. It drains over time based on herd size and can be consumed by thirsty pigs.

Water affects:

- Pig thirst recovery.
- Poop production speed.
- Happiness.
- Death risk if critically low for long enough.

### Cleanliness

Cleanliness is a cage health score derived from the amount and type of beans currently in the cage.

Cleanliness affects:

- Happiness.
- Pig mood.
- Production speed.
- Death risk indirectly through low Happiness.
- Visual dirt and bedding state.

### Happiness

Happiness is the main herd welfare score. It combines cleanliness, hay/water, enrichment, socialization, space, events, abilities, synergies, and penalties.

Happiness affects:

- Poop production speed.
- Rare bean odds.
- Pig mood.
- Survival risk when very low.

### Enrichment, Socialization, And Space

These are supporting welfare scores that feed into Happiness.

Enrichment mainly comes from toys and playful furniture.

Socialization comes from herd size, bonds, social furniture, and late-game support.

Space comes mainly from cage size and herd pressure. A cramped herd reduces welfare.

## Pig Rules

### Pig Identity

Each pig has:

- Name.
- Breed.
- Trait.
- Favorite food.
- Quirk.
- Body colors.
- Movement speed.
- Bonded partner, if any.
- Visible relationship state.
- Pig Welcome trait-discovery status.
- Legendary status, if applicable.
- Individual Hunger, Thirst, and Energy.
- Current goal.
- Current mood.

The roster is meant to make pigs feel like individual residents rather than anonymous production units.

### Pig Welcome

Pig Welcome is an early Herd feature that teaches the starter pigs as individuals before the player reaches deeper progression.

A pig becomes ready to welcome after spending 6 seconds settled in its favorite zone while hay and water are at 45%+, cleanliness is at 65%+, and the favorite zone is not heavily messy.

Claiming a welcome discovers that pig's trait tip, grants a small starter reward, lowers that pig's stress, and leaves the trait tip visible in the roster. This connects early care, favorite zones, pig identity, and Herd feedback without adding a new resource.

### Breeds

Current standard breeds:

- American
- Abyssinian
- Peruvian
- Skinny Pig
- Teddy
- Silkie
- Crested
- Rex

Breed affects production or movement lightly.

Current breed rules:

- Rex pigs produce slightly faster.
- Abyssinian pigs produce slightly faster and move faster.
- Skinny Pigs produce slightly slower.
- Silkie pigs produce slower.
- Teddy pigs have higher golden bean odds.

### Traits

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

Trait rules:

- Chonker produces slower but starts beans with +1 value. Mega bean odds are higher.
- Zoomer moves faster, uses energy faster, and produces slightly faster.
- Neat Freak prefers the litter tray area and has lower stinky odds.
- Gremlin prefers messy areas and produces faster when the cage is dirty, but has much higher stinky odds in dirty cages.
- Royal Pig prefers the Royal Throne when available and improves royal bean access.
- Shy Beaner prefers the Hidey House when available.
- Hay Goblin prefers the hay rack, drains hunger faster, eats more intensely, produces faster, and increases hay drain pressure.
- Drama Pig gets thirstier faster and creates a water-related happiness penalty when water is low.
- Compost Mystic has higher blessed bean odds and stronger compost/request associations.

### Legendary Pigs

Legendary pigs are late-midgame adoptions that cost Beans plus 1 Golden Bean.

Legendary pigs use special names and draw from stronger thematic breeds and traits. Their cost scales with the number of legendary pigs adopted and can be discounted by rare-bean systems.

### Bonds And Relationships

Pigs can enter as bonded pairs. Bonded pigs add socialization, and Wisdom can increase the value of bonds.

The herd also tracks lightweight relationship pairs:

- Buddies seek each other for play and add social stability.
- Nap partners prefer rest context and can settle near each other.
- Shy followers use a trusted herdmate as a comfort anchor when stressed.
- Rivals create mild friction in dirty or crowded zones, but clean comfortable spaces and relationship requests can turn that friction into a truce.

Relationships contribute to socialization, zone preference, stress, social-play partner choice, Herd roster copy, pig requests, and Hidey Squabble/Rebond outcomes. Rivalry is cozy management tension, not a failure spiral.

If a pig dies, any surviving bonded partner loses that bond, and invalid relationship links are removed or backfilled during save hydration.

### Individual Needs

Each pig tracks:

- Hunger.
- Thirst.
- Energy.

These needs drain over time. Pigs normally choose activities through weighted behavior priorities, but urgent hunger and thirst override the weighted roll so care needs stay readable.

Current urgent thresholds:

- Hunger at 38% or lower can trigger Eating if hay is available.
- Thirst at 35% or lower can trigger Drinking if water is available and the bottle is not jammed.
- Energy at 28% or lower can trigger Sleeping.

Current satisfaction thresholds:

- Eating and drinking try to recover the relevant need to 86%.
- Sleeping tries to recover Energy to 88%.

### Pig Goals

Current goals:

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

Pigs normally roam to target points. When a pig is ready for a new activity, it rolls against code-controlled behavior weights for roaming, food, water, sleep, and play. Traits and current cage context modify those weights:

- Hay Goblins lean toward food.
- Drama Pigs lean toward water.
- Zoomers lean toward play.
- Shy Beaners lean toward rest.
- Low enrichment or socialization makes play more likely.
- Zoomies and Zoomie Mode make play more likely.

Food and water are split into seeking and consuming:

- Seeking Food targets the hay rack and stays active until the pig reaches the rack.
- Eating starts only once the pig is near the hay rack and hay is available.
- Seeking Water targets the water bottle and stays active until the pig reaches the bottle.
- Drinking starts only once the pig is near the bottle, water is available, and the bottle is not jammed.
- Empty hay, empty water, or a jammed bottle keeps the pig waiting near the relevant care object instead of consuming from across the cage.

Sleep and play also use a seek-then-act pattern:

- Seeking Sleep targets the Snuggle Sack or Hidey House when available, otherwise a normal cage spot.
- Sleeping starts once the pig reaches the chosen rest spot.
- Seeking Play sends pigs toward the Play Run.
- Two nearby pigs that are both seeking play can play together.
- If a pig does not find a play partner, it plays with Chew Toy, Tunnel, or Cardboard Castle when available, otherwise it plays in the Play Run.
- Play lightly relieves stress and uses existing zone traffic/furniture systems through the pig's physical location.

After satisfying a goal, the pig returns to roaming.

### Lifecycle As System Driver

The game treats each pig's daily life as the main simulation readout. A derived lifecycle model looks at hunger, thirst, energy, current goal, mood, stress, favorite-zone comfort, favorite-zone mess, relationship pressure, and herd recovery state. It does not add a saved resource or a new player-facing section.

Systems use that lifecycle readout to decide what deserves attention:

- Pigs choose food, water, rest, play, social, comfort, cleanup, or roaming pressure through one shared read model.
- Pig requests come from the pig whose current life pressure is clearest.
- Events weight toward the herd's current pressure, such as hay, water, rest, play traffic, cleanup, relationship tension, or stressed hidey areas.
- Contract offers still preserve intro reveal pacing, but ordinary offers prefer the herd's current lifecycle needs.
- Automation cleanup can favor zones where mess is affecting pig comfort, while Rare Guard still protects valuable beans.
- Rare bean odds use pig comfort, stress, favorite-zone presence, and relationship warmth from the same lifecycle readout.
- Herd roster and status copy name the current lifecycle cause so the player can see why care, cleanup, rest, play, or relationship comfort matters.

This keeps lifecycle as the connective tissue between existing systems rather than adding aging, breeding, illness, or harsher survival pressure.

### Pig Mood

Current moods:

- Content
- Hungry
- Thirsty
- Messy

Mood is based on hunger, thirst, cleanliness, happiness, and space.

Mood affects movement and periodic thought-bubble status messages:

- Content pigs move normally.
- Hungry or thirsty pigs move less efficiently and can periodically ask for hay or water in the cage.
- Messy or stressed pigs move slower and can periodically complain about the cage state.

Pigs keep their normal body colors when their mood changes. Lifecycle and welfare status are communicated through short over-pig messages instead of status color shifts.

## Care, Happiness, And Survival

### Hay And Water Drain

Hay and water drain based on current pig count.

Current base drain:

- Hay drains by 0.035 per pig per second.
- Water drains by 0.02 per pig per second.

Modifiers:

- Hay Frenzy increases hay drain.
- Hay Goblins increase hay drain.
- Chew Toy slows hay drain.
- The Better Hay capstone opens Hay Dimension and slows hay drain.
- Steady Supplies slows both hay and water drain.
- Total Wisdom very slightly slows water drain.
- Bottle Jam prevents normal water drain, but pigs cannot drink while the bottle is jammed.

### Happiness Formula

Happiness is a weighted score made from:

- Cleanliness.
- Average Hay and Water level.
- Enrichment.
- Socialization.
- Space.
- Event bonuses.
- Ability bonuses.
- Furniture synergies.
- Trait penalties.
- Lone-pig penalty.
- Cavy Council bonuses.

Current design weighting favors cleanliness and needs first, then enrichment, socialization, and space.

Key happiness modifiers:

- Snack Time adds a temporary happiness bonus.
- Nap Time and The Great Wheeking add event bonuses.
- Cozy Corner adds happiness.
- Drama Pig creates a water-related penalty when water is low.
- A lone pig takes a happiness penalty until a second pig is adopted.
- Cavy Council helps a large herd stay happy.

### Death Risk

Pigs can die from severe neglect. Death is periodic and chance-based, not instant.

Every 12 seconds, if risk exists, each living pig rolls against the current death chance. The total chance is capped at 35% per check.

Death risk sources:

- Hay at 0%: 18% risk.
- Hay below 10%: 8% risk.
- Hay below 25%: 3% risk.
- Water at 0%: 22% risk.
- Water below 10%: 10% risk.
- Water below 25%: 4% risk.
- Happiness below 10%: 10% risk.
- Happiness below 20%: 5% risk.
- Happiness below 35%: 2% risk.

The death cause shown to the player is whichever risk source is strongest: hay, water, or happiness.

### Recovery Rules

The game supports recovery from herd loss.

- If the herd drops below 2 pigs, adopting is free.
- If all pigs die, adopting is still free.
- If only 1 pig remains, that pig receives a happiness penalty until the second pig is restored.
- Once the herd returns to 2 or more pigs, normal adoption pricing resumes.

This keeps death serious but prevents a hard fail state.

## Bean Production

### Production Interval

Each pig has a poop timer. When the timer reaches zero, the pig creates a bean near its position and receives a new production interval.

The base interval is 5 seconds, then modifiers are applied.

Production can get faster from:

- Better Hay levels.
- Better Hay's Hay Dimension capstone.
- High enrichment.
- High socialization.
- High happiness.
- Hay Frenzy.
- The Great Wheeking.
- Treat Bag.
- Zoomie Mode.
- Gremlin trait when the cage is dirty.
- Fast-producing traits or breeds.
- Total Wisdom.
- Early-game pacing boost before the first 15 cleaned beans.

Production can get slower from:

- Empty or low hay.
- Empty or low water.
- Low happiness.
- Very dirty cage for non-Gremlin pigs.
- Nap Time.
- Slower-producing traits or breeds.

### Early-Game Pacing

The first cleaned beans arrive faster than the base rules would imply.

Current early multipliers:

- Before 5 cleaned beans, production is much faster.
- Before 15 cleaned beans, production is still faster than normal.
- After that, production uses the normal tuning curve.

This is intended to make the first minute active and understandable.

## Bean Types

Beans are the main objects the player cleans. Most beans award Beans, and some award extra resources or effects.

Current bean types:

| Bean type | Starting value | Special rule |
| --- | ---: | --- |
| Normal | 1 | Ages into +1 value after enough time. |
| Stinky | 1 | Hurts cleanliness more than normal. |
| Compost | 2 | Awards Compost when cleaned and gains value as it ages. |
| Blessed | 3 | Awards Squeaks when cleaned and hurts cleanliness less. |
| Mega | 5 | Requires 2 cleanup hits. |
| Mystery | 4 | Triggers a random bonus. |
| Hay | 3 | More likely when hay is high. |
| Golden | 8 | Awards a Golden Bean when cleaned. |
| Royal | 10 | Supports royal/legendary progression. |
| Cursed | 12 | High value, higher cleanliness pressure, tied to the Singularity Experiment or very dirty cages. |
| Mess Pile | Varies | Forms from clustered beans and requires multiple cleanup hits. |

Chonker pigs add +1 to starting bean value.

### Aging Rules

Some beans become more valuable over time:

- Normal beans gain +1 value after 18 seconds.
- Compost beans gain value every 8 seconds, with stronger gains from Compost Bloom, Compost Catalyst, or Compost Engine.
- Cursed beans gain value every 15 seconds.
- Mess Piles gain value every 10 seconds.

This creates a mild "clean now or wait" tension.

### Rare Bean Odds

Rare bean odds are influenced by:

- Pig breed.
- Pig trait.
- Happiness.
- Enrichment.
- Snack Time.
- The Great Wheeking.
- Furniture and furniture synergies.
- Bean Recipes.
- Wisdom perks.
- Current resources and cage state.
- Late-game systems.

Not all rare beans are purely positive. Stinky, cursed, and mess pile outcomes create higher cleanup pressure.

## Cleaning Rules

### Manual Cleaning

The player cleans by clicking in the cage. The click cleans beans within the current scoop radius.

Current scoop radius:

- Base: 24.
- Each Better Scoop level adds 9.

If the click hits no bean, nearby pigs can still react cosmetically.

### Multi-Hit Beans

Some beans require more than one cleanup:

- Mega beans require 2 hits.
- Mess Piles require 3 to 5 hits depending on the cluster that formed them.

Each hit on a Mess Pile weakens it until the final hit awards the cleanup value.

### Clean Streak

Cleaning builds a timed combo.

Current rules:

- A successful cleanup starts or continues a Clean Streak.
- The combo timer lasts 2.25 seconds.
- Cleaning again while the timer is active increases the combo count.
- The combo bonus is based on the cleaned value and combo count.
- The bonus can scale up to 100% of the base value.

Clean Streak is meant to reward fast active play without making passive play invalid.

### Cleanup Rewards

Cleaning can award:

- Beans.
- Compost.
- Squeaks.
- Golden Beans.
- Mystery rewards.
- Contract progress.
- Record milestone progress.
- Pig request progress.

## Cleanliness And Mess

Each loose bean contributes to mess.

Current cleanliness pressure:

- Normal and most beans: 5.5 mess.
- Blessed: 3 mess.
- Stinky: 8 mess.
- Cursed: 11 mess.
- Mess Pile: 13 mess.

The Litter Tray softens mess pressure while it is unlocked.

Cleanliness can receive small bonuses:

- Cage Inspection can add a clean-cage bonus during the event.
- Snuggle Sack adds a small cleanliness cushion.
- Fresh Start Wisdom adds a permanent cleanliness cushion.

Dirty cages are visible in the playfield through floor tint, dirt wash, and dirt patches. Stinky beans and Mess Piles also create local dirty areas.

## Tech Tree

The Tech Tree is the always-visible progression map. It owns one-time unlock decisions for run upgrades, furniture, automation access, ability licenses, bean recipes, late-game unlocks, Great Composting, Wisdom perks, and Caretaker Philosophies.

The original sections still own repeatable operations:

- Shop handles pig adoption and legendary pig adoption.
- Furniture handles automation fuel, automation directives, furniture care, and habitat tending.
- Abilities handles using unlocked active abilities.
- Recipes handles Bean Exchange trades and running Singularity.
- Herd handles Cavy Council decrees.

Nodes can be locked, available, or complete. A child node only becomes available after every prerequisite node is complete. For multi-level nodes, every level must be bought before child nodes unlock.

The Tech Tree has five branches:

- Care & Cage: Better Hay, Better Scoop, Bigger Cage, Hay Dimension, Clean Streak Training, and Care Routines.
- Habitat: furniture unlocks, furniture synergy completion, Furniture Care Kit, and Habitat Steward Kit.
- Automation: Poop Roomba, Compost Overdrive access, Automation Directives, Roomba Sensors, Litter Method, and Rare Guard Protocol.
- Abilities & Rare Beans: active ability licenses, Squeak Training, Rare Catalog, bean recipes, Bean Exchange, Golden Scoop, Singularity Experiment, and Singularity Stabilizers.
- Wisdom Legacy: Great Composting, all permanent Wisdom perks, and the three Caretaker Philosophies.

The tree does not add a new currency. Nodes spend the same resources their systems already use: Beans, Compost, Squeaks, Golden Beans, or Cavy Wisdom.

Existing save fields remain the source of truth for existing unlocks. If a save already has upgrades, furniture, recipes, late-game flags, Wisdom perks, or a philosophy, the matching Tech Tree nodes show as complete. New levelled tech nodes use `tech.levels` save data and reset with the rest of the run during Great Composting.

Current levelled tech nodes:

| Node | Max level | Main effect |
| --- | ---: | --- |
| Clean Streak Training | 3 | Adds combo window time and stronger combo bonus scaling. |
| Care Routines | 3 | Reduces hay and water drain. |
| Furniture Care Kit | 3 | Reduces care costs, increases condition restore, and slows furniture wear. |
| Habitat Steward Kit | 3 | Reduces habitat tend cost and cooldown while increasing care gain. |
| Roomba Sensors | 3 | Improves Roomba speed and sensor range. |
| Litter Method | 3 | Improves Litter Tray trigger chance and radius. |
| Squeak Training | 3 | Improves Wheek Call, ability costs, durations, and cooldowns. |
| Rare Catalog | 3 | Improves rare bean odds. |
| Singularity Stabilizers | 3 | Lowers Singularity cost and strengthens its pull and rare boost. |

## Shop Progression

Shop is the herd growth surface. It keeps adoption easy to scan while the Tech Tree owns one-time upgrade and unlock purchases.

Ongoing operating choices, such as fueling automation or choosing automation directives, live in Furniture with the systems they control.

### Adopt Pig

Adds a standard pig if capacity allows.

Current pricing:

- Free when the herd has fewer than 2 pigs.
- Otherwise scales from current herd size: `10 * 1.35 ^ (pigs - 1)`, rounded up.

The cage has a pig capacity. Current capacity:

- Base capacity: 2.
- Bigger Cage adds +2 per level.
- Roomy Start adds +2.
- Royal Accord adds +1.

### Better Hay

Better Hay is unlocked from the Care & Cage Tech Tree branch.

Better Hay improves production by multiplying the pig production interval by 0.9 per level.

Current pricing:

- `18 * 1.6 ^ level`, rounded up.

### Better Scoop

Better Scoop is unlocked from the Care & Cage Tech Tree branch.

Better Scoop increases manual cleanup radius and makes the Roomba cheaper.

Current pricing:

- `14 * 1.7 ^ level`, rounded up.

### Poop Roomba

Poop Roomba is unlocked from the Automation Tech Tree branch.

Unlocks an automatic cleaner that wanders the cage, detects nearby beans, and sweeps them.

Current pricing:

- Starts from 75 Beans.
- Reduced by Better Scoop.
- Reduced by Gentle Automation.
- Minimum cost is 45 Beans.

### Bigger Cage

Bigger Cage is unlocked from the Care & Cage Tech Tree branch.

Expands the cage and increases pig capacity.

Current pricing:

- `60 * 2.1 ^ cageLevel`, rounded up.

Bigger Cage:

- Increases cage dimensions.
- Adds +2 pig capacity per level.
- Improves space pressure for larger herds.

### Legendary Pig

Adds a legendary pig if capacity allows.

Current cost:

- Beans plus 1 Golden Bean.
- Bean cost starts at 220.
- Bean cost scales by 1.8 per legendary pig already adopted.
- Bean cost can be discounted by Bean Blessing, Royal Accord, Royal Memory, and Royal Compost Court.

## Furniture

Furniture is unlocked as one-time static cage objects from the Habitat Tech Tree branch. The player does not place furniture manually yet.

Current furniture:

| Furniture | Cost | Main effects |
| --- | ---: | --- |
| Hidey House | 35 | Supports shy pigs, sleep behavior, and socialization. |
| Tunnel | 45 | Improves movement and social play. |
| Litter Tray | 60 | Auto-cleans nearby beans and softens mess. |
| Chew Toy | 70 | Boosts enrichment and slows hay drain. |
| Snuggle Sack | 95 | Improves rest, happiness, and cleanliness cushion. |
| Cardboard Castle | 130 | Supports larger herds and compost bean odds. |
| Royal Throne | 300 | Attracts Royal Pig behavior and improves royal bean odds. |

### Furniture Synergies

Some furniture pairs create extra bonuses:

| Synergy | Required furniture | Effect |
| --- | --- | --- |
| Cozy Corner | Hidey House + Snuggle Sack | Adds socialization and happiness. |
| Zoomie Playground | Tunnel + Chew Toy | Extends Zoomies, increases movement, and adds enrichment. |
| Cleanup Circuit | Litter Tray + Chew Toy | Improves tray cleaning and Roomba range. |
| Royal Compost Court | Cardboard Castle + Royal Throne | Improves royal/compost odds and discounts legendary pigs. |

Furniture should make the cage feel more like a living habitat, not just a stat shop.

### Furniture Care

Owned furniture has a light condition loop. Pieces start ready, can become well-loved through care, and can become overworked after heavy cage use.

Condition states are gentle:

| State | Meaning |
| --- | --- |
| Well-loved | Adds a small bonus to the matching habitat zone or automation behavior. |
| Ready | Keeps the normal furniture bonus. |
| Overworked | Slightly weakens the matching zone or Litter Tray automation. |
| Needs care | Makes the condition penalty more noticeable, but furniture does not break. |

The Furniture section shows current condition, the affected zone, short effect copy, and a Care action. Caring for a piece costs a small amount of Beans, or Compost for the Litter Tray when Compost is available. It restores condition, adds a little stewardship care to the matching zone, lowers stress for pigs connected to that zone, logs the action, and plays cage feedback over the furniture.

### Habitat Stewardship

The Furniture section also exposes fixed-zone Habitat Stewardship. Each cage zone can be tended with a small contextual cost.

Stewardship is a light caretaking action, not a placement system. It lets the player respond directly to ecology pressure without leaving the cozy management loop.

Current stewardship rules:

- Hay Corner and Water Bottle tending costs Beans and restores a little Hay or Water.
- Water Bottle tending also clears Bottle Jam when needed.
- Litter Corner tending can spend Compost, or Beans when Compost is unavailable, and cleans nearby beans.
- Rest, play, open, and royal zones cost Beans and mainly improve comfort.
- Tended zones gain temporary care, which improves comfort and appeal.
- Pigs in or fond of a tended zone lose stress.
- Stewardship has a short cooldown per zone.

## Automation

### Litter Tray

The Litter Tray periodically attempts to auto-clean a bean near its fixed location.

Its effectiveness improves with:

- Tray Affinity.
- Cleanup Circuit.
- Automation overdrive.

### Poop Roomba

The Roomba:

- Wanders when it does not detect beans.
- Sweeps toward the nearest bean in sensor range.
- Cleans beans within its sweep radius.
- Logs automatic cleanups.
- Visually enters overdrive when fueled.

Roomba performance improves with:

- Automation overdrive.
- Cleanup Circuit.
- Compost fuel systems.

### Fuel Automation

Fuel Automation is managed from Furniture alongside automation directives.

It spends Compost to activate Roomba overdrive. Overdrive makes automation faster and improves detection/sweep performance.

Current fuel cost:

- Starts at 12 Compost.
- Reduced by Better Scoop.
- Reduced by Gentle Automation.
- Reduced by Compost Engine.
- Reduced by Compost Catalyst.
- Minimum cost is 3 Compost.

Current overdrive duration:

- 18 seconds base.
- More with Compost Catalyst.
- More with Gentle Automation.
- More with Compost Engine.
- Capped at 60 seconds stored.

### Automation Directives

Once the player has a Roomba or Litter Tray, automation can be given a directive. Directives are free mode choices, not upgrades, and are managed from Furniture alongside Fuel Automation, Litter Tray, Furniture Care, and Cage Ecology.

Current directives:

| Directive | Behavior |
| --- | --- |
| Balanced Sweep | Roomba and tray use normal nearest-bean behavior. |
| Protect Cleanliness | Automation prioritizes high-mess beans and messier zones. |
| Litter Focus | Roomba patrols the Litter Corner, and the tray gets stronger cleaning reach. |
| Rare Guard | Automation avoids special beans so the player can claim them manually. |

Directives are meant to create a management tradeoff: protect the cage, clean a problem zone, or preserve valuable beans for active play.

## Active Abilities

Abilities are direct player interventions. They are licensed through the Tech Tree and then used from the Abilities modal. Most cost Squeaks and then enter cooldown.

| Ability | Base cost | Effect |
| --- | ---: | --- |
| Wheek Call | 0 Squeaks | Calls pigs to the hay rack for 10 seconds and grants Squeaks. |
| Treat Bag | 2 Squeaks | Boosts bean production for 15 seconds. |
| Deep Clean | 5 Squeaks | Cleans all beans in the cage and then cools down. |
| Fresh Bedding | 3 Squeaks | Restores cleanliness to 100%. |
| Snack Time | 4 Squeaks | Boosts happiness and rare bean odds for 20 seconds. |
| Zoomie Mode | 3 Squeaks | Makes pigs move and produce faster for 12 seconds. |

Ability costs can be reduced by:

- Chorus Training Wisdom, which also helps the herd generate Squeaks over time.
- Squeak Training Tech Tree levels, which improve Wheek Call first, then reduce costs and improve timing.

## Contracts And Records

### Contracts Board

Contracts are optional timed care jobs that ask the player to connect several systems before the timer expires. They replace the older one-step rotating objective loop as the main short-term goal layer.

Contracts also pace mechanic discovery. Early intro Contracts point the player toward one new system at a time, and accepting those Contracts can reveal the matching dock section before the raw resource threshold would.

The player can have one active Contract at a time. When no Contract is active, the Goals modal shows up to three available offers. The quick care strip shows whether a Contract is active or waiting to be chosen.

Current first-pass Contract offers:

- Fresh Cage Delivery: clean beans, refill hay or water, then hold high cleanliness.
- Room to Nest: introduce Furniture by unlocking a habitat node or caring for one cage piece.
- First Wheek: introduce Abilities by unlocking and using Wheek Call or another active care move.
- Habitat Reset: tend different habitat zones, care for or unlock furniture, then keep average stress low.
- Cleanup Route: choose a cleanup automation directive, let automation clean beans, and handle the Litter Corner.
- Compost Starter: introduce Bean Recipes by turning Compost or rare cleanup into recipe momentum.
- Rare Sample Order: clean a rare bean, reach a Clean Streak, and hold Gold or Squeaks.
- Recipe Commission: clean recipe-minded beans, use an ability, and unlock a recipe through the Tech Tree or hold Compost.
- Council Session: keep an 8-pig herd happy and pass a Cavy Council decree.
- Great Composting Rumor: introduce the Wisdom Legacy branch by pointing a strong run toward permanent Great Composting progress.

Contracts can reward Beans, Squeaks, Compost, or a short rare-bean odds boost. They are meant to nudge the player across care, ecology, automation, abilities, recipes, herd management, and rare resources without forcing a single play style.

Expired Contracts disappear without penalty and are replaced by new offers. Pig requests remain a separate personal favor layer, but their progress hooks can feed future Contract requirements.

### Records

Records are completed milestone beats shown in the Log rather than a second active checklist. They preserve the flavor of older quests and achievements while keeping Contracts as the only active goal layer.

Current progression records:

- Clean 10 beans.
- Reach 100 Beans.
- Expand for a bigger herd.
- Unlock Better Scoop.
- Hit Clean Streak x5.
- Unlock Poop Roomba.
- Add cage furniture.
- Unlock 3 furniture pieces.
- Clean 5 rare beans.
- Use an active ability.
- Fuel automation.
- Unlock a bean recipe.
- Adopt a legendary pig.
- Learn Cavy Wisdom.
- Enter the Great Composting.

Current achievement records:

- First Bean.
- Gold Rush.
- Cage Goblin.
- Oops, All Poop.
- Bean Counter.
- The Janitor Rises.
- Wheek Shall Overcome.
- Rare Bean Counter.
- Interior Designer.
- Habitat Planner.
- Recipe Book.
- Eventful.
- Poop Baron.
- The Poopening.

## Pig Requests

One pig at a time can ask for a timed favor. Requests create short-term goals tied to care, cleanup, abilities, furniture, or resources.

If a request expires, there is no punishment beyond missing the reward.

Current requests:

| Request | Goal | Reward |
| --- | --- | --- |
| Tidy Favor | Clean 3 beans. | +18 Beans, +1 Squeak |
| Hay Favor | Refill hay near full. | +14 Beans, +5 Happiness |
| Water Favor | Refill water near full. | +14 Beans, +5 Happiness |
| Zoomie Favor | Reach Clean Streak x3. | +22 Beans, longer streak timer |
| Snack Favor | Use any active ability. | +1 Squeak, +6 Happiness |
| Furniture Favor | Unlock one new furniture item. | +26 Beans |
| Compost Favor | Reach 8 Compost. | +18 Beans, +4 Compost |
| Bond Support / Buddy Check-In / Nap Pact / Follow-Along / Rival Treaty | Keep a related pair together in a comfortable zone. | +24 Beans, +1 Squeak, stress relief |

Request selection is weighted by the pig's trait, relationship state, and the current cage state. For example, Neat Freaks are more likely to ask for tidying, Hay Goblins for hay, Drama Pigs for water, Compost Mystics for compost, and pigs with active relationship needs for pair-focused favors.

## Random Events

Events are timed situations that temporarily change the cage and offer three response choices.

Events become available based on timers and weighted conditions. After an event ends, the next event is scheduled later.

Current events:

### Zoomies

A fast movement event. Enrichment increases its weight.

Choices:

- Guide the Zoomies: starts or strengthens a clean streak.
- Ride the Chaos: grants Beans but spawns new beans.
- Channel Momentum: spends Squeaks to boost Roomba overdrive or combo energy.

### Hay Frenzy

A hay-focused event. Low hay increases its weight.

Choices:

- Emergency Timothy: restores hay.
- Let Them Feast: trades hay for Beans and happiness.
- Pack Hay Bundles: spends Beans to fully restock hay and gain a Squeak.

During Hay Frenzy, production is faster but hay pressure is higher.

### Nap Time

A calm herd event. High happiness increases its weight.

Choices:

- Protect the Nap: raises happiness.
- Quiet Cleaning: cleans the cage center but ends the current combo.
- Dream Squeaks: spends Beans to gain Squeaks.

During Nap Time, production slows.

### Bottle Jam

A water event. Low water increases its weight.

Choices:

- Fix the Bottle: clears the jam and restores water.
- Tap the Nozzle: grants Beans and water but costs some happiness.
- Use Spare Bottle: spends Beans to fully restore water.

While jammed, pigs cannot drink from the bottle.

### Cage Inspection

A cleanliness event. Very clean cages or very messy cages make it more likely.

Choices:

- Tidy the Evidence: cleans a wide area.
- Present the Cage: requires high cleanliness and grants Beans.
- Offer Squeaks: spends Squeaks for a larger Bean reward.

### Compost Bloom

A compost event. Compost reserves and Compost Catalyst make it more likely.

Choices:

- Harvest Bloom: gain Compost immediately.
- Let It Ripen: spawn compost beans.
- Fuel the System: spend Compost for overdrive, or convert to Beans if no Roomba exists.

### The Great Wheeking

A Squeak event. Squeak reserves and Chorus Training make it more likely.

The event grants Squeaks when it starts.

Choices:

- Answer the Chorus: gain Squeaks.
- Conduct the Herd: spend Beans for happiness and Squeaks.
- Echo Into Gold: spend Squeaks for a Golden Bean.

### Ecology Incidents

Zone pressure can trigger ecology-specific events such as Litter Revolt, Hidey Squabble, and Zoomie Traffic. Hidey Squabble is more likely when relationship tension is high, and Rebond Pair lowers relationship tension as well as herd stress.

## Bean Recipes

Bean Recipes are mid-to-late Tech Tree unlocks that convert rare resource history into run bonuses. Once unlocked, any repeatable recipe operation stays in the Recipes modal.

Current recipes:

### Bean Blessing

Requirements:

- 2 Golden Beans.
- 8 Squeaks.
- At least 1 Blessed bean cleaned.

Effects:

- Improves rare bean odds.
- Discounts legendary pigs.

### Compost Catalyst

Requirements:

- 40 Compost.
- 3 Compost beans cleaned.
- 2 Stinky beans cleaned.

Effects:

- Makes compost systems stronger.
- Reduces automation fuel cost.
- Increases automation fuel duration.
- Improves compost bean aging.

### Royal Accord

Requirements:

- 1 Golden Bean.
- 16 Squeaks.
- A Royal bean cleaned or a legendary pig adopted.

Effects:

- Adds pig capacity.
- Helps large-herd support.
- Discounts legendary pigs.
- Improves royal bean access.

### Singularity Experiment

Requirements:

- 100 Compost.
- 25 rare beans cleaned.
- At least 1 Cursed bean cleaned.

Effects:

- Adds cursed bean potential.
- Slowly pulls loose beans toward the cage center.
- Unlocks Run Singularity, a repeatable experiment that spends Compost and Squeaks for a stronger center pull and a short strange-bean boost.

## Late-Game Systems

Late-game systems make the game stranger and add deeper resource conversion, but they now live inside the section they most directly support instead of a separate module.

Current homes:

- Hay Dimension is no longer a standalone purchase. It opens automatically as the Better Hay capstone.
- Bean Exchange unlocks through the Tech Tree, then its trades appear in Bean Recipes because they shape rare-resource conversion.
- Golden Scoop unlocks through the Tech Tree and then works as a run-limited cleanup tool.
- Bean Singularity is no longer a standalone purchase. Its effects live in the Singularity Experiment recipe.
- Cavy Council seats itself in Herd when the player manages a large herd, then offers repeatable decrees.
- Squeak Choir is folded into Chorus Training Wisdom because both shape the Squeak ability economy.
- Great Composting appears in the Wisdom Legacy branch of the Tech Tree because it turns a run into permanent Cavy Wisdom.

### Better Hay Capstone: Hay Dimension

Unlock path:

- Reach Better Hay level 7.

Effects:

- Slows hay drain.
- Makes pigs produce faster.
- Adds a little furniture/habitat room.

### Bean Exchange

Unlock cost:

- 1200 Beans.
- 2 Golden Beans.

Unlocks trades:

- 250 Beans -> 20 Compost.
- 30 Compost -> 5 Squeaks.
- 1 Golden Bean -> 300 Beans.
- 20 Squeaks + 150 Beans -> 1 Golden Bean.

### Herd Council: Cavy Council

Convenes when:

- The herd reaches 8 pigs.
- Old saves that already unlocked Cavy Council keep it seated.

Effects:

- Adds social stability for large herds.
- Helps large-herd happiness.
- Unlocks repeatable Council Decrees.
- Can appear as a Council Session Contract that asks the player to keep morale high and pass a decree.

Council Decrees:

- Care Mandate: spend 6 Squeaks for +30 Hay, +30 Water, and +4 Happiness.
- Cleanup Ordinance: spend 8 Squeaks to clean a wide center area.
- Herd Charter: spend 10 Squeaks to gain +75 Beans and +1 Golden Bean, requiring a large happy herd.

### Chorus Training Choir

Unlock path:

- Learn Bonded Beginnings.
- Learn Social Memory.
- Spend 3 Wisdom on Chorus Training.

Effects:

- Generates Squeaks over time.
- Reduces active ability costs by 1.
- Makes Wheek Call grant more Squeaks.

## Prestige: The Great Composting

The Great Composting is the prestige reset and is run from the Wisdom Legacy branch of the Tech Tree.

Requirement:

- 5000 unclaimed lifetime Beans.

Wisdom gain:

- At least 1 Cavy Wisdom.
- Scales with the square root of lifetime Bean progress over the prestige cost.

On prestige:

- Gain Cavy Wisdom.
- Reset current Beans, Compost, Squeaks, and Golden Beans.
- Clear beans from the cage.
- Remove robot and overdrive.
- Reset feed, scoop, and cage upgrades.
- Reset furniture.
- Reset recipes.
- Reset late-game unlocks.
- Reset run-scoped Tech Tree levels and ability licenses.
- Restore hay, water, and cleanliness.
- Return the herd to two pigs.
- Reset events and Contracts.
- Keep Wisdom and learned Wisdom perks.
- Increase prestige count.

The Great Composting should feel like turning a messy, productive run into permanent caretaking knowledge.

## Tech Tree: Wisdom Legacy

Wisdom Legacy is permanent progression purchased with Cavy Wisdom inside the Tech Tree.

The tree has four branches:

- Care
- Herd
- Automation
- Rare Beans

Each branch currently has three tiers. Later tiers require the previous tier in that branch.

### Care Branch

| Perk | Cost | Effect |
| --- | ---: | --- |
| Roomy Start | 1 Wisdom | +2 pig capacity and more cage space. |
| Steady Supplies | 2 Wisdom | Hay and water drain 10% slower. |
| Fresh Start | 3 Wisdom | Cleanliness gets a permanent +3 cushion. |

### Herd Branch

| Perk | Cost | Effect |
| --- | ---: | --- |
| Bonded Beginnings | 1 Wisdom | Bonded pigs add more socialization. |
| Social Memory | 2 Wisdom | Every bonded pig adds extra socialization. |
| Chorus Training | 3 Wisdom | Ability costs drop, Wheek Call gives more Squeaks, and the herd generates Squeaks over time. |

### Automation Branch

| Perk | Cost | Effect |
| --- | ---: | --- |
| Gentle Automation | 1 Wisdom | Roomba and Compost fuel are cheaper. |
| Compost Engine | 2 Wisdom | Compost fuel is cheaper and compost beans age better. |
| Tray Affinity | 3 Wisdom | Litter Tray cleans farther and more often. |

### Rare Beans Branch

| Perk | Cost | Effect |
| --- | ---: | --- |
| Rare Instinct | 1 Wisdom | Rare bean odds and enrichment improve. |
| Golden Nose | 2 Wisdom | Golden beans are more likely and worth more. |
| Royal Memory | 3 Wisdom | Legendary pigs cost less and royal bean odds improve. |

Total Wisdom also slightly improves production speed.

### Caretaker Philosophies

After learning any tier-3 Wisdom perk, the player can choose one permanent Caretaker Philosophy. The choices are mutually exclusive and persist through Great Composting.

| Philosophy | Direction | Connected systems |
| --- | --- | --- |
| Gentle Care | Lower-pressure habitat care. | Furniture Care, Habitat Stewardship, hay/water drain, pig stress, Contracts. |
| Automation Steward | Operational cleanup mastery. | Automation fuel, directives, Roomba overdrive, cleanup Contracts, Furniture. |
| Rare Bean Alchemy | Strange-bean economy. | Rare bean odds, Singularity Experiment, rare Contracts, recipes. |

The Tech Tree explains the tradeoff before selection. The chosen philosophy is meant to make later runs feel more like a caretaker style than another checklist perk.

## Progression Arc

### Phase 1: First Cage

Primary beats:

- Learn to click beans.
- See Beans increase.
- Refill hay and water.
- Hit first Clean Streak.
- Unlock Better Scoop or Better Hay.

Design goal:

- Make the first pig/bean interaction readable and satisfying immediately.

### Phase 2: Herd Growth

Primary beats:

- Adopt more pigs.
- Manage faster mess accumulation.
- Expand the cage.
- Watch traits create different behavior patterns.
- Start caring about happiness, space, and cleanliness.

Design goal:

- Make growth feel exciting but slightly messy.

### Phase 3: Habitat Optimization

Primary beats:

- Buy furniture.
- Trigger furniture synergies.
- Use the Litter Tray and Poop Roomba.
- Handle pig requests and Contracts.
- Start earning rare resources.

Design goal:

- Shift from pure clicking to light management decisions.

### Phase 4: Rare Economy

Primary beats:

- Clean rare beans.
- Use Squeak abilities.
- Unlock Bean Recipes.
- Adopt legendary pigs.
- Fuel automation with Compost.

Design goal:

- Make multiple systems depend on each other: care, cleanup, traits, rare drops, and upgrades.

### Phase 5: Late-Game Systems

Primary beats:

- Push Better Hay into its Hay Dimension capstone.
- Unlock Bean Exchange.
- Build a large herd to seat Cavy Council.
- Turn Chorus Training into passive Squeak support.
- Unlock and run the Singularity Experiment.

Design goal:

- Let the game become funny, strange, and more systemic without losing the cage-management foundation.

### Phase 6: Great Composting

Primary beats:

- Reach 5000 prestige progress.
- Convert the run into Cavy Wisdom.
- Choose permanent perks.
- Start again with better long-term support.

Design goal:

- Provide a reset that feels like a cozy ascension rather than a full loss.

## Current Open Design Questions

These are current design areas that are intentionally first-pass or still need deeper decisions:

- Cage zones are fixed. Future versions may allow tile painting or player placement.
- Furniture is auto-placed. Future versions may allow manual placement and footprints.
- Random events are timer-driven. Future versions may use event decks, quest chains, or stronger state-based arcs.
- Wisdom perks are non-exclusive. Future versions may add mutually exclusive choices.
- Special bean aging currently mixes reward and cleanliness pressure. Future tuning should decide how much the game should reward waiting.
- Late-game systems have first-pass effects but need deeper decisions and clearer section-level interactions.
- Pig relationships have a first-pass web; future versions may add deeper history, more events, and longer arcs.
- Furniture care could later gain piece-specific events, pig preferences, or recipe-family hooks.
- Contracts could gain deeper offer weighting, pig-request tie-ins, event-chain handoffs, and recipe-family commissions.
- Automation directives could later gain deeper mode-specific upgrades or event interactions.
- Recipe families and Wisdom specializations could make long-term runs feel more distinct.
- Minigames are deferred until the main management loop is more tuned.

## Design Principles For Future Changes

- Keep the cage as the center of the game.
- Make every new system visible to the player through the cage, HUD, log, or modal copy.
- Prefer cozy management tension over harsh punishment.
- Make pig identity matter through behavior, requests, moods, and production quirks.
- Let upgrades interact with existing systems instead of becoming isolated bonuses.
- Reveal deeper mechanics when they become actionable instead of showing dormant late-game surfaces from the first minute.
- Preserve recovery paths after neglect or pig death.
- Explain late-game purchases directly when the effect is not obvious.
- Treat absurdity as a reward for mastering the simple care loop.
