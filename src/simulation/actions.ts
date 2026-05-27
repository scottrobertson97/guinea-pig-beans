import { getCosts, getScoopRadius } from "./balance";
import { addLog, addPig } from "./state";
import type { GameState } from "./types";

export function cleanAt(state: GameState, x: number, y: number): number {
  const radius = getScoopRadius(state);
  const before = state.poops.length;
  let earned = 0;

  state.poops = state.poops.filter((poop) => {
    const hit = Math.hypot(poop.x - x, poop.y - y) <= radius;
    if (hit) earned += poop.value;
    return !hit;
  });

  const cleaned = before - state.poops.length;
  if (cleaned > 0) {
    state.beans += earned;
    addLog(state, `Cleaned ${cleaned} bean${cleaned === 1 ? "" : "s"} for +${earned}.`);
  }

  return earned;
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
  addLog(state, `${pig.name} joined the cage.`);
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
