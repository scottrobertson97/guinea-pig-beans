import {
  CAGE_PADDING,
  getCageDimensions,
  getPigPoopInterval,
  hasFurnitureSynergy,
  hasSingularityExperimentEffect,
  hasWisdomSpecialization,
  MAX_LOG_ITEMS,
} from "./balance";
import { chooseFavoriteZoneForPig, createInitialEcologyState, getPreferredRoamTarget, getZoneTarget } from "./ecology";
import { createInitialFurnitureCareState } from "./furnitureCare";
import { getFurnitureDefinition, getFurnitureName } from "./furnitureDefinitions";
import { getPigLifeSnapshot } from "./lifecycle";
import { createInitialEventChainsState } from "./eventChains";
import { getPigRelationships, getRelationshipPartnerId, syncRelationshipWeb } from "./relationships";
import type { FurnitureId, GameState, Pig, PigBreed, PigGoal, PigTrait, Poop, PoopType } from "./types";
import { clamp, pickWeighted, randomBetween } from "./utils";

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
export function createInitialState(): GameState {
  const cageDimensions = getCageDimensions(0);
  const state: GameState = {
    beans: 0,
    compost: 0,
    squeaks: 0,
    goldenBeans: 0,
    cavyWisdom: 0,
    pigs: [],
    relationships: [],
    pigWelcome: {
      progressByPigId: {},
      completedPigIds: [],
    },
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
      width: cageDimensions.width,
      height: cageDimensions.height,
      cleanliness: 100,
      happiness: 86,
      enrichment: 0,
      socialization: 0,
      space: 100,
    },
    ecology: createInitialEcologyState(cageDimensions.width, cageDimensions.height),
    furniture: {
      hideyHouse: false,
      tunnel: false,
      litterTray: false,
      chewToy: false,
      snuggleSack: false,
      cardboardCastle: false,
      royalThrone: false,
    },
    furnitureCare: createInitialFurnitureCareState(),
    abilities: {
      wheekCall: 0,
      treatBag: 0,
      deepClean: 0,
      freshBedding: 0,
      snackTime: 0,
      zoomieMode: 0,
    },
    automation: {
      overdrive: 0,
      directive: "balanced",
    },
    recipes: {
      beanBlessing: false,
      compostCatalyst: false,
      royalAccord: false,
      singularityExperiment: false,
    },
    wisdom: {
      roomyStart: false,
      steadySupplies: false,
      freshStart: false,
      bondedBeginnings: false,
      socialMemory: false,
      chorusTraining: false,
      gentleAutomation: false,
      compostEngine: false,
      trayAffinity: false,
      rareInstinct: false,
      goldenNose: false,
      royalMemory: false,
    },
    wisdomSpecialization: null,
    event: {
      active: null,
      nextTimer: 24,
      bottleJammed: false,
      responseReady: false,
    },
    eventChains: createInitialEventChainsState(),
    objective: {
      id: "cleanBurst",
      title: "Clean 3 beans quickly",
      progress: 0,
      target: 3,
      timer: 45,
    },
    contracts: {
      active: null,
      offers: [],
      completed: 0,
      expired: 0,
      lastResult: null,
      nextOfferSeed: 1,
      rareEventBoost: 0,
      completedTemplates: {},
    },
    pigRequest: {
      active: null,
      nextTimer: randomBetween(35, 45),
      completed: 0,
      expired: 0,
      lastResult: null,
    },
    survival: {
      deathCheckTimer: 12,
    },
    prestige: {
      ascensions: 0,
      unlocked: [],
      lifetimeBeansClaimed: 0,
    },
    lateGame: {
      hayDimension: false,
      beanExchange: false,
      goldenScoop: false,
      cavyCouncil: false,
      squeakChoir: false,
      beanSingularity: false,
    },
    tech: {
      levels: {},
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
      pigsAdopted: 2,
      feedUpgrades: 0,
      scoopUpgrades: 0,
      roombaPurchased: false,
      rarePoopsCleaned: 0,
      eventsSurvived: 0,
      abilitiesUsed: 0,
      furnitureBought: 0,
      legendaryPigsAdopted: 0,
      pigsLost: 0,
      prestiges: 0,
      eventResponses: 0,
      objectivesCompleted: 0,
      compostCleaned: 0,
      blessedCleaned: 0,
      royalCleaned: 0,
      cursedCleaned: 0,
      recipesUnlocked: 0,
      wisdomPerks: 0,
    },
    milestones: {
      quests: [],
      achievements: [],
    },
    log: [],
  };

  addPig(state);
  addPig(state);
  addLog(state, `${state.pigs[0].name} and ${state.pigs[1].name} moved in as a bonded pair.`);
  return state;
}

export function syncEntityIdCounters(state: GameState): void {
  const nextSavedPigId = state.pigs.reduce((nextId, pig) => Math.max(nextId, pig.id + 1), 1);
  const nextSavedPoopId = state.poops.reduce((nextId, poop) => Math.max(nextId, poop.id + 1), 1);
  nextPigId = Math.max(nextPigId, nextSavedPigId);
  nextPoopId = Math.max(nextPoopId, nextSavedPoopId);
}

export function syncCageDimensionsToLevel(state: GameState): void {
  const dimensions = getCageDimensions(state.upgrades.cageLevel);
  state.cage.width = dimensions.width;
  state.cage.height = dimensions.height;
  clampEntitiesToCage(state);
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
    hunger: randomBetween(72, 96),
    thirst: randomBetween(74, 98),
    energy: randomBetween(58, 94),
    goal: "roam",
    goalTimer: 0,
    favoriteZone: chooseFavoriteZoneForPig({ id: nextPigId, trait }, index),
    stress: 0,
    legendary,
    bondedPigId: state.pigs.length > 0 && state.pigs.length % 2 === 1 ? state.pigs[state.pigs.length - 1].id : null,
  };

  chooseTarget(state, pig);
  state.pigs.push(pig);
  if (pig.bondedPigId) {
    const partner = state.pigs.find((candidate) => candidate.id === pig.bondedPigId);
    if (partner) partner.bondedPigId = pig.id;
  }
  syncRelationshipWeb(state);
  return pig;
}

export function chooseTarget(state: GameState, pig: Pig): void {
  if (pig.goal === "seekFood" || pig.goal === "eat") {
    targetNearFurniture(state, pig, "hayRack", 88, 88, 34);
    return;
  }

  if (pig.goal === "seekWater" || pig.goal === "drink") {
    targetNearFurniture(state, pig, "waterBottle", state.cage.width - 90, 82, 30);
    return;
  }

  if (pig.goal === "seekSleep") {
    targetSleepSpot(state, pig);
    return;
  }

  if (pig.goal === "sleep") {
    return;
  }

  if (pig.goal === "seekPlay") {
    const target = getZoneTarget(state, "playRun", 48);
    pig.targetX = target.x;
    pig.targetY = target.y;
    return;
  }

  if (pig.goal === "playWithFurniture") {
    targetPlayFurnitureSpot(state, pig);
    return;
  }

  if (pig.goal === "playWithPig") {
    pig.targetX = pig.x;
    pig.targetY = pig.y;
    return;
  }

  if (state.abilities.wheekCall > 0) {
    targetNearFurniture(state, pig, "hayRack", 88, 88, 34);
    return;
  }

  if (pig.trait === "Neat Freak") {
    targetNearFurniture(state, pig, "litterTray", state.cage.width - 120, state.cage.height - 92, 44);
    return;
  }

  if (pig.trait === "Shy Beaner" && state.furniture.hideyHouse) {
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

  if (pig.trait === "Royal Pig" && state.furniture.royalThrone) {
    targetNearFurniture(state, pig, "royalThrone", state.cage.width - 96, 172, 54);
    return;
  }

  const target = getPreferredRoamTarget(state, pig);
  pig.targetX = target.x;
  pig.targetY = target.y;
}

export function setPigGoal(state: GameState, pig: Pig, goal: PigGoal): void {
  if (pig.goal !== goal) {
    pig.goal = goal;
    pig.goalTimer = 0;
  }
  chooseTarget(state, pig);
}

export function spawnPoop(state: GameState, pig: Pig): Poop {
  const type = choosePoopType(state, pig);
  const baseValue = getStartingPoopValue(type, pig) + (type === "golden" && state.wisdom.goldenNose ? 2 : 0);
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
  const baseValue = getStartingPoopValue(type, state.pigs[0]) + (type === "golden" && state.wisdom.goldenNose ? 2 : 0);
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

export function spawnEventPoop(state: GameState, type: PoopType, x: number, y: number): Poop {
  const baseValue = getStartingPoopValue(type, state.pigs[0]) + (type === "golden" && state.wisdom.goldenNose ? 2 : 0);
  const poop: Poop = {
    id: nextPoopId++,
    type,
    x: clamp(x, CAGE_PADDING + 20, state.cage.width - CAGE_PADDING - 20),
    y: clamp(y, CAGE_PADDING + 20, state.cage.height - CAGE_PADDING - 20),
    baseValue,
    value: baseValue,
    age: 0,
    hitsRemaining: 1,
  };

  state.poops.push(poop);
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

export function getStaticFurniturePlacement(
  state: GameState,
  furnitureId: FurnitureId,
): { furnitureId: FurnitureId; x: number; y: number } {
  const position = getFurnitureDefinition(furnitureId).placement;
  return {
    furnitureId,
    x: clamp(state.cage.width * position.x, CAGE_PADDING + 44, state.cage.width - CAGE_PADDING - 44),
    y: clamp(state.cage.height * position.y, CAGE_PADDING + 44, state.cage.height - CAGE_PADDING - 44),
  };
}

export function getUnlockedFurniturePlacements(
  state: GameState,
): Array<{ furnitureId: FurnitureId; x: number; y: number }> {
  return (Object.keys(state.furniture) as FurnitureId[])
    .filter((furnitureId) => state.furniture[furnitureId])
    .map((furnitureId) => getStaticFurniturePlacement(state, furnitureId));
}

export function addLog(state: GameState, message: string): void {
  state.log.unshift(message);
  state.log = state.log.slice(0, MAX_LOG_ITEMS);
}

function clampEntitiesToCage(state: GameState): void {
  const minX = CAGE_PADDING;
  const minY = CAGE_PADDING;
  const maxX = state.cage.width - CAGE_PADDING;
  const maxY = state.cage.height - CAGE_PADDING;

  for (const pig of state.pigs) {
    pig.x = clamp(pig.x, minX, maxX);
    pig.y = clamp(pig.y, minY, maxY);
    pig.targetX = clamp(pig.targetX, minX, maxX);
    pig.targetY = clamp(pig.targetY, minY, maxY);
  }

  for (const poop of state.poops) {
    poop.x = clamp(poop.x, CAGE_PADDING + 20, state.cage.width - CAGE_PADDING - 20);
    poop.y = clamp(poop.y, CAGE_PADDING + 20, state.cage.height - CAGE_PADDING - 20);
  }

  if (!state.robot) return;
  state.robot.x = clamp(state.robot.x, minX, maxX);
  state.robot.y = clamp(state.robot.y, minY, maxY);
  state.robot.targetX = clamp(state.robot.targetX, minX, maxX);
  state.robot.targetY = clamp(state.robot.targetY, minY, maxY);
}

function targetNearFurniture(
  state: GameState,
  pig: Pig,
  furnitureId: FurnitureId | "hayRack" | "waterBottle",
  fallbackX: number,
  fallbackY: number,
  radius: number,
): void {
  const placement = furnitureId !== "hayRack" && furnitureId !== "waterBottle" && state.furniture[furnitureId]
    ? getStaticFurniturePlacement(state, furnitureId)
    : null;
  const centerX = placement?.x ?? fallbackX;
  const centerY = placement?.y ?? fallbackY;
  pig.targetX = clamp(centerX + randomBetween(-radius, radius), CAGE_PADDING, state.cage.width - CAGE_PADDING);
  pig.targetY = clamp(centerY + randomBetween(-radius, radius), CAGE_PADDING, state.cage.height - CAGE_PADDING);
}

function targetSleepSpot(state: GameState, pig: Pig): void {
  const napRelationship = getPigRelationships(state, pig.id).find((relationship) => relationship.kind === "napPartner");
  const napPartnerId = napRelationship ? getRelationshipPartnerId(napRelationship, pig.id) : null;
  const napPartner = napPartnerId === null ? null : state.pigs.find((candidate) => candidate.id === napPartnerId);
  if (napPartner && (napPartner.goal === "sleep" || napPartner.goal === "seekSleep")) {
    pig.targetX = clamp(napPartner.x + randomBetween(-34, 34), CAGE_PADDING, state.cage.width - CAGE_PADDING);
    pig.targetY = clamp(napPartner.y + randomBetween(-26, 26), CAGE_PADDING, state.cage.height - CAGE_PADDING);
    return;
  }

  if (pig.trait === "Shy Beaner" && state.furniture.hideyHouse) {
    targetNearFurniture(state, pig, "hideyHouse", 116, state.cage.height - 108, 36);
    return;
  }

  const sleepOptions: Array<{ furnitureId: FurnitureId; fallbackX: number; fallbackY: number; radius: number; weight: number }> = [
    { furnitureId: "snuggleSack", fallbackX: state.cage.width - 150, fallbackY: state.cage.height - 118, radius: 34, weight: state.furniture.snuggleSack ? 4 : 0 },
    { furnitureId: "hideyHouse", fallbackX: 116, fallbackY: state.cage.height - 108, radius: 42, weight: state.furniture.hideyHouse ? 3 : 0 },
  ];
  if (sleepOptions.some((option) => option.weight > 0)) {
    const option = pickWeighted(sleepOptions, "furnitureId");
    const selected = sleepOptions.find((candidate) => candidate.furnitureId === option);
    if (selected) {
      targetNearFurniture(state, pig, selected.furnitureId, selected.fallbackX, selected.fallbackY, selected.radius);
      return;
    }
  }

  pig.targetX = randomBetween(CAGE_PADDING + 24, state.cage.width - CAGE_PADDING - 24);
  pig.targetY = randomBetween(CAGE_PADDING + 24, state.cage.height - CAGE_PADDING - 24);
}

function targetPlayFurnitureSpot(state: GameState, pig: Pig): void {
  if (state.furniture.chewToy) {
    targetNearFurniture(state, pig, "chewToy", state.cage.width * 0.52, state.cage.height * 0.5, 34);
    return;
  }

  if (state.furniture.tunnel) {
    targetNearFurniture(state, pig, "tunnel", state.cage.width * 0.33, state.cage.height * 0.52, 42);
    return;
  }

  if (state.furniture.cardboardCastle) {
    targetNearFurniture(state, pig, "cardboardCastle", state.cage.width * 0.22, state.cage.height * 0.28, 46);
    return;
  }

  const target = getZoneTarget(state, "playRun", 54);
  pig.targetX = target.x;
  pig.targetY = target.y;
}

function getStartingSpeed(breed: PigBreed, trait: PigTrait): number {
  const breedMultiplier = breed === "Abyssinian" ? 1.16 : breed === "Rex" ? 0.9 : 1;
  const traitMultiplier = trait === "Zoomer" ? 1.25 : trait === "Chonker" ? 0.82 : 1;
  return randomBetween(34, 48) * breedMultiplier * traitMultiplier;
}

function choosePoopType(state: GameState, pig: Pig): PoopType {
  const life = getPigLifeSnapshot(state, pig);
  const enrichmentBonus = Math.min(0.06, state.cage.enrichment / 1200);
  const happinessBonus = state.cage.happiness >= 90 ? 0.04 : state.cage.happiness >= 75 ? 0.02 : 0;
  const favoriteZoneBonus = life.currentZone === life.favoriteZone && life.favoriteZoneComfort >= 62 ? 0.022 : 0;
  const relationshipComfortBonus = life.relationshipWarmth >= 70 && life.relationshipPressure < 28 ? 0.008 : 0;
  const stressRarePenalty = life.stressBand === "stressed" ? -0.018 : life.stressBand === "uneasy" ? -0.01 : 0;
  const eventBonus = state.event.active?.id === "greatWheeking" ? 0.08 : 0;
  const abilityBonus = state.abilities.snackTime > 0 ? 0.05 : 0;
  const rareCatalogBonus = (state.tech?.levels?.rareCatalog ?? 0) * 0.01;
  const recipeRareBonus = state.recipes.beanBlessing ? 0.025 : 0;
  const wisdomRareBonus = state.wisdom.rareInstinct ? 0.025 : 0;
  const alchemyRareBonus = hasWisdomSpecialization(state, "rareBeanAlchemy") ? 0.018 : 0;
  const goldenNoseBonus = state.wisdom.goldenNose ? 0.025 : 0;
  const contractRareBonus = state.contracts.rareEventBoost > 0 ? 0.035 : 0;
  const royalCompostCourt = hasFurnitureSynergy(state, "royalCompostCourt");
  const goldenChance =
    (pig.breed === "Teddy" ? 0.1 : 0.075) +
    enrichmentBonus +
    eventBonus +
    happinessBonus +
    favoriteZoneBonus +
    relationshipComfortBonus +
    stressRarePenalty +
    rareCatalogBonus +
    recipeRareBonus +
    wisdomRareBonus +
    alchemyRareBonus +
    goldenNoseBonus +
    contractRareBonus;
  const blessedChance =
    pig.trait === "Compost Mystic" ? 0.07 + abilityBonus + recipeRareBonus : 0.015 + abilityBonus + recipeRareBonus;
  const compostChance = royalCompostCourt
    ? 0.1
    : state.furniture.cardboardCastle || state.cage.cleanliness < 55 || state.recipes.compostCatalyst
      ? 0.08
      : 0.03;
  const megaChance = pig.trait === "Chonker" ? 0.04 : 0.015;
  const mysteryChance = state.squeaks >= 5 ? 0.025 : 0.01;
  const hayChance = state.needs.hay > 70 ? 0.045 : 0.015;
  const royalChance =
    (pig.trait === "Royal Pig" || state.furniture.royalThrone || state.recipes.royalAccord ? 0.045 : 0) +
    (state.wisdom.royalMemory && state.furniture.royalThrone ? 0.025 : 0) +
    (royalCompostCourt ? 0.018 : 0);
  const cursedChance = hasSingularityExperimentEffect(state) || state.cage.cleanliness < 20 ? 0.025 : 0.004;
  const stressStinkyBonus = life.stressBand === "stressed" ? 0.1 : life.stressBand === "uneasy" ? 0.055 : 0;
  const stinkyChance =
    (pig.trait === "Gremlin" && state.cage.cleanliness < 60
      ? 0.24
      : pig.trait === "Neat Freak"
        ? 0.08
        : 0.14) + stressStinkyBonus;
  const roll = Math.random();
  let selected: PoopType = "normal";
  if (roll < goldenChance) selected = "golden";
  else if (roll < goldenChance + blessedChance) selected = "blessed";
  else if (roll < goldenChance + blessedChance + megaChance) selected = "mega";
  else if (roll < goldenChance + blessedChance + megaChance + royalChance) selected = "royal";
  else if (roll < goldenChance + blessedChance + megaChance + royalChance + hayChance) selected = "hay";
  else if (roll < goldenChance + blessedChance + megaChance + royalChance + hayChance + compostChance) selected = "compost";
  else if (roll < goldenChance + blessedChance + megaChance + royalChance + hayChance + compostChance + mysteryChance) selected = "mystery";
  else if (
    roll <
    goldenChance + blessedChance + megaChance + royalChance + hayChance + compostChance + mysteryChance + cursedChance
  )
    selected = "cursed";
  else if (
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
    selected = "stinky";
  if (state.contracts.rareEventBoost > 0 && selected !== "normal" && selected !== "stinky") {
    state.contracts.rareEventBoost = Math.max(0, state.contracts.rareEventBoost - 1);
  }
  return selected;
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
