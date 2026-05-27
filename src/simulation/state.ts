import { CAGE_PADDING, getPigPoopInterval, MAX_LOG_ITEMS } from "./balance";
import type { GameState, Pig, Poop } from "./types";

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
  addLog(state, "Muffin moved in and immediately inspected the bedding.");
  return state;
}

export function addPig(state: GameState): Pig {
  const name = pigNames[(nextPigId - 1) % pigNames.length];
  const colors = pigColors[(nextPigId - 1) % pigColors.length];
  const pig: Pig = {
    id: nextPigId++,
    name,
    x: randomBetween(CAGE_PADDING + 40, state.cage.width - CAGE_PADDING - 40),
    y: randomBetween(CAGE_PADDING + 40, state.cage.height - CAGE_PADDING - 40),
    targetX: 0,
    targetY: 0,
    speed: randomBetween(34, 48),
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
  pig.targetX = randomBetween(CAGE_PADDING, state.cage.width - CAGE_PADDING);
  pig.targetY = randomBetween(CAGE_PADDING, state.cage.height - CAGE_PADDING);
}

export function spawnPoop(state: GameState, pig: Pig): Poop {
  const poop: Poop = {
    id: nextPoopId++,
    x: pig.x + randomBetween(-12, 12),
    y: pig.y + randomBetween(-10, 14),
    value: 1,
    age: 0,
  };

  state.poops.push(poop);
  addLog(state, `${pig.name} made a bean.`);
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
