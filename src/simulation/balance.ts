import type { Costs, GameState, Pig } from "./types";

export const CAGE_PADDING = 34;
export const BASE_POOP_INTERVAL = 5;
export const MAX_LOG_ITEMS = 8;

export function getCosts(state: GameState): Costs {
  return {
    pig: Math.ceil(15 * 1.35 ** Math.max(0, state.pigs.length - 1)),
    feed: Math.ceil(25 * 1.6 ** state.upgrades.feedLevel),
    scoop: Math.ceil(20 * 1.7 ** state.upgrades.scoopLevel),
  };
}

export function getScoopRadius(state: GameState): number {
  return 24 + state.upgrades.scoopLevel * 9;
}

export function getPigPoopInterval(state: GameState, pig: Pig): number {
  const feedMultiplier = 0.9 ** state.upgrades.feedLevel;
  const hayPenalty = state.needs.hay <= 0 ? 1.3 : state.needs.hay < 25 ? 1.15 : 1;
  const waterPenalty = state.needs.water <= 0 ? 1.2 : state.needs.water < 25 ? 1.1 : 1;
  const messPenalty = state.cage.cleanliness < 35 ? 1.2 : 1;
  return BASE_POOP_INTERVAL * feedMultiplier * hayPenalty * waterPenalty * messPenalty;
}
