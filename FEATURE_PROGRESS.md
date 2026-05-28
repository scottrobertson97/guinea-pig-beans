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
- Cage furniture: Hidey House, Tunnel, Litter Tray, Chew Toy, Snuggle Sack, Cardboard Castle, and Royal Throne can be purchased as passive objects.
- Additional needs/resources: Enrichment, Socialization, Space, Compost, Squeaks, Golden Beans, and Cavy Wisdom are tracked.
- Random events: Zoomies, Hay Frenzy, Nap Time, Bottle Jam, Cage Inspection, Compost Bloom, and The Great Wheeking can trigger.
- Pig social mechanics: bonded pairs are assigned as pigs join, and herd size contributes socialization.
- Active abilities: Wheek Call, Treat Bag, Deep Clean, Fresh Bedding, Snack Time, and Zoomie Mode are available with cooldowns.
- Rare/legendary pigs: legendary pig adoption uses Beans plus Golden Beans and creates stronger named pigs.
- Prestige: The Great Composting resets the run and grants Cavy Wisdom.
- Late-game mythos: Hay Dimension, Bean Exchange, Cavy Council, Squeak Choir, and Bean Singularity have first-pass unlocks.

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
- Furniture is purchased as passive cage objects, not yet freely placed with footprints.
- Random events are timer-based, not yet driven by quest chains or event decks.
- Active abilities use cooldowns only; they do not yet cost Squeaks or Beans.
- Prestige grants Wisdom and resets the run, but permanent upgrade choices are not yet a full tree.
- Late-game systems unlock passive effects, but they need deeper dedicated interfaces and decisions.
- Minigames are still intentionally deferred until the main loop has more tuning data.

## Design Decisions Needed Later

- Whether the next cage-zone step should be drag-and-drop furniture placement or tile painting.
- Whether special poop aging should reward waiting more aggressively or mostly punish mess.
- Whether active abilities should remain cooldown-only or spend Squeaks.
- Whether Cavy Wisdom should become a permanent upgrade tree or stay as a global multiplier for the next pass.
