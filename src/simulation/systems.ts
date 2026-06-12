import { cleanPoopsInRadius } from "./actions";
import {
  CAGE_PADDING,
  getCageDimensions,
  getPigCapacity,
  getTotalWisdom,
  hasCavyCouncilEffect,
  hasFurnitureSynergy,
  hasSingularityExperimentEffect,
  hasSqueakChoirEffect,
  hasWisdomSpecialization,
} from "./balance";
import { advanceContractProgress, updateContracts } from "./contracts";
import { getPoopZoneId, getZoneMetrics, refreshEcology, updateHabitatStewardship, updatePigEcology } from "./ecology";
import { getFurnitureAutomationMultiplier, getFurnitureStatBonus, updateFurnitureCare } from "./furnitureCare";
import { updateMilestones } from "./milestones";
import { updateHeldPigRequestProgress, updatePigRequests } from "./pigRequests";
import { addLog, chooseTarget, createMessPile, getStaticFurniturePlacement, setPigGoal, spawnPoop } from "./state";
import type { AutomationDirectiveId, GameState, Pig, PigMood, Poop, Robot } from "./types";
import { clamp, pickWeighted, randomBetween } from "./utils";

const DEATH_CHECK_INTERVAL = 12;
const MAX_DEATH_CHANCE_PER_CHECK = 0.35;
const HUNGER_GOAL_THRESHOLD = 38;
const THIRST_GOAL_THRESHOLD = 35;
const ENERGY_GOAL_THRESHOLD = 28;
const NEED_SATISFIED_THRESHOLD = 86;
const ENERGY_RESTED_THRESHOLD = 88;
const HAY_X = 88;
const HAY_Y = 88;
const WATER_X_OFFSET = 90;
const WATER_Y = 82;
const BASE_CLEANLINESS_AREA = getCageDimensions(0).width * getCageDimensions(0).height;

export function updateSimulation(state: GameState, deltaSeconds: number): void {
  updateCombo(state, deltaSeconds);
  updateAbilities(state, deltaSeconds);
  updateAutomation(state, deltaSeconds);
  updateHabitatStewardship(state, deltaSeconds);
  updateFurnitureCare(state, deltaSeconds);
  updateDerivedCageStats(state);
  refreshEcology(state);
  updateEvent(state, deltaSeconds);
  updatePigRequests(state, deltaSeconds);
  refreshEcology(state);
  updateHappiness(state);
  updateNeeds(state, deltaSeconds);
  updateSurvival(state, deltaSeconds);
  updatePigs(state, deltaSeconds);
  updatePoops(state, deltaSeconds);
  updateMessPiles(state);
  updateLitterTrays(state, deltaSeconds);
  updateRobot(state, deltaSeconds);
  updateCleanliness(state);
  updateHeldPigRequestProgress(state);
  updateContracts(state, deltaSeconds);
  refreshEcology(state);
  updateMilestones(state);
}

function updateCombo(state: GameState, deltaSeconds: number): void {
  state.combo.timer = Math.max(0, state.combo.timer - deltaSeconds);
  if (state.combo.timer <= 0) state.combo.count = 0;
}

function updateAbilities(state: GameState, deltaSeconds: number): void {
  for (const id of Object.keys(state.abilities) as Array<keyof GameState["abilities"]>) {
    state.abilities[id] = Math.max(0, state.abilities[id] - deltaSeconds);
  }
}

function updateAutomation(state: GameState, deltaSeconds: number): void {
  state.automation.overdrive = Math.max(0, state.automation.overdrive - deltaSeconds);
}

function updateEvent(state: GameState, deltaSeconds: number): void {
  if (state.event.active) {
    state.event.active.timer -= deltaSeconds;
    if (state.event.active.timer <= 0) {
      addLog(state, `${state.event.active.name} has ended.`);
      state.event.active = null;
      state.event.nextTimer = randomBetween(28, 46);
      state.event.responseReady = false;
      state.stats.eventsSurvived += 1;
      if (state.event.bottleJammed) state.event.bottleJammed = false;
    }
    return;
  }

  state.event.nextTimer -= deltaSeconds;
  if (state.event.nextTimer <= 0) startRandomEvent(state);
}

function startRandomEvent(state: GameState): void {
  const litterZone = getZoneMetrics(state, "litterCorner");
  const hideyZone = getZoneMetrics(state, "hideyZone");
  const playZone = getZoneMetrics(state, "playRun");
  const hayZone = getZoneMetrics(state, "hayCorner");
  const waterZone = getZoneMetrics(state, "waterBottle");
  const events: Array<{ event: NonNullable<GameState["event"]["active"]>; weight: number }> = [
    { event: { id: "zoomies", name: "Zoomies", timer: 15 }, weight: state.cage.enrichment > 70 || playZone.appeal > 72 ? 1.9 : 1 },
    { event: { id: "hayFrenzy", name: "Hay Frenzy", timer: 18 }, weight: state.needs.hay < 35 || hayZone.comfort < 38 ? 2.5 : 1 },
    { event: { id: "napTime", name: "Nap Time", timer: 12 }, weight: state.cage.happiness > 82 ? 1.7 : 1 },
    { event: { id: "bottleJam", name: "Bottle Jam", timer: 20 }, weight: state.needs.water < 40 || waterZone.traffic > 60 ? 2.5 : 1 },
    { event: { id: "cageInspection", name: "Cage Inspection", timer: 22 }, weight: state.cage.cleanliness > 85 || state.poops.length > 18 || litterZone.mess > 55 ? 1.9 : 0.8 },
    { event: { id: "compostBloom", name: "Compost Bloom", timer: 18 }, weight: state.compost > 20 || state.recipes.compostCatalyst || litterZone.mess > 45 ? 2 : 1 },
    { event: { id: "greatWheeking", name: "The Great Wheeking", timer: 16 }, weight: state.squeaks > 8 || state.wisdom.chorusTraining ? 2 : 1 },
    { event: { id: "litterRevolt", name: "Litter Revolt", timer: 18 }, weight: litterZone.mess > 48 || litterZone.traffic > 68 ? 2.2 : 0.35 },
    { event: { id: "hideySquabble", name: "Hidey Squabble", timer: 18 }, weight: hideyZone.traffic > 62 || state.ecology.averageStress > 42 ? 2.1 : 0.35 },
    { event: { id: "zoomieTraffic", name: "Zoomie Traffic", timer: 16 }, weight: playZone.traffic > 62 || hasFurnitureSynergy(state, "zoomiePlayground") ? 1.8 : 0.4 },
  ];
  const event = pickWeighted(events, "event");
  const timerBonus = event.id === "zoomies" && hasFurnitureSynergy(state, "zoomiePlayground") ? 4 : 0;
  state.event.active = { ...event, timer: event.timer + timerBonus };
  state.event.responseReady = true;
  if (event.id === "bottleJam") state.event.bottleJammed = true;
  if (event.id === "greatWheeking") state.squeaks += 5;
  if (event.id === "hideySquabble") {
    for (const pig of state.pigs) {
      if (pig.favoriteZone === "hideyZone") pig.stress = Math.min(100, pig.stress + 8);
    }
  }
  addLog(state, `${event.name}! The cage situation has changed.`);
}

function updateDerivedCageStats(state: GameState): void {
  const pigCapacity = getPigCapacity(state);
  const councilSeated = hasCavyCouncilEffect(state);
  const supportScore =
    Number(state.furniture.hideyHouse) * 2 +
    Number(state.furniture.tunnel) +
    Number(state.furniture.snuggleSack) +
    Number(state.furniture.cardboardCastle) * 2 +
    (state.recipes.royalAccord ? 2 : 0);
  const unsupportedPigs = Math.max(0, state.pigs.length - 2 - supportScore);
  const unsupportedPenalty = Math.max(0, unsupportedPigs * 9 - (councilSeated ? 4 : 0));
  const bondedPigCount = state.pigs.filter((pig) => pig.bondedPigId !== null).length;
  const bondBonus =
    bondedPigCount * (2 + (state.wisdom.socialMemory ? 1 : 0)) +
    (state.wisdom.bondedBeginnings && bondedPigCount > 0 ? 4 : 0);
  const councilSocialBonus = councilSeated ? 12 : 0;
  state.cage.enrichment =
    Number(state.furniture.chewToy) * 22 +
    Number(state.furniture.snuggleSack) * 24 +
    Number(state.furniture.cardboardCastle) * 18 +
    Number(state.furniture.tunnel) * 12 +
    getFurnitureStatBonus(state, "chewToy") +
    getFurnitureStatBonus(state, "snuggleSack") +
    getFurnitureStatBonus(state, "cardboardCastle") +
    getFurnitureStatBonus(state, "tunnel") +
    (hasFurnitureSynergy(state, "zoomiePlayground") ? 6 : 0) +
    (state.wisdom.rareInstinct ? 5 : 0);
  state.cage.socialization = Math.max(
    0,
    Math.max(0, state.pigs.length - 1) * 10 +
      Number(state.furniture.hideyHouse) * 8 +
      Number(state.furniture.tunnel) * 4 +
      Number(state.furniture.snuggleSack) * 3 +
      getFurnitureStatBonus(state, "hideyHouse") +
      getFurnitureStatBonus(state, "tunnel") +
      getFurnitureStatBonus(state, "snuggleSack") +
      (hasFurnitureSynergy(state, "cozyCorner") ? 8 : 0) +
      bondBonus -
      unsupportedPenalty +
      councilSocialBonus,
  );
  state.cage.space = Math.max(
    0,
    Math.min(
      100,
      108 +
        state.upgrades.cageLevel * 8 +
        (state.wisdom.roomyStart ? 8 : 0) -
        Math.max(0, state.pigs.length - Math.max(2, pigCapacity - 2)) * 10,
    ),
  );
}

function updateHappiness(state: GameState): void {
  const needsScore = (state.needs.hay + state.needs.water) / 2;
  const cleanScore = state.cage.cleanliness;
  const enrichmentScore = Math.min(100, 45 + state.cage.enrichment);
  const socialScore = Math.min(100, 55 + state.cage.socialization);
  const spaceScore = Math.max(0, Math.min(100, state.cage.space));
  const eventBonus = state.event.active?.id === "napTime" ? 10 : state.event.active?.id === "greatWheeking" ? 8 : 0;
  const abilityBonus = state.abilities.snackTime > 0 ? 12 : 0;
  const synergyBonus = hasFurnitureSynergy(state, "cozyCorner") ? 4 : 0;
  const dramaPenalty =
    state.pigs.some((pig) => pig.trait === "Drama Pig") && state.needs.water < 30 ? 12 : 0;
  const lonePigPenalty = state.pigs.length === 1 ? 14 : 0;
  const councilHappinessBonus = hasCavyCouncilEffect(state) ? 5 : 0;
  const ecologyStressPenalty = Math.min(16, state.ecology.averageStress * 0.18);
  const ecologyComfortBonus = state.ecology.zones.some((zone) => zone.appeal >= 80 && zone.pigIds.length > 0) ? 4 : 0;
  state.cage.happiness = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        cleanScore * 0.34 +
          needsScore * 0.24 +
          enrichmentScore * 0.16 +
          socialScore * 0.14 +
          spaceScore * 0.12 +
          eventBonus +
          abilityBonus -
          dramaPenalty +
          synergyBonus -
          lonePigPenalty +
          councilHappinessBonus -
          ecologyStressPenalty +
          ecologyComfortBonus,
      ),
    ),
  );
}

function updateSurvival(state: GameState, deltaSeconds: number): void {
  if (state.pigs.length === 0) {
    state.survival.deathCheckTimer = DEATH_CHECK_INTERVAL;
    return;
  }

  state.survival.deathCheckTimer -= deltaSeconds;
  if (state.survival.deathCheckTimer > 0) return;
  state.survival.deathCheckTimer = DEATH_CHECK_INTERVAL;

  const risk = getDeathRisk(state);
  if (risk.chance <= 0) return;

  const lostPigs: Array<{ pig: Pig; cause: DeathCause }> = [];
  for (const pig of state.pigs) {
    if (Math.random() < risk.chance) {
      lostPigs.push({ pig, cause: risk.cause });
    }
  }

  for (const { pig, cause } of lostPigs) {
    removePigFromHerd(state, pig, cause);
  }
}

type DeathCause = "hay" | "water" | "happiness";

function getDeathRisk(state: GameState): { chance: number; cause: DeathCause } {
  const hayRisk = getNeedDeathRisk(state.needs.hay, 0.18, 0.08, 0.03);
  const waterRisk = getNeedDeathRisk(state.needs.water, 0.22, 0.1, 0.04);
  const happinessRisk = state.cage.happiness < 10 ? 0.1 : state.cage.happiness < 20 ? 0.05 : state.cage.happiness < 35 ? 0.02 : 0;
  const chance = Math.min(MAX_DEATH_CHANCE_PER_CHECK, hayRisk + waterRisk + happinessRisk);

  if (waterRisk >= hayRisk && waterRisk >= happinessRisk) return { chance, cause: "water" };
  if (hayRisk >= happinessRisk) return { chance, cause: "hay" };
  return { chance, cause: "happiness" };
}

function getNeedDeathRisk(value: number, emptyRisk: number, criticalRisk: number, lowRisk: number): number {
  if (value <= 0) return emptyRisk;
  if (value < 10) return criticalRisk;
  if (value < 25) return lowRisk;
  return 0;
}

function removePigFromHerd(state: GameState, pig: Pig, cause: DeathCause): void {
  if (!state.pigs.some((candidate) => candidate.id === pig.id)) return;

  state.pigs = state.pigs.filter((candidate) => candidate.id !== pig.id);
  for (const survivor of state.pigs) {
    if (survivor.bondedPigId === pig.id) survivor.bondedPigId = null;
  }

  if (state.pigRequest.active?.pigId === pig.id) {
    state.pigRequest.active = null;
    state.pigRequest.nextTimer = Math.max(state.pigRequest.nextTimer, 45);
  }

  state.stats.pigsLost += 1;
  addLog(state, getPigDeathLogMessage(pig, cause));
}

function getPigDeathLogMessage(pig: Pig, cause: DeathCause): string {
  if (cause === "water") return `${pig.name} died after the water bottle stayed too low.`;
  if (cause === "hay") return `${pig.name} died after the hay ran too low.`;
  return `${pig.name} died after the herd stayed deeply unhappy.`;
}

function updateNeeds(state: GameState, deltaSeconds: number): void {
  const pigCount = state.pigs.length;
  const hayDrainMultiplier =
    (state.event.active?.id === "hayFrenzy" ? 1.7 : 1) *
    (state.pigs.some((pig) => pig.trait === "Hay Goblin") ? 1.16 : 1) *
    (state.furniture.chewToy ? 0.9 : 1) *
    (state.lateGame.hayDimension ? 0.82 : 1) *
    (state.wisdom.steadySupplies ? 0.9 : 1) *
    (hasWisdomSpecialization(state, "gentleCare") ? 0.94 : 1);
  const totalWisdom = getTotalWisdom(state);
  const waterDrainMultiplier =
    state.event.bottleJammed
      ? 0
      : (totalWisdom > 0 ? 0.98 ** totalWisdom : 1) *
        (state.wisdom.steadySupplies ? 0.9 : 1) *
        (hasWisdomSpecialization(state, "gentleCare") ? 0.94 : 1);
  state.needs.hay = Math.max(0, state.needs.hay - 0.035 * pigCount * hayDrainMultiplier * deltaSeconds);
  state.needs.water = Math.max(0, state.needs.water - 0.02 * pigCount * waterDrainMultiplier * deltaSeconds);
  if (hasSqueakChoirEffect(state)) state.squeaks += (state.wisdom.chorusTraining ? 0.035 : 0.02) * deltaSeconds;
}

function updatePigs(state: GameState, deltaSeconds: number): void {
  for (const pig of state.pigs) {
    updatePigNeeds(pig, deltaSeconds);
    updatePigEcology(state, pig, deltaSeconds);
    updatePigGoal(state, pig);
    pig.mood = getPigMood(state, pig);

    const dx = pig.targetX - pig.x;
    const dy = pig.targetY - pig.y;
    const distance = Math.hypot(dx, dy);

    if (pig.goal === "sleep" && distance < 8) {
      updateSleepingPig(state, pig, deltaSeconds);
    } else if (pig.goal === "eat" && distance < 10) {
      updateEatingPig(state, pig, deltaSeconds);
    } else if (pig.goal === "drink" && distance < 10) {
      updateDrinkingPig(state, pig, deltaSeconds);
    } else if (distance < 6) {
      chooseTarget(state, pig);
    } else {
      const eventSpeed =
        state.event.active?.id === "zoomies"
          ? hasFurnitureSynergy(state, "zoomiePlayground")
            ? 2.15
            : 2
          : state.abilities.zoomieMode > 0
            ? 1.8
            : 1;
      const tunnelSpeed = state.furniture.tunnel ? 1.1 : 1;
      const goalSpeed = pig.goal === "sleep" ? 0.72 : pig.goal === "eat" || pig.goal === "drink" ? 1.08 : 1;
      const speedMultiplier = (pig.mood === "content" ? 1 : pig.mood === "messy" ? 0.82 : 0.9) * eventSpeed * tunnelSpeed * goalSpeed;
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

function updatePigNeeds(pig: Pig, deltaSeconds: number): void {
  const hungerDrain = (pig.trait === "Hay Goblin" ? 0.46 : pig.trait === "Chonker" ? 0.38 : 0.31) * deltaSeconds;
  const thirstDrain = (pig.trait === "Drama Pig" ? 0.3 : 0.24) * deltaSeconds;
  const energyDrain = (pig.trait === "Zoomer" ? 0.28 : 0.17) * deltaSeconds;
  pig.hunger = clampNeed(pig.hunger - hungerDrain);
  pig.thirst = clampNeed(pig.thirst - thirstDrain);
  if (pig.goal !== "sleep") pig.energy = clampNeed(pig.energy - energyDrain);
}

function updatePigGoal(state: GameState, pig: Pig): void {
  if (pig.goal === "eat" && (pig.hunger < NEED_SATISFIED_THRESHOLD || state.needs.hay <= 0)) return;
  if (pig.goal === "drink" && (pig.thirst < NEED_SATISFIED_THRESHOLD || state.needs.water <= 0 || state.event.bottleJammed)) return;
  if (pig.goal === "sleep" && pig.energy < ENERGY_RESTED_THRESHOLD) return;

  if (pig.hunger <= HUNGER_GOAL_THRESHOLD && state.needs.hay > 0) {
    setPigGoal(state, pig, "eat");
    return;
  }

  if (pig.thirst <= THIRST_GOAL_THRESHOLD && state.needs.water > 0 && !state.event.bottleJammed) {
    setPigGoal(state, pig, "drink");
    return;
  }

  if (pig.energy <= ENERGY_GOAL_THRESHOLD) {
    setPigGoal(state, pig, "sleep");
    return;
  }

  if (pig.goal !== "roam") setPigGoal(state, pig, "roam");
}

function updateEatingPig(state: GameState, pig: Pig, deltaSeconds: number): void {
  if (state.needs.hay <= 0) return;
  pig.goalTimer = Math.max(pig.goalTimer, 2.4);
  const intake = Math.min(state.needs.hay, (pig.trait === "Hay Goblin" ? 1.55 : 1.18) * deltaSeconds);
  state.needs.hay = Math.max(0, state.needs.hay - intake);
  pig.hunger = clampNeed(pig.hunger + intake * (pig.trait === "Hay Goblin" ? 15 : 18));
  pig.goalTimer -= deltaSeconds;
  if (pig.hunger >= NEED_SATISFIED_THRESHOLD && pig.goalTimer <= 0) setPigGoal(state, pig, "roam");
}

function updateDrinkingPig(state: GameState, pig: Pig, deltaSeconds: number): void {
  if (state.needs.water <= 0 || state.event.bottleJammed) return;
  pig.goalTimer = Math.max(pig.goalTimer, 2);
  const intake = Math.min(state.needs.water, 1 * deltaSeconds);
  state.needs.water = Math.max(0, state.needs.water - intake);
  pig.thirst = clampNeed(pig.thirst + intake * 20);
  pig.goalTimer -= deltaSeconds;
  if (pig.thirst >= NEED_SATISFIED_THRESHOLD && pig.goalTimer <= 0) setPigGoal(state, pig, "roam");
}

function updateSleepingPig(state: GameState, pig: Pig, deltaSeconds: number): void {
  pig.goalTimer = Math.max(pig.goalTimer, state.furniture.snuggleSack || state.furniture.hideyHouse ? 4.5 : 5.5);
  const restRate = (state.furniture.snuggleSack ? 18 : state.furniture.hideyHouse ? 15 : 13) * deltaSeconds;
  pig.energy = clampNeed(pig.energy + restRate);
  pig.goalTimer -= deltaSeconds;
  if (pig.energy >= ENERGY_RESTED_THRESHOLD && pig.goalTimer <= 0) setPigGoal(state, pig, "roam");
}

function updatePoops(state: GameState, deltaSeconds: number): void {
  for (const poop of state.poops) {
    poop.age += deltaSeconds;
    if (poop.type === "golden") {
      poop.value = poop.baseValue;
    } else if (poop.type === "stinky") {
      poop.value = poop.baseValue;
    } else if (poop.type === "compost") {
      const bloom =
        state.event.active?.id === "compostBloom" ? 3 : state.recipes.compostCatalyst || state.wisdom.compostEngine ? 2 : 1;
      poop.value = poop.baseValue + Math.floor(poop.age / 8) * bloom;
    } else if (poop.type === "cursed") {
      poop.value = poop.baseValue + Math.floor(poop.age / 15);
    } else if (poop.type === "messPile") {
      poop.value = poop.baseValue + Math.floor(poop.age / 10);
    } else {
      poop.value = poop.baseValue + (poop.age > 18 ? 1 : 0);
    }
  }

  if (hasSingularityExperimentEffect(state)) {
    for (const poop of state.poops) {
      poop.x += (state.cage.width / 2 - poop.x) * 0.03 * deltaSeconds;
      poop.y += (state.cage.height / 2 - poop.y) * 0.03 * deltaSeconds;
    }
  }
}

function updateMessPiles(state: GameState): void {
  const candidates = state.poops.filter((poop) => poop.type !== "messPile");
  for (const poop of candidates) {
    const cluster = candidates.filter((candidate) => Math.hypot(candidate.x - poop.x, candidate.y - poop.y) < 34);
    if (cluster.length >= 4) {
      createMessPile(state, cluster.slice(0, 5));
      return;
    }
  }
}

function updateLitterTrays(state: GameState, deltaSeconds: number): void {
  if (!state.furniture.litterTray) return;

  const tray = getStaticFurniturePlacement(state, "litterTray");
  const directive = state.automation.directive;
  const overdriveBonus = state.automation.overdrive > 0 ? 0.14 : 0;
  const wisdomBonus = state.wisdom.trayAffinity ? 0.12 : 0;
  const synergyBonus = hasFurnitureSynergy(state, "cleanupCircuit") ? 0.08 : 0;
  const careMultiplier = getFurnitureAutomationMultiplier(state, "litterTray");
  const directiveBonus =
    directive === "litterFocus" ? 0.11 : directive === "cleanliness" && state.cage.cleanliness < 72 ? 0.06 : 0;
  if (Math.random() > (0.18 + overdriveBonus + wisdomBonus + synergyBonus + directiveBonus) * careMultiplier * deltaSeconds) return;
  const trayRadius =
    ((state.wisdom.trayAffinity ? 56 : 42) +
      (hasFurnitureSynergy(state, "cleanupCircuit") ? 8 : 0) +
      (directive === "litterFocus" ? 12 : 0)) *
    careMultiplier;
  const poop = chooseAutomationPoop(state, state.poops.filter((candidate) => Math.hypot(candidate.x - tray.x, candidate.y - tray.y) <= trayRadius), directive, tray);
  if (!poop) return;
  const cleanupRadius = directive === "rareGuard" ? 10 : 18;
  const result = cleanPoopsInRadius(state, poop.x, poop.y, cleanupRadius, getAutomationCleanOptions(directive));
  if (result.cleaned > 0) {
    advanceContractProgress(state, "automationClean", result.cleaned);
    addLog(state, `Litter Tray ${getAutomationDirectiveVerb(directive)} ${result.cleaned} bean for +${result.earned}.`);
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

  moveRobot(robot, deltaSeconds, getRobotSpeedMultiplier(state));

  const sweepRadius =
    robot.sweepRadius +
    (hasFurnitureSynergy(state, "cleanupCircuit") ? 6 : 0) +
    (state.automation.directive === "cleanliness" ? 3 : 0) -
    (state.automation.directive === "rareGuard" ? 5 : 0);
  const result = cleanPoopsInRadius(state, robot.x, robot.y, sweepRadius, getAutomationCleanOptions(state.automation.directive));
  if (result.cleaned > 0) advanceContractProgress(state, "automationClean", result.cleaned);
  if (result.cleaned > 0 && robot.cleanLogCooldown <= 0) {
    robot.cleanLogCooldown = state.automation.overdrive > 0 ? 1.8 : 3;
    const noun = result.cleaned === 1 ? "bean" : "beans";
    addLog(state, `Poop Roomba ${getAutomationDirectiveVerb(state.automation.directive)} ${result.cleaned} ${noun} for +${result.earned}.`);
    updateMilestones(state);
  }
}

function getNearestPoopInRange(state: GameState, robot: Robot): Poop | null {
  const directive = state.automation.directive;
  const nearestDistance =
    robot.sensorRadius *
    (state.automation.overdrive > 0 ? 1.45 : 1) *
    (hasFurnitureSynergy(state, "cleanupCircuit") ? 1.18 : 1) *
    (directive === "cleanliness" ? 1.08 : directive === "litterFocus" ? 1.05 : 1);
  const candidates = state.poops.filter((poop) => Math.hypot(poop.x - robot.x, poop.y - robot.y) <= nearestDistance);
  return chooseAutomationPoop(state, candidates, directive, robot);
}

function chooseAutomationPoop(
  state: GameState,
  candidates: Poop[],
  directive: AutomationDirectiveId,
  source: Pick<Robot, "x" | "y">,
): Poop | null {
  const available = directive === "rareGuard" ? candidates.filter((poop) => !isRareGuardProtected(poop)) : candidates;
  let best: { poop: Poop; score: number } | null = null;
  for (const poop of available) {
    const distance = Math.hypot(poop.x - source.x, poop.y - source.y);
    const mess = getPoopMessPressure(poop);
    const litterBonus = getPoopZoneId(state, poop) === "litterCorner" ? 120 : 0;
    const score =
      directive === "cleanliness"
        ? mess * 11 + poop.age * 0.08 - distance * 0.32
        : directive === "litterFocus"
          ? litterBonus + mess * 6 - distance * 0.36
          : directive === "rareGuard"
            ? mess * 8 - distance * 0.28
            : -distance;
    if (!best || score > best.score) best = { poop, score };
  }
  return best?.poop ?? null;
}

function chooseRobotTarget(state: GameState, robot: Robot): void {
  if (state.automation.directive === "litterFocus") {
    const litter = getZoneMetrics(state, "litterCorner");
    robot.targetX = litter.x + randomBetween(-28, 28);
    robot.targetY = litter.y + randomBetween(-22, 22);
    return;
  }

  if (state.automation.directive === "cleanliness") {
    const messiestZone = state.ecology.zones.reduce((best, zone) => (zone.mess > best.mess ? zone : best), state.ecology.zones[0]);
    if (messiestZone.mess >= 18) {
      robot.targetX = messiestZone.x + randomBetween(-Math.min(32, messiestZone.radius * 0.25), Math.min(32, messiestZone.radius * 0.25));
      robot.targetY = messiestZone.y + randomBetween(-Math.min(28, messiestZone.radius * 0.22), Math.min(28, messiestZone.radius * 0.22));
      return;
    }
  }

  robot.targetX = randomBetween(CAGE_PADDING, state.cage.width - CAGE_PADDING);
  robot.targetY = randomBetween(CAGE_PADDING, state.cage.height - CAGE_PADDING);
}

function getRobotSpeedMultiplier(state: GameState): number {
  const overdrive = state.automation.overdrive > 0 ? 1.55 : 1;
  const directive = state.automation.directive;
  const directiveSpeed = directive === "litterFocus" ? 1.06 : directive === "rareGuard" ? 0.92 : 1;
  return overdrive * directiveSpeed;
}

function moveRobot(robot: Robot, deltaSeconds: number, speedMultiplier: number): void {
  const dx = robot.targetX - robot.x;
  const dy = robot.targetY - robot.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;

  const travel = Math.min(distance, robot.speed * speedMultiplier * deltaSeconds);
  robot.x += (dx / distance) * travel;
  robot.y += (dy / distance) * travel;
}

function getPoopMessPressure(poop: Poop): number {
  if (poop.type === "messPile") return 13;
  if (poop.type === "cursed") return 11;
  if (poop.type === "stinky") return 8;
  if (poop.type === "blessed") return 3;
  return 5.5;
}

function getAutomationCleanOptions(directive: AutomationDirectiveId) {
  return directive === "rareGuard" ? { shouldClean: (poop: Poop) => !isRareGuardProtected(poop) } : {};
}

function isRareGuardProtected(poop: Poop): boolean {
  return poop.type !== "normal" && poop.type !== "stinky" && poop.type !== "messPile";
}

function getAutomationDirectiveVerb(directive: AutomationDirectiveId): string {
  if (directive === "cleanliness") return "stabilized";
  if (directive === "litterFocus") return "patrolled";
  if (directive === "rareGuard") return "guard-cleaned";
  return "swept";
}

function updateCleanliness(state: GameState): void {
  const currentArea = Math.max(BASE_CLEANLINESS_AREA, state.cage.width * state.cage.height);
  const cageSizeMessScale = BASE_CLEANLINESS_AREA / currentArea;
  const mess = Math.min(
    100,
    state.poops.reduce((total, poop) => total + getPoopMessPressure(poop), 0) *
      (state.furniture.litterTray ? 0.9 : 1) *
      cageSizeMessScale,
  );
  const inspectionBonus = state.event.active?.id === "cageInspection" && state.cage.cleanliness > 90 ? 5 : 0;
  const beddingBonus = (state.furniture.snuggleSack ? 2 : 0) + (state.wisdom.freshStart ? 3 : 0);
  state.cage.cleanliness = Math.max(0, Math.min(100, Math.round(100 - mess + inspectionBonus + beddingBonus)));
}

function getPigMood(state: GameState, pig: Pig): PigMood {
  if (pig.stress >= 72) return "messy";
  if (state.cage.happiness < 35) return "messy";
  if (state.cage.cleanliness < 35) return "messy";
  if (pig.hunger <= HUNGER_GOAL_THRESHOLD || (pig.goal === "eat" && state.needs.hay <= 0)) return "hungry";
  if (pig.thirst <= THIRST_GOAL_THRESHOLD || (pig.goal === "drink" && (state.needs.water <= 0 || state.event.bottleJammed))) return "thirsty";
  if (state.cage.space < 55) return "messy";
  return "content";
}

function clampNeed(value: number): number {
  return clamp(value, 0, 100);
}
