# Pig Lifecycle Diagram

This diagram shows how guinea pigs flow between simulation goal states. Mood and popcorn jumps are parallel presentation layers, not saved lifecycle goals.

```mermaid
stateDiagram-v2
  [*] --> Roam

  state "Roam / Idle Targeting" as Roam
  state "Choose Activity" as Choose
  state "Seek Food" as SeekFood
  state "Eat" as Eat
  state "Seek Water" as SeekWater
  state "Drink" as Drink
  state "Seek Sleep" as SeekSleep
  state "Sleep" as Sleep
  state "Seek Play" as SeekPlay
  state "Play With Pig" as PlayPig
  state "Play With Furniture" as PlayFurniture

  Roam --> Roam: move toward roam/trait target
  Roam --> Choose: goalTimer <= 0

  Choose --> SeekFood: urgent/weighted food\nand hunger not satisfied
  Choose --> SeekWater: urgent/weighted water\nand thirst not satisfied
  Choose --> SeekSleep: urgent/weighted rest\nand energy not restored
  Choose --> SeekPlay: urgent/weighted play/social
  Choose --> Roam: roam chosen\nor need already satisfied

  SeekFood --> Eat: near hay rack\nand hay available
  SeekFood --> Roam: hunger satisfied
  Eat --> SeekFood: away from hay\nor hay empty
  Eat --> Roam: hunger satisfied\nand eat timer done

  SeekWater --> Drink: near bottle\nwater available\nnot jammed
  SeekWater --> Roam: thirst satisfied
  Drink --> SeekWater: away from bottle\nor water empty/jammed
  Drink --> Roam: thirst satisfied\nand drink timer done

  SeekSleep --> Sleep: reaches sleep target
  SeekSleep --> Roam: energy restored
  Sleep --> SeekSleep: moved away from sleep target
  Sleep --> Roam: energy restored\nand sleep timer done

  SeekPlay --> PlayPig: nearby seeking-play partner\nand relationship score OK
  SeekPlay --> PlayFurniture: search timer expires\nwithout partner
  PlayPig --> Roam: social play timer done
  PlayFurniture --> Roam: furniture play timer done

  note right of Choose
    Urgent lifecycle pressure wins first:
    food, water, rest, play/social,
    or comfort -> sleep when rest pressure exists.
    Otherwise pigs roll weighted activity:
    roam, food, water, sleep, play.
  end note

  note right of Roam
    chooseTarget() redirects roam by
    current goal, Wheek Call, trait,
    favorite zones, furniture, or poop.
  end note

  note right of Roam
    Mood is parallel, not a goal state:
    content / hungry / thirsty / messy.
    It affects movement speed and thought bubbles.
  end note
```

## Code Anchors

- `src/simulation/types.ts`: `PigGoal` names.
- `src/simulation/systems.ts`: goal transitions, activity weighting, timers, and need restoration.
- `src/simulation/state.ts`: target selection for each goal.
