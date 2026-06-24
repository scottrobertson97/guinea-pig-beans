import { PIG_LIFECYCLE_THRESHOLDS } from "./balance";
import { getPigZoneId, getZoneMetrics } from "./ecology";
import { getPigRelationships } from "./relationships";
import type { CageZoneId, GameState, Pig, PigGoal, PigMood } from "./types";
import { clamp } from "./utils";

export type PigLifeMotive =
  | "food"
  | "water"
  | "rest"
  | "play"
  | "social"
  | "comfort"
  | "cleanup"
  | "recovery"
  | "roam";

export type PigLifeUrgency = "none" | "desire" | "urgent" | "blocked";
export type PigLifeNeed = "hunger" | "thirst" | "energy" | "comfort" | "social" | "cleanup" | "recovery" | "none";
export type PigLifeStressBand = "settled" | "uneasy" | "stressed";
export type HerdRecoveryState = "empty" | "single" | "steady";

export interface PigLifeSnapshot {
  pigId: number;
  weakestNeed: PigLifeNeed;
  motive: PigLifeMotive;
  urgency: PigLifeUrgency;
  goal: PigGoal;
  mood: PigMood;
  stressBand: PigLifeStressBand;
  currentZone: CageZoneId;
  favoriteZone: CageZoneId;
  favoriteZoneComfort: number;
  favoriteZoneMess: number;
  relationshipPressure: number;
  relationshipWarmth: number;
  pressures: Record<PigLifeMotive, number>;
}

export interface HerdLifeSnapshot {
  dominantMotive: PigLifeMotive;
  urgency: PigLifeUrgency;
  averageNeedPressure: number;
  foodPressure: number;
  waterPressure: number;
  restPressure: number;
  playPressure: number;
  socialPressure: number;
  stressPressure: number;
  cleanupPressure: number;
  relationshipPressure: number;
  recoveryState: HerdRecoveryState;
  dominantCareZone: CageZoneId | null;
}

export function getPigLifeSnapshot(state: GameState, pig: Pig): PigLifeSnapshot {
  const currentZone = getPigZoneId(state, pig);
  const favoriteZone = getZoneMetrics(state, pig.favoriteZone);
  const relationshipPressure = getPigRelationshipPressure(state, pig);
  const relationshipWarmth = getPigRelationshipWarmth(state, pig);
  const foodPressure = getNeedPressure(
    pig.hunger,
    PIG_LIFECYCLE_THRESHOLDS.hungerDesire,
    PIG_LIFECYCLE_THRESHOLDS.hungerUrgent,
  );
  const waterPressure = getNeedPressure(
    pig.thirst,
    PIG_LIFECYCLE_THRESHOLDS.thirstDesire,
    PIG_LIFECYCLE_THRESHOLDS.thirstUrgent,
  );
  const restPressure = getNeedPressure(
    pig.energy,
    PIG_LIFECYCLE_THRESHOLDS.energyDesire,
    PIG_LIFECYCLE_THRESHOLDS.energyUrgent,
  );
  const comfortPressure = clamp(
    pig.stress * 0.9 + Math.max(0, 58 - favoriteZone.comfort) * 0.7 + favoriteZone.mess * 0.28 + relationshipPressure * 0.18,
    0,
    100,
  );
  const cleanupPressure = clamp(
    Math.max(0, 72 - state.cage.cleanliness) * 0.75 +
      favoriteZone.mess * 0.72 +
      (pig.trait === "Neat Freak" ? 10 : 0) +
      (pig.trait === "Gremlin" && favoriteZone.mess >= 28 ? 8 : 0),
    0,
    100,
  );
  const playPressure = clamp(
    Math.max(0, 48 - state.cage.enrichment) * 0.8 +
      Math.max(0, 42 - state.cage.socialization) * 0.28 +
      (pig.trait === "Zoomer" ? 12 : 0),
    0,
    100,
  );
  const socialPressure = clamp(
    Math.max(0, 45 - state.cage.socialization) * 0.9 +
      relationshipPressure * 0.5 +
      (getPigRelationships(state, pig.id).length === 0 && state.pigs.length > 1 ? 10 : 0),
    0,
    100,
  );
  const recoveryPressure =
    state.pigs.length === 0 ? 100 : state.pigs.length === 1 ? 82 : state.cage.happiness < 35 ? 48 : 0;
  const pressures: Record<PigLifeMotive, number> = {
    food: foodPressure,
    water: waterPressure,
    rest: restPressure,
    play: playPressure,
    social: socialPressure,
    comfort: comfortPressure,
    cleanup: cleanupPressure,
    recovery: recoveryPressure,
    roam: 12,
  };
  const pressureMotive = getDominantMotive(pressures);
  const goalMotive = getGoalMotive(pig.goal);
  const motive = getPressureUrgency(state, pressureMotive, pressures[pressureMotive], pig) === "none" && goalMotive !== "roam"
    ? goalMotive
    : pressureMotive;

  return {
    pigId: pig.id,
    weakestNeed: getWeakestNeed(pressures),
    motive,
    urgency: getPressureUrgency(state, motive, pressures[motive], pig),
    goal: pig.goal,
    mood: pig.mood,
    stressBand: getStressBand(pig.stress),
    currentZone,
    favoriteZone: pig.favoriteZone,
    favoriteZoneComfort: favoriteZone.comfort,
    favoriteZoneMess: favoriteZone.mess,
    relationshipPressure,
    relationshipWarmth,
    pressures,
  };
}

export function getHerdLifeSnapshot(state: GameState): HerdLifeSnapshot {
  const pigSnapshots = state.pigs.map((pig) => getPigLifeSnapshot(state, pig));
  const foodPressure = Math.max(getAveragePressure(pigSnapshots, "food", state.needs.hay <= 25 ? 20 : 0), getMaxPressure(pigSnapshots, "food") * 0.72);
  const waterPressure = Math.max(
    getAveragePressure(pigSnapshots, "water", state.needs.water <= 25 || state.event.bottleJammed ? 20 : 0),
    getMaxPressure(pigSnapshots, "water") * 0.72,
  );
  const restPressure = Math.max(getAveragePressure(pigSnapshots, "rest"), getMaxPressure(pigSnapshots, "rest") * 0.72);
  const playPressure = getAveragePressure(pigSnapshots, "play");
  const socialPressure = getAveragePressure(pigSnapshots, "social");
  const stressPressure = pigSnapshots.length === 0 ? 0 : pigSnapshots.reduce((total, snapshot) => total + snapshot.pressures.comfort, 0) / pigSnapshots.length;
  const relationshipPressure = pigSnapshots.length === 0 ? 0 : pigSnapshots.reduce((total, snapshot) => total + snapshot.relationshipPressure, 0) / pigSnapshots.length;
  const cleanupPressure = Math.max(
    getAveragePressure(pigSnapshots, "cleanup"),
    Math.max(0, 78 - state.cage.cleanliness),
    state.ecology.zones.reduce((highest, zone) => Math.max(highest, zone.mess), 0),
  );
  const pressures: Record<PigLifeMotive, number> = {
    food: foodPressure,
    water: waterPressure,
    rest: restPressure,
    play: playPressure,
    social: socialPressure,
    comfort: stressPressure,
    cleanup: cleanupPressure,
    recovery: getRecoveryPressure(state),
    roam: 10,
  };
  const dominantMotive = getDominantMotive(pressures);

  return {
    dominantMotive,
    urgency: getHerdUrgency(state, dominantMotive, pressures[dominantMotive]),
    averageNeedPressure: (foodPressure + waterPressure + restPressure) / 3,
    foodPressure,
    waterPressure,
    restPressure,
    playPressure,
    socialPressure,
    stressPressure,
    cleanupPressure,
    relationshipPressure,
    recoveryState: getRecoveryState(state),
    dominantCareZone: getDominantCareZone(state, dominantMotive),
  };
}

export function getPigLifeSummaryText(state: GameState, pig: Pig): string {
  const life = getPigLifeSnapshot(state, pig);
  const urgency = life.urgency === "blocked" ? "blocked" : life.urgency === "urgent" ? "urgent" : life.urgency === "desire" ? "wants" : "steady";
  if (life.motive === "food") return `Life: hay ${urgency}`;
  if (life.motive === "water") return `Life: water ${urgency}`;
  if (life.motive === "rest") return `Life: rest ${urgency}`;
  if (life.motive === "play") return `Life: play ${urgency}`;
  if (life.motive === "social") return `Life: social ${urgency}`;
  if (life.motive === "comfort") return `Life: comfort ${urgency}`;
  if (life.motive === "cleanup") return `Life: cleanup ${urgency}`;
  if (life.motive === "recovery") return `Life: recovery ${urgency}`;
  return "Life: roaming steady";
}

export function getHerdLifeStatusText(state: GameState): string | null {
  const life = getHerdLifeSnapshot(state);
  if (life.recoveryState === "empty") return "The cage needs a fresh bonded pair. Adopt Pig is free.";
  if (life.recoveryState === "single") return "The last pig needs a companion. Adopt Pig is free until the pair is restored.";
  if (life.urgency === "none") return null;
  if (life.dominantMotive === "food") {
    return life.urgency === "blocked" ? "Hungry pigs are waiting at empty hay. Refill Hay." : "Hay is becoming the herd's main need.";
  }
  if (life.dominantMotive === "water") {
    return life.urgency === "blocked" ? "Thirsty pigs cannot drink right now. Refill or fix water." : "Water is becoming the herd's main need.";
  }
  if (life.dominantMotive === "rest") return "Tired pigs are looking for safer nap rhythm.";
  if (life.dominantMotive === "play" || life.dominantMotive === "social") return "The herd wants more play and social comfort.";
  if (life.dominantMotive === "comfort") return "Stressed pigs need calmer favorite zones.";
  if (life.dominantMotive === "cleanup") return "Mess is driving the herd's attention. Clean the pressure spots.";
  return null;
}

function getAveragePressure(snapshots: PigLifeSnapshot[], motive: PigLifeMotive, floor = 0): number {
  if (snapshots.length === 0) return floor;
  return Math.max(floor, snapshots.reduce((total, snapshot) => total + snapshot.pressures[motive], 0) / snapshots.length);
}

function getMaxPressure(snapshots: PigLifeSnapshot[], motive: PigLifeMotive): number {
  return snapshots.reduce((highest, snapshot) => Math.max(highest, snapshot.pressures[motive]), 0);
}

function getNeedPressure(value: number, desireThreshold: number, urgentThreshold: number): number {
  if (value >= desireThreshold) return 0;
  const desireRange = Math.max(1, desireThreshold - urgentThreshold);
  const desirePressure = ((desireThreshold - value) / desireRange) * 58;
  const urgentPressure = value <= urgentThreshold ? (urgentThreshold - value) * 1.15 + 42 : 0;
  return clamp(Math.max(desirePressure, urgentPressure), 0, 100);
}

function getWeakestNeed(pressures: Record<PigLifeMotive, number>): PigLifeNeed {
  const ranked: Array<{ id: PigLifeNeed; pressure: number }> = [
    { id: "hunger", pressure: pressures.food },
    { id: "thirst", pressure: pressures.water },
    { id: "energy", pressure: pressures.rest },
    { id: "comfort", pressure: pressures.comfort },
    { id: "social", pressure: pressures.social },
    { id: "cleanup", pressure: pressures.cleanup },
    { id: "recovery", pressure: pressures.recovery },
  ];
  ranked.sort((first, second) => second.pressure - first.pressure);
  return ranked[0].pressure > 0 ? ranked[0].id : "none";
}

function getDominantMotive(pressures: Record<PigLifeMotive, number>): PigLifeMotive {
  const motives = Object.entries(pressures) as Array<[PigLifeMotive, number]>;
  motives.sort((first, second) => second[1] - first[1]);
  return motives[0][1] >= 18 ? motives[0][0] : "roam";
}

function getGoalMotive(goal: PigGoal): PigLifeMotive {
  if (goal === "seekFood" || goal === "eat") return "food";
  if (goal === "seekWater" || goal === "drink") return "water";
  if (goal === "seekSleep" || goal === "sleep") return "rest";
  if (goal === "seekPlay" || goal === "playWithFurniture") return "play";
  if (goal === "playWithPig") return "social";
  return "roam";
}

function getPressureUrgency(state: GameState, motive: PigLifeMotive, pressure: number, pig: Pig): PigLifeUrgency {
  if (motive === "food" && pig.hunger <= PIG_LIFECYCLE_THRESHOLDS.hungerUrgent && state.needs.hay <= 0) return "blocked";
  if (
    motive === "water" &&
    pig.thirst <= PIG_LIFECYCLE_THRESHOLDS.thirstUrgent &&
    (state.needs.water <= 0 || state.event.bottleJammed)
  ) {
    return "blocked";
  }
  if (motive === "food" && pig.hunger <= PIG_LIFECYCLE_THRESHOLDS.hungerUrgent) return "urgent";
  if (motive === "water" && pig.thirst <= PIG_LIFECYCLE_THRESHOLDS.thirstUrgent) return "urgent";
  if (motive === "rest" && pig.energy <= PIG_LIFECYCLE_THRESHOLDS.energyUrgent) return "urgent";
  if (motive === "comfort" && pig.stress >= 68) return "urgent";
  if (motive === "cleanup" && pressure >= 68) return "urgent";
  if (motive === "recovery" && state.pigs.length < 2) return "urgent";
  if (pressure >= 28) return "desire";
  return "none";
}

function getHerdUrgency(state: GameState, motive: PigLifeMotive, pressure: number): PigLifeUrgency {
  if (motive === "food" && state.needs.hay <= 0) return "blocked";
  if (motive === "water" && (state.needs.water <= 0 || state.event.bottleJammed)) return "blocked";
  if (state.pigs.length < 2 || pressure >= 66) return "urgent";
  if (pressure >= 30) return "desire";
  return "none";
}

function getStressBand(stress: number): PigLifeStressBand {
  if (stress >= 70) return "stressed";
  if (stress >= 40) return "uneasy";
  return "settled";
}

function getPigRelationshipPressure(state: GameState, pig: Pig): number {
  return clamp(
    getPigRelationships(state, pig.id).reduce((total, relationship) => {
      const tensionPressure = relationship.kind === "rival" ? relationship.tension * 0.9 : Math.max(0, relationship.tension - 34) * 0.7;
      const warmthNeed = relationship.kind === "buddy" || relationship.kind === "bonded" ? Math.max(0, 42 - relationship.warmth) * 0.45 : 0;
      return total + tensionPressure + warmthNeed;
    }, 0),
    0,
    100,
  );
}

function getPigRelationshipWarmth(state: GameState, pig: Pig): number {
  const relationships = getPigRelationships(state, pig.id);
  if (relationships.length === 0) return 0;
  return clamp(relationships.reduce((total, relationship) => total + relationship.warmth, 0) / relationships.length, 0, 100);
}

function getRecoveryPressure(state: GameState): number {
  if (state.pigs.length === 0) return 100;
  if (state.pigs.length === 1) return 82;
  if (state.cage.happiness < 25) return 48;
  return 0;
}

function getRecoveryState(state: GameState): HerdRecoveryState {
  if (state.pigs.length === 0) return "empty";
  if (state.pigs.length === 1) return "single";
  return "steady";
}

function getDominantCareZone(state: GameState, motive: PigLifeMotive): CageZoneId | null {
  if (motive === "food") return "hayCorner";
  if (motive === "water") return "waterBottle";
  if (motive === "rest" || motive === "comfort") return state.ecology.dominantStressZone ?? "hideyZone";
  if (motive === "play" || motive === "social") return "playRun";
  if (motive === "cleanup") {
    const messiest = state.ecology.zones.reduce((best, zone) => (zone.mess > best.mess ? zone : best), state.ecology.zones[0]);
    return messiest?.id ?? null;
  }
  return state.ecology.dominantStressZone;
}
