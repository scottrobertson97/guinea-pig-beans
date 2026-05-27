import { getCosts, getScoopRadius } from "./balance";
import { addLog, addPig } from "./state";
import type { GameState } from "./types";

export interface CleanResult {
  cleaned: number;
  earned: number;
  golden: number;
  stinky: number;
}

export function cleanAt(state: GameState, x: number, y: number): number {
  const result = cleanPoopsInRadius(state, x, y, getScoopRadius(state));
  if (result.cleaned > 0) {
    addLog(state, getCleanLog(result.cleaned, result.earned, result.golden, result.stinky));
  }

  return result.earned;
}

export function cleanPoopsInRadius(state: GameState, x: number, y: number, radius: number): CleanResult {
  const result: CleanResult = {
    cleaned: 0,
    earned: 0,
    golden: 0,
    stinky: 0,
  };

  state.poops = state.poops.filter((poop) => {
    const hit = Math.hypot(poop.x - x, poop.y - y) <= radius;
    if (!hit) return true;

    result.cleaned += 1;
    result.earned += poop.value;
    if (poop.type === "golden") result.golden += 1;
    if (poop.type === "stinky") result.stinky += 1;
    return false;
  });

  if (result.cleaned > 0) state.beans += result.earned;
  return result;
}

export function refillHay(state: GameState): void {
  state.needs.hay = 100;
  addLog(state, "Hay rack refilled. The room has been judged acceptable.");
}

export function refillWater(state: GameState): void {
  state.needs.water = 100;
  addLog(state, "Water bottle topped up with dramatic precision.");
}

export function buyPig(state: GameState): boolean {
  const cost = getCosts(state).pig;
  if (state.beans < cost) return false;
  state.beans -= cost;
  const pig = addPig(state);
  addLog(state, `${pig.name} joined as a ${pig.breed} ${pig.trait}. Favorite: ${pig.favoriteFood}.`);
  return true;
}

export function buyFeedUpgrade(state: GameState): boolean {
  const cost = getCosts(state).feed;
  if (state.beans < cost) return false;
  state.beans -= cost;
  state.upgrades.feedLevel += 1;
  addLog(state, `Better Hay level ${state.upgrades.feedLevel} unlocked.`);
  return true;
}

export function buyScoopUpgrade(state: GameState): boolean {
  const cost = getCosts(state).scoop;
  if (state.beans < cost) return false;
  state.beans -= cost;
  state.upgrades.scoopLevel += 1;
  addLog(state, `Better Scoop level ${state.upgrades.scoopLevel} unlocked.`);
  return true;
}

export function buyRobot(state: GameState): boolean {
  const cost = getCosts(state).robot;
  if (state.robot || state.beans < cost) return false;

  state.beans -= cost;
  state.robot = {
    x: 92,
    y: state.cage.height - 82,
    targetX: 140,
    targetY: state.cage.height - 118,
    speed: 86,
    sensorRadius: 140,
    sweepRadius: 24,
    state: "wandering",
    cleanLogCooldown: 0,
  };
  addLog(state, "Poop Roomba has entered the cage. The beans are no longer safe.");
  return true;
}

function getCleanLog(cleaned: number, earned: number, golden: number, stinky: number): string {
  if (golden > 0) return `Cleaned ${cleaned} beans, including ${golden} golden, for +${earned}.`;
  if (stinky > 0) return `Removed ${stinky} stinky bean${stinky === 1 ? "" : "s"} and earned +${earned}.`;
  return `Cleaned ${cleaned} bean${cleaned === 1 ? "" : "s"} for +${earned}.`;
}
