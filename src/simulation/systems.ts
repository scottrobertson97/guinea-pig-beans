import { cleanPoopsInRadius } from "./actions";
import { CAGE_PADDING, getPigCapacity, getTotalWisdom, hasFurnitureSynergy } from "./balance";
import { getZoneMetrics, refreshEcology, updatePigEcology } from "./ecology";
import { updateMilestones } from "./milestones";
import { updateHeldPigRequestProgress, updatePigRequests } from "./pigRequests";
import { addLog, chooseTarget, createMessPile, getStaticFurniturePlacement, setPigGoal, spawnPoop } from "./state";
import type { GameState, Pig, PigMood, Poop, Robot } from "./types";

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

export function updateSimulation(state: GameState, deltaSeconds: number): void {
  updateCombo(state, deltaSeconds);
  updateAbilities(state, deltaSeconds);
  updateAutomation(state, deltaSeconds);
  updateDerivedCageStats(state);
  refreshEcology(state);
  updateEvent(state, deltaSeconds);
  updatePigRequests(state, deltaSeconds);
  refreshEcology(state);
  updateHappiness(state);
  updateObjective(state, deltaSeconds);
  updateNeeds(state, deltaSeconds);
  updateSurvival(state, deltaSeconds);
  updatePigs(state, deltaSeconds);
  updatePoops(state, deltaSeconds);
  updateMessPiles(state);
  updateLitterTrays(state, deltaSeconds);
  updateRobot(state, deltaSeconds);
  updateCleanliness(state);
  updateHeldPigRequestProgress(state);
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
  const event = pickWeighted(events);
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
  const supportScore =
    Number(state.furniture.hideyHouse) * 2 +
    Number(state.furniture.tunnel) +
    Number(state.furniture.snuggleSack) +
    Number(state.furniture.cardboardCastle) * 2 +
    (state.recipes.royalAccord ? 2 : 0);
  const unsupportedPigs = Math.max(0, state.pigs.length - 2 - supportScore);
  const unsupportedPenalty = Math.max(0, unsupportedPigs * 9 - (state.lateGame.cavyCouncil ? 4 : 0));
  const bondedPigCount = state.pigs.filter((pig) => pig.bondedPigId !== null).length;
  const bondBonus =
    bondedPigCount * (2 + (state.wisdom.socialMemory ? 1 : 0)) +
    (state.wisdom.bondedBeginnings && bondedPigCount > 0 ? 4 : 0);
  const councilSocialBonus = state.lateGame.cavyCouncil ? 12 : 0;
  state.cage.enrichment =
    Number(state.furniture.chewToy) * 22 +
    Number(state.furniture.snuggleSack) * 24 +
    Number(state.furniture.cardboardCastle) * 18 +
    Number(state.furniture.tunnel) * 12 +
    (hasFurnitureSynergy(state, "zoomiePlayground") ? 6 : 0) +
    (state.wisdom.rareInstinct ? 5 : 0);
  state.cage.socialization = Math.max(
    0,
    Math.max(0, state.pigs.length - 1) * 10 +
      Number(state.furniture.hideyHouse) * 8 +
      Number(state.furniture.tunnel) * 4 +
      Number(state.furniture.snuggleSack) * 3 +
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
  const councilHappinessBonus = state.lateGame.cavyCouncil && state.pigs.length >= 8 ? 5 : 0;
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

function updateObjective(state: GameState, deltaSeconds: number): void {
  const objective = state.objective;
  objective.timer -= deltaSeconds;

  if (objective.id === "keepClean" && state.cage.cleanliness >= 80) {
    objective.progress = Math.min(objective.target, objective.progress + deltaSeconds);
  }
  if (objective.id === "herdHarmony" && state.pigs.length >= 3 && state.cage.happiness >= 78 && state.cage.space >= 65) {
    objective.progress = Math.min(objective.target, objective.progress + deltaSeconds);
  }
  if (objective.id === "collectRare") objective.progress = Math.min(objective.target, state.stats.rarePoopsCleaned);
  if (objective.id === "earnBeans") objective.progress = Math.min(objective.target, Math.floor(state.beans));
  if (objective.id === "fuelAutomation") objective.progress = Math.min(objective.target, state.automation.overdrive > 0 ? 1 : 0);
  if (objective.id === "unlockRecipe") objective.progress = Math.min(objective.target, state.stats.recipesUnlocked);

  if (objective.progress >= objective.target) {
    const reward = 8 + state.stats.objectivesCompleted * 3;
    state.beans += reward;
    state.stats.lifetimeBeans += reward;
    state.stats.objectivesCompleted += 1;
    addLog(state, `Objective complete: ${objective.title}. +${reward} Beans.`);
    state.objective = createNextObjective(state);
    return;
  }

  if (objective.timer <= 0) {
    addLog(state, `Objective expired: ${objective.title}.`);
    state.objective = createNextObjective(state);
  }
}

function createNextObjective(state: GameState): GameState["objective"] {
  const index = state.stats.objectivesCompleted % 9;
  const objectives: GameState["objective"][] = [
    { id: "cleanBurst", title: "Clean 5 beans quickly", progress: 0, target: 5, timer: 35 },
    { id: "keepClean", title: "Keep clean above 80%", progress: 0, target: 20, timer: 45 },
    { id: "collectRare", title: "Clean 2 more rare beans", progress: 0, target: state.stats.rarePoopsCleaned + 2, timer: 70 },
    { id: "useAbility", title: "Use an active ability", progress: 0, target: 1, timer: 60 },
    { id: "unlockFurniture", title: "Unlock furniture", progress: 0, target: 1, timer: 90 },
    { id: "earnBeans", title: "Hold 75 Beans", progress: Math.min(state.beans, 75), target: 75, timer: 90 },
    { id: "herdHarmony", title: "Keep a larger herd happy", progress: 0, target: 18, timer: 60 },
    { id: "fuelAutomation", title: "Fuel automation with Compost", progress: 0, target: 1, timer: 80 },
    { id: "unlockRecipe", title: "Unlock a bean recipe", progress: state.stats.recipesUnlocked, target: state.stats.recipesUnlocked + 1, timer: 110 },
  ];
  return objectives[index];
}

function updateNeeds(state: GameState, deltaSeconds: number): void {
  const pigCount = state.pigs.length;
  const hayDrainMultiplier =
    (state.event.active?.id === "hayFrenzy" ? 1.7 : 1) *
    (state.pigs.some((pig) => pig.trait === "Hay Goblin") ? 1.16 : 1) *
    (state.furniture.chewToy ? 0.9 : 1) *
    (state.lateGame.hayDimension ? 0.82 : 1) *
    (state.wisdom.steadySupplies ? 0.9 : 1);
  const totalWisdom = getTotalWisdom(state);
  const waterDrainMultiplier =
    state.event.bottleJammed ? 0 : (totalWisdom > 0 ? 0.98 ** totalWisdom : 1) * (state.wisdom.steadySupplies ? 0.9 : 1);
  state.needs.hay = Math.max(0, state.needs.hay - 0.035 * pigCount * hayDrainMultiplier * deltaSeconds);
  state.needs.water = Math.max(0, state.needs.water - 0.02 * pigCount * waterDrainMultiplier * deltaSeconds);
  if (state.lateGame.squeakChoir) state.squeaks += (state.wisdom.chorusTraining ? 0.035 : 0.02) * deltaSeconds;
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

  if (state.lateGame.beanSingularity) {
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
  const overdriveBonus = state.automation.overdrive > 0 ? 0.14 : 0;
  const wisdomBonus = state.wisdom.trayAffinity ? 0.12 : 0;
  const synergyBonus = hasFurnitureSynergy(state, "cleanupCircuit") ? 0.08 : 0;
  if (Math.random() > (0.18 + overdriveBonus + wisdomBonus + synergyBonus) * deltaSeconds) return;
  const trayRadius = (state.wisdom.trayAffinity ? 56 : 42) + (hasFurnitureSynergy(state, "cleanupCircuit") ? 8 : 0);
  const poop = state.poops.find((candidate) => Math.hypot(candidate.x - tray.x, candidate.y - tray.y) <= trayRadius);
  if (!poop) return;
  const result = cleanPoopsInRadius(state, poop.x, poop.y, 18);
  if (result.cleaned > 0) addLog(state, `Litter Tray auto-cleaned ${result.cleaned} bean for +${result.earned}.`);
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

  moveRobot(robot, deltaSeconds, state.automation.overdrive > 0 ? 1.55 : 1);

  const sweepRadius = robot.sweepRadius + (hasFurnitureSynergy(state, "cleanupCircuit") ? 6 : 0);
  const result = cleanPoopsInRadius(state, robot.x, robot.y, sweepRadius);
  if (result.cleaned > 0 && robot.cleanLogCooldown <= 0) {
    robot.cleanLogCooldown = state.automation.overdrive > 0 ? 1.8 : 3;
    const noun = result.cleaned === 1 ? "bean" : "beans";
    addLog(state, `Poop Roomba swept ${result.cleaned} ${noun} for +${result.earned}.`);
    updateMilestones(state);
  }
}

function getNearestPoopInRange(state: GameState, robot: Robot): Poop | null {
  let nearestPoop: Poop | null = null;
  let nearestDistance =
    robot.sensorRadius *
    (state.automation.overdrive > 0 ? 1.45 : 1) *
    (hasFurnitureSynergy(state, "cleanupCircuit") ? 1.18 : 1);

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

function moveRobot(robot: Robot, deltaSeconds: number, speedMultiplier: number): void {
  const dx = robot.targetX - robot.x;
  const dy = robot.targetY - robot.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;

  const travel = Math.min(distance, robot.speed * speedMultiplier * deltaSeconds);
  robot.x += (dx / distance) * travel;
  robot.y += (dy / distance) * travel;
}

function updateCleanliness(state: GameState): void {
  const mess = Math.min(
    100,
    state.poops.reduce((total, poop) => {
      if (poop.type === "stinky") return total + 8;
      if (poop.type === "cursed") return total + 11;
      if (poop.type === "messPile") return total + 13;
      if (poop.type === "blessed") return total + 3;
      return total + 5.5;
    }, 0) * (state.furniture.litterTray ? 0.9 : 1),
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
  return Math.max(0, Math.min(100, value));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickWeighted<T>(items: Array<{ event: T; weight: number }>): T {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= Math.max(0, item.weight);
    if (roll <= 0) return item.event;
  }
  return items[items.length - 1].event;
}
