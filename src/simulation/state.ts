import { CAGE_PADDING, getPigPoopInterval, MAX_LOG_ITEMS } from "./balance";
import type { FurnitureId, GameState, Pig, PigBreed, PigTrait, Poop, PoopType } from "./types";

const pigNames = [
  "Muffin",
  "Bean",
  "Pickle",
  "Waffle",
  "Niblet",
  "Turnip",
  "Lady Squeakerton",
  "Poopert",
  "Professor Wheek",
  "Biscuit",
  "Princess Wheek",
  "Sir Poops-a-Lot",
  "Saint Nibbles",
  "Gabagool",
];

const pigColors = [
  [0xb98b62, 0x5e3d24],
  [0xf3d5a6, 0x6d4225],
  [0xd6d1c4, 0x2f2923],
  [0xa66a3f, 0xf7e4bf],
  [0xede0ca, 0x8f5c37],
];

const pigBreeds: PigBreed[] = [
  "American",
  "Abyssinian",
  "Peruvian",
  "Skinny Pig",
  "Teddy",
  "Silkie",
  "Crested",
  "Rex",
];
const pigTraits: PigTrait[] = [
  "Chonker",
  "Zoomer",
  "Neat Freak",
  "Gremlin",
  "Royal Pig",
  "Shy Beaner",
  "Hay Goblin",
  "Drama Pig",
  "Compost Mystic",
];
const favoriteFoods = [
  "bell pepper",
  "timothy hay",
  "cucumber",
  "cilantro",
  "carrot coins",
  "forbidden lettuce",
];
const quirks = [
  "judges the water bottle",
  "stands in inconvenient places",
  "announces every snack",
  "discovers corners professionally",
  "does zoomies for legal reasons",
  "inspects fresh bedding with suspicion",
];

let nextPigId = 1;
let nextPoopId = 1;
let nextFurniturePlacementId = 1;

export function createInitialState(): GameState {
  const state: GameState = {
    beans: 0,
    compost: 0,
    squeaks: 0,
    goldenBeans: 0,
    cavyWisdom: 0,
    pigs: [],
    poops: [],
    robot: null,
    upgrades: {
      feedLevel: 0,
      scoopLevel: 0,
      cageLevel: 0,
    },
    needs: {
      hay: 100,
      water: 100,
    },
    cage: {
      width: 720,
      height: 520,
      cleanliness: 100,
      happiness: 86,
      enrichment: 0,
      socialization: 0,
      space: 100,
    },
    furniture: {
      hideyHouse: 0,
      tunnel: 0,
      litterTray: 0,
      chewToy: 0,
      snuggleSack: 0,
      cardboardCastle: 0,
      royalThrone: 0,
    },
    furniturePlacements: [],
    placement: {
      pendingFurniture: null,
    },
    abilities: {
      wheekCall: 0,
      treatBag: 0,
      deepClean: 0,
      freshBedding: 0,
      snackTime: 0,
      zoomieMode: 0,
    },
    event: {
      active: null,
      nextTimer: 24,
      bottleJammed: false,
      responseReady: false,
    },
    objective: {
      id: "cleanBurst",
      title: "Clean 3 beans quickly",
      progress: 0,
      target: 3,
      timer: 45,
    },
    prestige: {
      ascensions: 0,
      unlocked: [],
    },
    lateGame: {
      hayDimension: false,
      beanExchange: false,
      cavyCouncil: false,
      squeakChoir: false,
      beanSingularity: false,
    },
    combo: {
      count: 0,
      timer: 0,
      best: 0,
    },
    stats: {
      lifetimeBeans: 0,
      cleanedPoops: 0,
      goldenCleaned: 0,
      stinkyCleaned: 0,
      pigsAdopted: 1,
      feedUpgrades: 0,
      scoopUpgrades: 0,
      roombaPurchased: false,
      rarePoopsCleaned: 0,
      eventsSurvived: 0,
      abilitiesUsed: 0,
      furnitureBought: 0,
      legendaryPigsAdopted: 0,
      prestiges: 0,
      eventResponses: 0,
      objectivesCompleted: 0,
    },
    milestones: {
      quests: [],
      achievements: [],
    },
    log: [],
  };

  addPig(state);
  addLog(state, `${state.pigs[0].name} moved in and immediately inspected the bedding.`);
  return state;
}

export function addPig(state: GameState): Pig {
  return createPig(state, false);
}

export function addLegendaryPig(state: GameState): Pig {
  return createPig(state, true);
}

function createPig(state: GameState, legendary: boolean): Pig {
  const index = nextPigId - 1;
  const legendaryNames = ["Sir Poops-a-Lot", "The Oracle Pig", "Princess Wheek", "Saint Nibbles", "Gabagool"];
  const name = legendary ? legendaryNames[state.stats.legendaryPigsAdopted % legendaryNames.length] : pigNames[index % pigNames.length];
  const colors = pigColors[index % pigColors.length];
  const trait = legendary ? getLegendaryTrait(state.stats.legendaryPigsAdopted) : pigTraits[index % pigTraits.length];
  const breed = legendary ? getLegendaryBreed(state.stats.legendaryPigsAdopted) : pigBreeds[index % pigBreeds.length];
  const pig: Pig = {
    id: nextPigId++,
    name,
    breed,
    trait,
    favoriteFood: favoriteFoods[index % favoriteFoods.length],
    quirk: quirks[index % quirks.length],
    x: randomBetween(CAGE_PADDING + 40, state.cage.width - CAGE_PADDING - 40),
    y: randomBetween(CAGE_PADDING + 40, state.cage.height - CAGE_PADDING - 40),
    targetX: 0,
    targetY: 0,
    speed: getStartingSpeed(breed, trait),
    poopTimer: state.stats.cleanedPoops === 0 ? randomBetween(1.1, 2.2) : randomBetween(2.5, 5.5),
    bodyTint: colors[0],
    spotTint: colors[1],
    mood: "content",
    legendary,
    bondedPigId: state.pigs.length > 0 && state.pigs.length % 2 === 1 ? state.pigs[state.pigs.length - 1].id : null,
  };

  chooseTarget(state, pig);
  state.pigs.push(pig);
  if (pig.bondedPigId) {
    const partner = state.pigs.find((candidate) => candidate.id === pig.bondedPigId);
    if (partner) partner.bondedPigId = pig.id;
  }
  return pig;
}

export function chooseTarget(state: GameState, pig: Pig): void {
  if (state.abilities.wheekCall > 0) {
    targetNearFurniture(state, pig, "hayRack", 88, 88, 34);
    return;
  }

  if (pig.trait === "Neat Freak") {
    targetNearFurniture(state, pig, "litterTray", state.cage.width - 120, state.cage.height - 92, 44);
    return;
  }

  if (pig.trait === "Shy Beaner" && state.furniture.hideyHouse > 0) {
    targetNearFurniture(state, pig, "hideyHouse", 116, state.cage.height - 108, 46);
    return;
  }

  if (pig.trait === "Hay Goblin") {
    targetNearFurniture(state, pig, "hayRack", 88, 88, 50);
    return;
  }

  if (pig.trait === "Gremlin" && state.poops.length > 0) {
    const poop = state.poops[Math.floor(Math.random() * state.poops.length)];
    pig.targetX = clamp(poop.x + randomBetween(-34, 34), CAGE_PADDING, state.cage.width - CAGE_PADDING);
    pig.targetY = clamp(poop.y + randomBetween(-34, 34), CAGE_PADDING, state.cage.height - CAGE_PADDING);
    return;
  }

  if (pig.trait === "Royal Pig" && state.furniture.royalThrone > 0) {
    targetNearFurniture(state, pig, "royalThrone", state.cage.width - 96, 172, 54);
    return;
  }

  pig.targetX = randomBetween(CAGE_PADDING, state.cage.width - CAGE_PADDING);
  pig.targetY = randomBetween(CAGE_PADDING, state.cage.height - CAGE_PADDING);
}

export function spawnPoop(state: GameState, pig: Pig): Poop {
  const type = choosePoopType(state, pig);
  const baseValue = getStartingPoopValue(type, pig);
  const poop: Poop = {
    id: nextPoopId++,
    type,
    x: pig.x + randomBetween(-12, 12),
    y: pig.y + randomBetween(-10, 14),
    baseValue,
    value: baseValue,
    age: 0,
    hitsRemaining: type === "mega" ? 2 : 1,
  };

  state.poops.push(poop);
  addLog(state, getPoopLogMessage(pig, type, poop.value));
  pig.poopTimer = getPigPoopInterval(state, pig);
  return poop;
}

export function spawnDebugPoop(state: GameState, type: PoopType): Poop {
  const baseValue = getStartingPoopValue(type, state.pigs[0]);
  const poop: Poop = {
    id: nextPoopId++,
    type,
    x: randomBetween(CAGE_PADDING + 20, state.cage.width - CAGE_PADDING - 20),
    y: randomBetween(CAGE_PADDING + 20, state.cage.height - CAGE_PADDING - 20),
    baseValue,
    value: baseValue,
    age: 0,
    hitsRemaining: 1,
  };

  state.poops.push(poop);
  addLog(state, `Dev tools spawned a ${type} bean.`);
  return poop;
}

export function createMessPile(state: GameState, poops: Poop[]): Poop {
  const x = poops.reduce((total, poop) => total + poop.x, 0) / poops.length;
  const y = poops.reduce((total, poop) => total + poop.y, 0) / poops.length;
  const baseValue = poops.reduce((total, poop) => total + poop.value, 0) + poops.length;
  const pile: Poop = {
    id: nextPoopId++,
    type: "messPile",
    x,
    y,
    baseValue,
    value: baseValue,
    age: 0,
    hitsRemaining: Math.min(5, Math.max(3, poops.length)),
  };
  state.poops = state.poops.filter((poop) => !poops.includes(poop));
  state.poops.push(pile);
  addLog(state, `A mess pile formed from ${poops.length} clustered beans.`);
  return pile;
}

export function placeFurniture(state: GameState, x: number, y: number): boolean {
  const pending = state.placement.pendingFurniture;
  if (!pending) return false;

  state.furniturePlacements.push({
    id: nextFurniturePlacementId++,
    furnitureId: pending,
    x: clamp(x, CAGE_PADDING + 24, state.cage.width - CAGE_PADDING - 24),
    y: clamp(y, CAGE_PADDING + 24, state.cage.height - CAGE_PADDING - 24),
  });
  state.placement.pendingFurniture = null;
  addLog(state, `${getFurnitureName(pending)} placed in the cage.`);
  return true;
}

export function addLog(state: GameState, message: string): void {
  state.log.unshift(message);
  state.log = state.log.slice(0, MAX_LOG_ITEMS);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function targetNearFurniture(
  state: GameState,
  pig: Pig,
  furnitureId: FurnitureId | "hayRack",
  fallbackX: number,
  fallbackY: number,
  radius: number,
): void {
  const placements =
    furnitureId === "hayRack"
      ? []
      : state.furniturePlacements.filter((placement) => placement.furnitureId === furnitureId);
  const placement = placements.length > 0 ? placements[Math.floor(Math.random() * placements.length)] : null;
  const centerX = placement?.x ?? fallbackX;
  const centerY = placement?.y ?? fallbackY;
  pig.targetX = clamp(centerX + randomBetween(-radius, radius), CAGE_PADDING, state.cage.width - CAGE_PADDING);
  pig.targetY = clamp(centerY + randomBetween(-radius, radius), CAGE_PADDING, state.cage.height - CAGE_PADDING);
}

function getFurnitureName(id: FurnitureId): string {
  const names: Record<FurnitureId, string> = {
    hideyHouse: "Hidey House",
    tunnel: "Tunnel",
    litterTray: "Litter Tray",
    chewToy: "Chew Toy",
    snuggleSack: "Snuggle Sack",
    cardboardCastle: "Cardboard Castle",
    royalThrone: "Royal Throne",
  };
  return names[id];
}

function getStartingSpeed(breed: PigBreed, trait: PigTrait): number {
  const breedMultiplier = breed === "Abyssinian" ? 1.16 : breed === "Rex" ? 0.9 : 1;
  const traitMultiplier = trait === "Zoomer" ? 1.25 : trait === "Chonker" ? 0.82 : 1;
  return randomBetween(34, 48) * breedMultiplier * traitMultiplier;
}

function choosePoopType(state: GameState, pig: Pig): PoopType {
  const enrichmentBonus = Math.min(0.06, state.cage.enrichment / 1200);
  const happinessBonus = state.cage.happiness >= 90 ? 0.04 : state.cage.happiness >= 75 ? 0.02 : 0;
  const eventBonus = state.event.active?.id === "greatWheeking" ? 0.08 : 0;
  const abilityBonus = state.abilities.snackTime > 0 ? 0.05 : 0;
  const goldenChance = (pig.breed === "Teddy" ? 0.1 : 0.075) + enrichmentBonus + eventBonus + happinessBonus;
  const blessedChance = pig.trait === "Compost Mystic" ? 0.07 + abilityBonus : 0.015 + abilityBonus;
  const compostChance = state.furniture.cardboardCastle > 0 || state.cage.cleanliness < 55 ? 0.08 : 0.03;
  const megaChance = pig.trait === "Chonker" ? 0.04 : 0.015;
  const mysteryChance = state.squeaks >= 5 ? 0.025 : 0.01;
  const hayChance = state.needs.hay > 70 ? 0.045 : 0.015;
  const royalChance = pig.trait === "Royal Pig" || state.furniture.royalThrone > 0 ? 0.045 : 0;
  const cursedChance = state.lateGame.beanSingularity || state.cage.cleanliness < 20 ? 0.025 : 0.004;
  const stinkyChance =
    pig.trait === "Gremlin" && state.cage.cleanliness < 60
      ? 0.24
      : pig.trait === "Neat Freak"
        ? 0.08
        : 0.14;
  const roll = Math.random();
  if (roll < goldenChance) return "golden";
  if (roll < goldenChance + blessedChance) return "blessed";
  if (roll < goldenChance + blessedChance + megaChance) return "mega";
  if (roll < goldenChance + blessedChance + megaChance + royalChance) return "royal";
  if (roll < goldenChance + blessedChance + megaChance + royalChance + hayChance) return "hay";
  if (roll < goldenChance + blessedChance + megaChance + royalChance + hayChance + compostChance) return "compost";
  if (roll < goldenChance + blessedChance + megaChance + royalChance + hayChance + compostChance + mysteryChance)
    return "mystery";
  if (
    roll <
    goldenChance + blessedChance + megaChance + royalChance + hayChance + compostChance + mysteryChance + cursedChance
  )
    return "cursed";
  if (
    roll <
    goldenChance +
      blessedChance +
      megaChance +
      royalChance +
      hayChance +
      compostChance +
      mysteryChance +
      cursedChance +
      stinkyChance
  )
    return "stinky";
  return "normal";
}

function getStartingPoopValue(type: PoopType, pig?: Pig): number {
  const traitBonus = pig?.trait === "Chonker" ? 1 : 0;
  if (type === "cursed") return 12 + traitBonus;
  if (type === "royal") return 10 + traitBonus;
  if (type === "golden") return 8 + traitBonus;
  if (type === "mega") return 5 + traitBonus;
  if (type === "mystery") return 4 + traitBonus;
  if (type === "blessed") return 3 + traitBonus;
  if (type === "hay") return 3 + traitBonus;
  if (type === "compost") return 2 + traitBonus;
  if (type === "stinky") return 1 + traitBonus;
  return 1 + traitBonus;
}

function getPoopLogMessage(pig: Pig, type: PoopType, value: number): string {
  if (type === "cursed") return `${pig.name} produced a cursed bean worth ${value}. The bedding looks nervous.`;
  if (type === "messPile") return `${pig.name} contributed to a mess pile.`;
  if (type === "royal") return `${pig.name} presented a royal bean worth ${value}.`;
  if (type === "golden") return `${pig.name} produced a golden bean worth ${value}.`;
  if (type === "mega") return `${pig.name} created a mega bean. This is now paperwork.`;
  if (type === "mystery") return `${pig.name} left a mystery bean. The cage is withholding comment.`;
  if (type === "blessed") return `${pig.name} created a blessed bean. The herd approves.`;
  if (type === "hay") return `${pig.name} made a hay-fed bean worth ${value}.`;
  if (type === "compost") return `${pig.name} contributed to the compost economy.`;
  if (type === "stinky") return `${pig.name} committed a stinky bean. The bedding noticed.`;
  return `${pig.name} made a bean.`;
}

function getLegendaryTrait(index: number): PigTrait {
  const traits: PigTrait[] = ["Royal Pig", "Compost Mystic", "Drama Pig", "Hay Goblin", "Gremlin"];
  return traits[index % traits.length];
}

function getLegendaryBreed(index: number): PigBreed {
  const breeds: PigBreed[] = ["Silkie", "Crested", "Peruvian", "Teddy", "Skinny Pig"];
  return breeds[index % breeds.length];
}
