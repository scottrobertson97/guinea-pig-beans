import { CAGE_PADDING, getPigPoopInterval, MAX_LOG_ITEMS } from "./balance";
import type { GameState, Pig, PigBreed, PigTrait, Poop, PoopType } from "./types";

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
];

const pigColors = [
  [0xb98b62, 0x5e3d24],
  [0xf3d5a6, 0x6d4225],
  [0xd6d1c4, 0x2f2923],
  [0xa66a3f, 0xf7e4bf],
  [0xede0ca, 0x8f5c37],
];

const pigBreeds: PigBreed[] = ["American", "Abyssinian", "Peruvian", "Teddy", "Rex"];
const pigTraits: PigTrait[] = ["Chonker", "Zoomer", "Neat Freak", "Gremlin"];
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
  const state: GameState = {
    beans: 0,
    pigs: [],
    poops: [],
    upgrades: {
      feedLevel: 0,
      scoopLevel: 0,
    },
    needs: {
      hay: 100,
      water: 100,
    },
    cage: {
      width: 720,
      height: 520,
      cleanliness: 100,
    },
    log: [],
  };

  addPig(state);
  addLog(state, `${state.pigs[0].name} moved in and immediately inspected the bedding.`);
  return state;
}

export function addPig(state: GameState): Pig {
  const index = nextPigId - 1;
  const name = pigNames[index % pigNames.length];
  const colors = pigColors[index % pigColors.length];
  const trait = pigTraits[index % pigTraits.length];
  const breed = pigBreeds[index % pigBreeds.length];
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
    poopTimer: randomBetween(2.5, 5.5),
    bodyTint: colors[0],
    spotTint: colors[1],
    mood: "content",
  };

  chooseTarget(state, pig);
  state.pigs.push(pig);
  return pig;
}

export function chooseTarget(state: GameState, pig: Pig): void {
  if (pig.trait === "Neat Freak") {
    pig.targetX = randomBetween(state.cage.width - 190, state.cage.width - 62);
    pig.targetY = randomBetween(state.cage.height - 150, state.cage.height - 48);
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
  };

  state.poops.push(poop);
  addLog(state, getPoopLogMessage(pig, type, poop.value));
  pig.poopTimer = getPigPoopInterval(state, pig);
  return poop;
}

export function addLog(state: GameState, message: string): void {
  state.log.unshift(message);
  state.log = state.log.slice(0, MAX_LOG_ITEMS);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function getStartingSpeed(breed: PigBreed, trait: PigTrait): number {
  const breedMultiplier = breed === "Abyssinian" ? 1.16 : breed === "Rex" ? 0.9 : 1;
  const traitMultiplier = trait === "Zoomer" ? 1.25 : trait === "Chonker" ? 0.82 : 1;
  return randomBetween(34, 48) * breedMultiplier * traitMultiplier;
}

function choosePoopType(state: GameState, pig: Pig): PoopType {
  const goldenChance = pig.breed === "Teddy" ? 0.1 : 0.075;
  const stinkyChance =
    pig.trait === "Gremlin" && state.cage.cleanliness < 60
      ? 0.24
      : pig.trait === "Neat Freak"
        ? 0.08
        : 0.14;
  const roll = Math.random();
  if (roll < goldenChance) return "golden";
  if (roll < goldenChance + stinkyChance) return "stinky";
  return "normal";
}

function getStartingPoopValue(type: PoopType, pig: Pig): number {
  const traitBonus = pig.trait === "Chonker" ? 1 : 0;
  if (type === "golden") return 8 + traitBonus;
  if (type === "stinky") return 1 + traitBonus;
  return 1 + traitBonus;
}

function getPoopLogMessage(pig: Pig, type: PoopType, value: number): string {
  if (type === "golden") return `${pig.name} produced a golden bean worth ${value}.`;
  if (type === "stinky") return `${pig.name} committed a stinky bean. The bedding noticed.`;
  return `${pig.name} made a bean.`;
}
