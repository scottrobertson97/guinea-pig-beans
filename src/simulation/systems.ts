import { cleanPoopsInRadius } from "./actions";
import { CAGE_PADDING } from "./balance";
import { addLog, chooseTarget, spawnPoop } from "./state";
import type { GameState, PigMood, Poop, Robot } from "./types";

export function updateSimulation(state: GameState, deltaSeconds: number): void {
  updateNeeds(state, deltaSeconds);
  updatePigs(state, deltaSeconds);
  updatePoops(state, deltaSeconds);
  updateRobot(state, deltaSeconds);
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

function updateRobot(state: GameState, deltaSeconds: number): void {
  const robot = state.robot;
  if (!robot) return;

  robot.cleanLogCooldown = Math.max(0, robot.cleanLogCooldown - deltaSeconds);

  const detectedPoop = getNearestPoopInRange(state, robot);
  if (detectedPoop) {
    robot.state = "sweeping";
    robot.targetX = detectedPoop.x;
    robot.targetY = detectedPoop.y;
  } else {
    robot.state = "wandering";
    const distanceToTarget = Math.hypot(robot.targetX - robot.x, robot.targetY - robot.y);
    if (distanceToTarget < 8) {
      chooseRobotTarget(state, robot);
    }
  }

  moveRobot(robot, deltaSeconds);

  const result = cleanPoopsInRadius(state, robot.x, robot.y, robot.sweepRadius);
  if (result.cleaned > 0 && robot.cleanLogCooldown <= 0) {
    robot.cleanLogCooldown = 3;
    const noun = result.cleaned === 1 ? "bean" : "beans";
    addLog(state, `Poop Roomba swept ${result.cleaned} ${noun} for +${result.earned}.`);
  }
}

function getNearestPoopInRange(state: GameState, robot: Robot): Poop | null {
  let nearestPoop: Poop | null = null;
  let nearestDistance = robot.sensorRadius;

  for (const poop of state.poops) {
    const distance = Math.hypot(poop.x - robot.x, poop.y - robot.y);
    if (distance <= nearestDistance) {
      nearestDistance = distance;
      nearestPoop = poop;
    }
  }

  return nearestPoop;
}

function chooseRobotTarget(state: GameState, robot: Robot): void {
  robot.targetX = randomBetween(CAGE_PADDING, state.cage.width - CAGE_PADDING);
  robot.targetY = randomBetween(CAGE_PADDING, state.cage.height - CAGE_PADDING);
}

function moveRobot(robot: Robot, deltaSeconds: number): void {
  const dx = robot.targetX - robot.x;
  const dy = robot.targetY - robot.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;

  const travel = Math.min(distance, robot.speed * deltaSeconds);
  robot.x += (dx / distance) * travel;
  robot.y += (dy / distance) * travel;
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

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
