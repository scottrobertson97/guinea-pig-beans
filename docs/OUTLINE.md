This is genuinely a good incremental game premise because the **action is stupidly concrete**: guinea pig wanders → guinea pig poops → player cleans poop → poop becomes progress. That is a clean loop. The danger is making “water and hay” feel like annoying punishment instead of satisfying upkeep. So I’d design it as a cozy management loop, not a survival sim.

## Working title ideas

**Poop Piggies**
**Cage Keeper**
**Guinea Pig Janitor**
**The Poopening**
**Cavy Clicker**
**Poo Poo Pasture**
**Compost Cavies**

My favorite is probably **Cavy Clicker** if you want cute, or **The Poopening** if you want unhinged.

---

# Core Game Loop

The basic loop should be:

**Pig poops → player cleans poop → poop becomes currency → player buys upgrades → pigs poop faster / more efficiently / more chaotically.**

The first 60 seconds should be extremely simple:

1. You see a small cage from above.
2. One guinea pig waddles around.
3. It drops a poop pellet every few seconds.
4. You click the poop to clean it.
5. Your “Poop” or “Compost” counter goes up.
6. You buy a second guinea pig or better hay.
7. Now the cage starts getting messier faster.

That is enough for the MVP.

---

# Main Resources

I’d use a few resources, but not too many at first.

## Poop / Compost

This is the main currency.

You can call it:

* **Poops** for maximum comedy.
* **Compost** for a slightly cleaner fantasy.
* **Beans** because guinea pig poops look like little beans.
* **Pellets** if you want it cute.

I honestly like **Beans** as the displayed currency:

> Beans: 47

Then upgrades can say things like:

> “Spend 25 Beans on Better Hay.”

It is funnier without being too gross.

## Hay

Hay is both a need and a production modifier.

When hay is full, pigs are happy and poop normally.
When hay gets low, pigs slow down.
When hay is upgraded, pigs poop faster or produce better-value beans.

## Water

Water should be a light maintenance task.

Do not make the player constantly refill water every 20 seconds. That becomes irritating. Instead:

* Water slowly drains based on pig count.
* Full water gives a poop-speed bonus.
* Empty water does **not** kill pigs or hard-stop the game.
* Empty water just reduces happiness/productivity.

## Happiness

This can be a hidden or visible multiplier.

Happiness goes up from:

* Clean cage
* Full hay
* Full water
* Toys
* Bigger cage
* More hides
* Better bedding

Happiness affects:

* Poop interval
* Movement speed
* Chance of special poops
* Pig adoption rate

---

# The Main Screen

Top-down cage view.

## Visible objects

* Guinea pigs wandering
* Poop pellets
* Hay rack
* Water bottle
* Food bowl
* Hidey houses
* Toys
* Bedding tiles
* Upgrade objects

## Player actions

At first:

* Click poop to clean it.
* Click hay rack to refill hay.
* Click water bottle to refill water.
* Click shop buttons to buy upgrades.

Later:

* Drag broom over poop.
* Hire auto-cleaners.
* Add litter trays.
* Place cage furniture.
* Expand the cage.
* Optimize pig movement.

The key is that the cage should visually evolve. Early game: tiny barren cage. Late game: sprawling guinea pig mansion full of chaos.

---

# Guinea Pig Behavior

Each pig should have simple AI:

```js
Pig {
  id
  name
  x, y
  direction
  speed
  poopTimer
  poopInterval
  hungerRate
  thirstRate
  happiness
  breed
}
```

Behavior loop:

1. Pick random target point in cage.
2. Waddle toward it.
3. Occasionally pause, wiggle, squeak, or popcorn.
4. Poop after timer reaches zero.
5. Repeat.

Important: pigs should feel alive, not like production machines. Add tiny idle animations:

* Wiggle nose
* Popcorn jump
* Zoomie burst
* Eat hay
* Drink water
* Hide in tunnel
* Follow another pig
* Sit dramatically in their own filth

That personality will carry the game.

---

# Poop Mechanics

A poop object can be simple:

```js
Poop {
  id
  x, y
  value
  age
  type
}
```

Basic poop gives 1 Bean.

Later, special poops:

| Type            | Effect                                     |
| --------------- | ------------------------------------------ |
| Normal Bean     | +1                                         |
| Golden Bean     | Big value bonus                            |
| Compost Clump   | Appears when many poops are close together |
| Hay-Fed Bean    | Higher value from better feed              |
| Rainbow Bean    | Rare bonus from max happiness              |
| Suspicious Bean | Maybe a joke event                         |

Aging could matter too. For example:

* Fresh poop: 1 Bean
* Aged poop: 2 Beans, but lowers cage cleanliness
* Too much poop: pigs get unhappy

This creates a nice decision: clean immediately for order, or let mess build for bonus but risk lower happiness.

---

# Upgrades

## Pig upgrades

* Adopt New Guinea Pig
* Faster Pig
* Happier Pig
* Chunkier Pig
* Fancy Breed
* Rescue Pig
* Elder Pig with wisdom bonus
* Baby Pig with fast zoomies

Each pig could have a trait:

| Trait   | Effect                          |
| ------- | ------------------------------- |
| Chonky  | Poops slower but higher value   |
| Zoomy   | Moves fast and poops randomly   |
| Fancy   | Higher happiness bonus          |
| Gremlin | Poops more when cage is dirty   |
| Royal   | Increases value of nearby poops |
| Shy     | Poops near hidey houses         |

This gives the player something to care about besides raw numbers.

## Cage upgrades

* Bigger Cage
* Better Bedding
* Fleece Liners
* Corner Litter Tray
* Hay Loft
* Water Bottle Upgrade
* Tunnel System
* Hidey House
* Poop Scoop
* Mini Vacuum
* Auto Janitor Bot
* Compost Bin
* Deluxe Cavy Condo

## Feed upgrades

* Basic Hay
* Timothy Hay
* Orchard Grass
* Gourmet Hay Blend
* Vitamin Snacks
* Bell Pepper Feast
* Forbidden Lettuce
* Supreme Poop Fuel

Feed should mostly affect poop production:

```txt
Better feed = faster poop rate + better poop value + higher happiness
```

## Automation upgrades

This is where the incremental game becomes addictive.

Early automation:

* **Poop Magnet**: pulls poop slightly toward cursor.
* **Better Scoop**: click radius increases.
* **Hay Rack XL**: hay lasts longer.
* **Big Water Bottle**: water lasts longer.

Mid automation:

* **Litter Tray**: pigs have chance to poop in one place.
* **Roaming Dustpan**: auto-cleans one poop every few seconds.
* **Compost Bin**: converts aged poop into bonus Beans.
* **Snack Dispenser**: auto-refills hay slowly.

Late automation:

* **CavyBot 3000**: auto-cleans poop.
* **Guinea Pig Union**: pigs organize for better poop output.
* **Infinite Hay Dimension**: hay never runs out.
* **Poop Singularity**: prestige mechanic.

---

# Keep-Up Tasks Without Making Them Annoying

This part matters.

The player should not feel like they are being punished for having more pigs. The upkeep tasks should become part of optimization.

## Hay

Hay decreases slowly.

When full:

```txt
+20% poop speed
```

When low:

```txt
-20% poop speed
```

When empty:

```txt
Pigs wander sadly and poop slowly.
```

Upgrade path:

* Bigger hay rack
* Auto-hay dispenser
* Premium hay
* Hay aura affecting nearby pigs

## Water

Water decreases slowly.

When full:

```txt
+10% happiness
```

When low:

```txt
No bonus
```

When empty:

```txt
-25% happiness
```

Upgrade path:

* Larger bottle
* Dual bottle
* Auto-refill bottle
* Sparkling mineral pig water

## Cage Cleanliness

This should be the main tension.

Clean cage:

```txt
Higher happiness, special poop chance
```

Dirty cage:

```txt
More poop on screen, but lower happiness
```

Very dirty cage:

```txt
Pigs slow down, hay/water bonuses reduced
```

This gives the player meaningful choices: do I clean constantly, or let chaos build until I have a big sweep?

---

# The Fun Part

The fun is not merely “clicking poop.”

The fun is watching a tiny living system become increasingly ridiculous.

Early game:

> “Aw, one pig pooped. Click.”

Mid game:

> “There are seven pigs, two litter trays, and I’m trying to keep the hay rack full while saving for the fleece liner upgrade.”

Late game:

> “My guinea pig empire produces 14,000 beans per minute, but the Abyssinian Gremlin keeps pooping behind the tunnel system.”

The emotional arc should be:

**cute → messy → optimized → absurd → cosmic.**

---

# Progression Structure

## Phase 1: Tiny Cage

* One pig
* Manual cleaning
* Manual hay/water
* Buy second pig
* Buy better scoop

## Phase 2: Herd Management

* More pigs
* Bigger cage
* Hay and water upgrades
* Toys and hides
* First automation

## Phase 3: Poop Economy

* Compost bin
* Special poops
* Pig traits
* Litter zones
* Feed strategy

## Phase 4: Cavy Empire

* Multiple cage rooms
* Auto-clean systems
* Pig breeding/adoption
* Prestige layer
* Rare breeds

## Phase 5: Mystical Guinea Pig Ascension

Because it’s you, I’d absolutely add a weird mythic late-game layer.

Prestige could be called:

* **The Great Composting**
* **Ascension**
* **The Sacred Sweep**
* **Enter the Hay Realm**
* **The Poopening**

Prestige resets your cage but gives you permanent bonuses:

* Ancient Hay Wisdom
* Eternal Water Bottle
* Golden Bean Chance
* Cleaner Karma
* Cavy Blessings

---

# MVP Version

Build this first. Nothing else matters until this is fun.

## MVP features

1. Canvas with a cage background.
2. One guinea pig sprite wandering randomly.
3. Pig drops poop every 5 seconds.
4. Player clicks poop to remove it.
5. Counter increases.
6. Button to buy another pig.
7. Button to buy feed upgrade that reduces poop interval.
8. Hay and water meters.
9. Hay/water slowly drain.
10. Refill buttons restore hay/water.
11. Low hay/water slows poop generation.

That is the whole first playable game.

Do **not** start with saving, prestige, complex UI, multiple breeds, or fancy art. Get the one-pig poop loop working first.

---

# Suggested First Balance Numbers

Start simple:

```txt
Starting pig count: 1
Starting poop interval: 5 seconds
Poop value: 1 Bean
New pig cost: 15 Beans
Feed upgrade cost: 25 Beans
Feed upgrade effect: -10% poop interval
Hay capacity: 100
Water capacity: 100
Hay drain: 0.5 per pig per second
Water drain: 0.25 per pig per second
Low hay penalty: -30% poop speed
Low water penalty: -20% poop speed
```

Scaling:

```txt
New pig cost = 15 * 1.35 ^ pigCount
Feed upgrade cost = 25 * 1.6 ^ feedLevel
Cage upgrade cost = 50 * 2 ^ cageLevel
```

Keep the numbers readable early. The player should understand what is happening.

---

# UI Layout

Top bar:

```txt
Beans: 42
Pigs: 3
Cleanliness: 87%
Hay: 72%
Water: 91%
```

Main area:

```txt
Top-down cage
Pigs wandering
Poop pellets visible
Hay rack and water bottle clickable
```

Right sidebar:

```txt
Shop
- Adopt Pig
- Better Hay
- Bigger Water Bottle
- Better Scoop
- Bigger Cage
```

Bottom log, optional:

```txt
Muffin made a bean.
You cleaned 3 beans.
Nugget is out of hay and judging you.
```

The log could add a lot of charm.

---

# Code Architecture

For the first version, I’d structure it around simple systems.

```txt
/game
  main.js
  state.js
  entities/
    Pig.js
    Poop.js
  systems/
    movementSystem.js
    poopSystem.js
    needsSystem.js
    cleaningSystem.js
    renderSystem.js
  ui/
    shop.js
    hud.js
```

Even if you keep it in one file at first, mentally separate these concepts:

## State

```js
const gameState = {
  beans: 0,
  pigs: [],
  poops: [],
  upgrades: {
    feedLevel: 0,
    scoopLevel: 0,
    cageLevel: 0,
    waterLevel: 0,
    hayLevel: 0,
  },
  needs: {
    hay: 100,
    water: 100,
  },
  cage: {
    width: 640,
    height: 480,
    cleanliness: 100,
  },
};
```

## Game loop

```js
function update(deltaTime) {
  updateNeeds(deltaTime);
  updatePigs(deltaTime);
  updatePoopProduction(deltaTime);
  updateCleanliness();
}

function render() {
  drawCage();
  drawPoops();
  drawPigs();
  drawHud();
}
```

## Core pig poop logic

```js
function updatePoopProduction(deltaTime) {
  for (const pig of gameState.pigs) {
    pig.poopTimer -= deltaTime;

    if (pig.poopTimer <= 0) {
      spawnPoop(pig.x, pig.y);
      pig.poopTimer = getPigPoopInterval(pig);
    }
  }
}
```

## Poop interval

```js
function getPigPoopInterval(pig) {
  const base = 5;
  const feedMultiplier = Math.pow(0.9, gameState.upgrades.feedLevel);
  const hayPenalty = gameState.needs.hay <= 0 ? 1.3 : 1;
  const waterPenalty = gameState.needs.water <= 0 ? 1.2 : 1;

  return base * feedMultiplier * hayPenalty * waterPenalty;
}
```

That gives you the first interesting design lever: upgrades reduce time, neglect increases time.

---

# Art Direction

I’d go with **cute, flat, slightly chaotic pixel-ish art**.

Not full pixel art necessarily, but simple top-down shapes:

* Guinea pigs are rounded potatoes with ears.
* Poops are tiny dark ovals.
* Hay is yellow-green scribbles.
* Water bottle is a blue rectangle with a metal spout.
* Cage is a soft rectangle with bedding texture.

The pigs should have names. That matters.

Examples:

* Muffin
* Bean
* Pickle
* Waffle
* Niblet
* Turnip
* Goblin
* Lady Squeakerton
* Poopert
* Professor Wheek

The game becomes much funnier when the log says:

> Professor Wheek made a suspicious bean.

---

# Strong Design Choice

I would make **cleaning poop the active clicker action**, but make **cage design the strategy layer**.

So not just:

> Buy upgrade, number go up.

But:

> Where do I place the hay rack? Where do pigs tend to poop? Can I make them poop near the litter tray? Do tunnels affect their paths? Can I optimize cage layout?

That turns it from a basic clicker into a light management sim.

You do not need full pathfinding at first. Even basic random wandering can create the illusion of life.

---

# Best First Build Milestone

Your first milestone should be:

> “One guinea pig wanders around a cage, poops, and I can click the poop to gain Beans.”

That’s the heartbeat. Everything else is decoration until that feels good.

After that, add:

1. New pig button.
2. Feed upgrade.
3. Hay/water meters.
4. Bigger cage.
5. Auto-cleaner.

Once those work, you have an actual game loop.

The secret is to make the first pig charming enough that cleaning its poop feels funny instead of tedious. The whole game lives or dies on that tiny emotional transaction: **“you little idiot, fine, I’ll clean that.”**
