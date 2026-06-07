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
- Converts rare resources into abilities, recipes, automation fuel, mythic systems, and permanent Wisdom.

## Current Player Interface

The game is built around one primary playfield and several supporting sections.

The persistent screen shows:

- The cage playfield with pigs, beans, hay, water, furniture, dirt, and automation.
- Top stats: Beans, Pigs, Cleanliness, Streak, Compost, Squeaks, Gold, Wisdom, and Furniture.
- Quick care meters for Hay, Water, and Happiness.
- A current Objective.
- Persistent utility controls for sound, save status, and reset.

The section dock opens modal sections:

- Care
- Shop
- Furniture
- Abilities
- Recipes
- Mythos
- Wisdom
- Herd
- Goals
- Log

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
- A starting objective: "Clean 3 beans quickly."

The two starting pigs enter as a bonded pair. This matters because bonding contributes to the socialization layer, and because the game treats two pigs as the healthy baseline herd.

## Core Loop

The main loop is:

1. Pigs move around the cage and produce beans.
2. Beans reduce cleanliness while they remain in the cage.
3. The player clicks beans to clean them.
4. Cleaning awards Beans and sometimes rare resources.
5. Quick repeated cleaning builds a Clean Streak for bonus Beans.
6. Beans purchase upgrades, pigs, cage expansions, furniture, and automation.
7. Better care, more space, furniture, abilities, events, and Wisdom improve production.
8. More production creates more mess and more opportunities.

The loop creates a soft tension between:

- Cleaning quickly to protect happiness and cleanliness.
- Letting some beans age or cluster for higher value.
- Spending resources on growth versus support.
- Expanding the herd versus keeping the cage livable.

## Resources

### Beans

Beans are the main currency. The player earns them primarily by cleaning beans in the cage. Beans buy pigs, upgrades, furniture, automation, mythic unlocks, and some event or trade choices.

Lifetime Beans also drive prestige progress.

### Compost

Compost is a secondary resource earned mainly from compost beans and some request or event rewards. It is used for:

- Fueling automation overdrive.
- Unlocking Compost Catalyst.
- Unlocking Hay Dimension.
- Unlocking Bean Singularity.
- Bean Exchange trades.

### Squeaks

Squeaks are an active-ability resource. They come from blessed beans, requests, events, Wheek Call, and late-game Squeak Choir.

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

Cavy Wisdom is the prestige currency. It is gained through the Great Composting and spent on permanent Wisdom perks.

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
- Legendary status, if applicable.
- Individual Hunger, Thirst, and Energy.
- Current goal.
- Current mood.

The roster is meant to make pigs feel like individual residents rather than anonymous production units.

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

### Bonds

Pigs can enter as bonded pairs. Bonded pigs add socialization, and Wisdom can increase the value of bonds.

If a pig dies, any surviving bonded partner loses that bond.

### Individual Needs

Each pig tracks:

- Hunger.
- Thirst.
- Energy.

These needs drain over time. Pigs make decisions based on the weakest needs.

Current goal thresholds:

- Hunger at 38% or lower can trigger Eating if hay is available.
- Thirst at 35% or lower can trigger Drinking if water is available and the bottle is not jammed.
- Energy at 28% or lower can trigger Sleeping.

Current satisfaction thresholds:

- Eating and drinking try to recover the relevant need to 86%.
- Sleeping tries to recover Energy to 88%.

### Pig Goals

Current goals:

- Roam
- Eat
- Drink
- Sleep

Pigs normally roam to target points. When a need crosses a threshold, the pig chooses a goal and moves toward the relevant area:

- Eating targets the hay rack.
- Drinking targets the water bottle.
- Sleeping targets the Snuggle Sack or Hidey House when available, otherwise a normal cage spot.
- Roaming can be biased by traits and furniture.

After satisfying a goal, the pig returns to roaming.

### Pig Mood

Current moods:

- Content
- Hungry
- Thirsty
- Messy

Mood is based on hunger, thirst, cleanliness, happiness, and space.

Mood affects movement and visual state:

- Content pigs move normally.
- Hungry or thirsty pigs move less efficiently.
- Messy pigs move slower and look visually subdued.

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
- Hay Dimension slows hay drain.
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
- Hay Dimension.
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
| Cursed | 12 | High value, higher cleanliness pressure, tied to Bean Singularity or very dirty cages. |
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
- Objective progress.
- Quest and achievement progress.
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

## Shop Progression

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

Better Hay improves production by multiplying the pig production interval by 0.9 per level.

Current pricing:

- `18 * 1.6 ^ level`, rounded up.

### Better Scoop

Better Scoop increases manual cleanup radius and makes the Roomba cheaper.

Current pricing:

- `14 * 1.7 ^ level`, rounded up.

### Poop Roomba

Purchases an automatic cleaner that wanders the cage, detects nearby beans, and sweeps them.

Current pricing:

- Starts from 75 Beans.
- Reduced by Better Scoop.
- Reduced by Gentle Automation.
- Minimum cost is 45 Beans.

### Fuel Automation

Spends Compost to activate Roomba overdrive.

Overdrive makes automation faster and improves detection/sweep performance.

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

### Bigger Cage

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

Furniture is currently purchased as one-time static cage unlocks. The player does not place furniture manually yet.

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

## Active Abilities

Abilities are direct player interventions. Most cost Squeaks and then enter cooldown.

| Ability | Base cost | Effect |
| --- | ---: | --- |
| Wheek Call | 0 Squeaks | Calls pigs to the hay rack for 10 seconds and grants Squeaks. |
| Treat Bag | 2 Squeaks | Boosts bean production for 15 seconds. |
| Deep Clean | 5 Squeaks | Cleans all beans in the cage and then cools down. |
| Fresh Bedding | 3 Squeaks | Restores cleanliness to 100%. |
| Snack Time | 4 Squeaks | Boosts happiness and rare bean odds for 20 seconds. |
| Zoomie Mode | 3 Squeaks | Makes pigs move and produce faster for 12 seconds. |

Ability costs can be reduced by:

- Chorus Training Wisdom.
- Squeak Choir.

## Objectives, Quests, And Achievements

### Rotating Objectives

The player always has a timed objective.

Starting objective:

- Clean 3 beans quickly.

Current objective cycle includes:

- Clean 5 beans quickly.
- Keep clean above 80%.
- Clean more rare beans.
- Use an active ability.
- Unlock furniture.
- Hold 75 Beans.
- Keep a larger herd happy.
- Fuel automation with Compost.
- Unlock a bean recipe.

Completing an objective awards Beans. The reward starts at 8 Beans and increases by 3 for each completed objective.

Expired objectives are replaced by the next objective.

### Quests

Quests are longer progression milestones. Current quest beats:

- Clean 10 beans.
- Reach 100 Beans.
- Expand for a bigger herd.
- Buy Better Scoop.
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

### Achievements

Achievements are broader accomplishments and jokes. Current achievements:

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

Request selection is weighted by the pig's trait and the current cage state. For example, Neat Freaks are more likely to ask for tidying, Hay Goblins for hay, Drama Pigs for water, and Compost Mystics for compost.

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
- Echo Into Mythos: spend Squeaks for a Golden Bean.

## Bean Recipes

Bean Recipes are mid-to-late progression unlocks that convert rare resource history into permanent run bonuses.

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

## Mythos And Late Game

Mythos systems make the game stranger and add late-game resource conversion.

### Hay Dimension

Unlock cost:

- 750 Beans.
- 25 Compost.

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

### Cavy Council

Unlock requirements:

- 8 pigs.
- 10 Squeaks.

Effects:

- Adds social stability for large herds.
- Helps large-herd happiness.
- Unlocks repeatable Council Decrees.

Council Decrees:

- Care Mandate: spend 6 Squeaks for +30 Hay, +30 Water, and +4 Happiness.
- Cleanup Ordinance: spend 8 Squeaks to clean a wide center area.
- Herd Charter: spend 10 Squeaks to gain +75 Beans and +1 Golden Bean, requiring a large happy herd.

### Squeak Choir

Unlock cost:

- 25 Squeaks.

Effects:

- Generates Squeaks over time.
- Reduces active ability costs by 1.
- Works especially well with Chorus Training.

### Bean Singularity

Unlock requirements:

- 100 Compost.
- 25 rare beans cleaned.

Effects:

- Adds cursed bean potential.
- Slowly pulls loose beans toward the cage center.

This is a risk/reward late-game system: it improves clustering and strange bean access while making the cage feel less normal.

## Prestige: The Great Composting

The Great Composting is the prestige reset.

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
- Reset Mythos unlocks.
- Restore hay, water, and cleanliness.
- Return the herd to two pigs.
- Reset events and objectives.
- Keep Wisdom and learned Wisdom perks.
- Increase prestige count.

The Great Composting should feel like turning a messy, productive run into permanent caretaking knowledge.

## Wisdom Tree

Wisdom is permanent progression purchased with Cavy Wisdom.

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
| Chorus Training | 3 Wisdom | Ability costs drop and Wheek Call gives more Squeaks. |

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

## Progression Arc

### Phase 1: First Cage

Primary beats:

- Learn to click beans.
- See Beans increase.
- Refill hay and water.
- Hit first Clean Streak.
- Buy Better Scoop or Better Hay.

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
- Handle pig requests and rotating objectives.
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

### Phase 5: Mythos

Primary beats:

- Unlock Hay Dimension.
- Unlock Bean Exchange.
- Build a large herd for Cavy Council.
- Generate Squeaks through Squeak Choir.
- Unlock Bean Singularity.

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
- Late-game Mythos systems have first-pass effects but need deeper dedicated decisions and interfaces.
- Pig relationships could expand beyond bonded pairs into buddies, rivals, nap partners, or shy followers.
- Furniture could develop well-loved or overworked condition states that create care tasks.
- Orders or contracts could ask for specific bean, care, combo, ecology, or rare-resource outcomes.
- Automation could support player-chosen directives instead of only cleaning the nearest bean.
- Recipe families and Wisdom specializations could make long-term runs feel more distinct.
- Minigames are deferred until the main management loop is more tuned.

## Design Principles For Future Changes

- Keep the cage as the center of the game.
- Make every new system visible to the player through the cage, HUD, log, or modal copy.
- Prefer cozy management tension over harsh punishment.
- Make pig identity matter through behavior, requests, moods, and production quirks.
- Let upgrades interact with existing systems instead of becoming isolated bonuses.
- Preserve recovery paths after neglect or pig death.
- Explain late-game purchases directly when the effect is not obvious.
- Treat absurdity as a reward for mastering the simple care loop.
