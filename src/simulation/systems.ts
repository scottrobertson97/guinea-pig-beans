import { chooseTarget, spawnPoop } from "./state";
import type { GameState, PigMood } from "./types";

export function updateSimulation(state: GameState, deltaSeconds: number): void {
  updateNeeds(state, deltaSeconds);
  updatePigs(state, deltaSeconds);
  updatePoops(state, deltaSeconds);
  updateCleanliness(state);
}

function updateNeeds(state: GameState, deltaSeconds: number): void {
  const pigCount = state.pigs.length;
  state.needs.hay = Math.max(0, state.needs.hay - 0.5 * pigCount * deltaSeconds);
  state.needs.water = Math.max(0, state.needs.water - 0.25 * pigCount * deltaSeconds);
}

function updatePigs(state: GameState, deltaSeconds: number): void {
  const mood = getSharedMood(state);
  for (const pig of state.pigs) {
    pig.mood = mood;

    const dx = pig.targetX - pig.x;
    const dy = pig.targetY - pig.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 6) {
      chooseTarget(state, pig);
    } else {
      const speedMultiplier = mood === "content" ? 1 : mood === "messy" ? 0.82 : 0.9;
      const travel = Math.min(distance, pig.speed * speedMultiplier * deltaSeconds);
      pig.x += (dx / distance) * travel;
      pig.y += (dy / distance) * travel;
    }

    pig.poopTimer -= deltaSeconds;
    if (pig.poopTimer <= 0) {
      spawnPoop(state, pig);
    }
  }
}

function updatePoops(state: GameState, deltaSeconds: number): void {
  for (const poop of state.poops) {
    poop.age += deltaSeconds;
    if (poop.type === "golden") {
      poop.value = poop.baseValue;
    } else if (poop.type === "stinky") {
      poop.value = poop.baseValue;
    } else {
      poop.value = poop.baseValue + (poop.age > 18 ? 1 : 0);
    }
  }
}

function updateCleanliness(state: GameState): void {
  const mess = Math.min(
    100,
    state.poops.reduce((total, poop) => total + (poop.type === "stinky" ? 8 : 5.5), 0),
  );
  state.cage.cleanliness = Math.max(0, Math.round(100 - mess));
}

function getSharedMood(state: GameState): PigMood {
  if (state.cage.cleanliness < 35) return "messy";
  if (state.needs.hay <= 0) return "hungry";
  if (state.needs.water <= 0) return "thirsty";
  return "content";
}
