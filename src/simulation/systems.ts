import { cleanPoopsInRadius } from "./actions";
import { CAGE_PADDING } from "./balance";
import { updateMilestones } from "./milestones";
import { addLog, chooseTarget, createMessPile, spawnPoop } from "./state";
import type { GameState, PigMood, Poop, Robot } from "./types";

export function updateSimulation(state: GameState, deltaSeconds: number): void {
  updateCombo(state, deltaSeconds);
  updateAbilities(state, deltaSeconds);
  updateEvent(state, deltaSeconds);
  updateDerivedCageStats(state);
  updateHappiness(state);
  updateObjective(state, deltaSeconds);
  updateNeeds(state, deltaSeconds);
  updatePigs(state, deltaSeconds);
  updatePoops(state, deltaSeconds);
  updateMessPiles(state);
  updateLitterTrays(state, deltaSeconds);
  updateRobot(state, deltaSeconds);
  updateCleanliness(state);
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
  const events: NonNullable<GameState["event"]["active"]>[] = [
    { id: "zoomies", name: "Zoomies", timer: 15 },
    { id: "hayFrenzy", name: "Hay Frenzy", timer: 18 },
    { id: "napTime", name: "Nap Time", timer: 12 },
    { id: "bottleJam", name: "Bottle Jam", timer: 20 },
    { id: "cageInspection", name: "Cage Inspection", timer: 22 },
    { id: "compostBloom", name: "Compost Bloom", timer: 18 },
    { id: "greatWheeking", name: "The Great Wheeking", timer: 16 },
  ];
  const event = events[Math.floor(Math.random() * events.length)];
  state.event.active = { ...event };
  state.event.responseReady = true;
  if (event.id === "bottleJam") state.event.bottleJammed = true;
  if (event.id === "greatWheeking") state.squeaks += 5;
  addLog(state, `${event.name}! The cage situation has changed.`);
}

function updateDerivedCageStats(state: GameState): void {
  state.cage.enrichment =
    state.furniture.chewToy * 18 +
    state.furniture.snuggleSack * 22 +
    state.furniture.cardboardCastle * 16 +
    state.furniture.tunnel * 10 +
    state.furniturePlacements.length * 3;
  state.cage.socialization = Math.max(0, state.pigs.length - 1) * 10 + state.furniture.hideyHouse * 6;
  state.cage.space = 100 + state.upgrades.cageLevel * 25 - Math.max(0, state.pigs.length - 4) * 8;
}

function updateHappiness(state: GameState): void {
  const needsScore = (state.needs.hay + state.needs.water) / 2;
  const cleanScore = state.cage.cleanliness;
  const enrichmentScore = Math.min(100, 45 + state.cage.enrichment);
  const socialScore = Math.min(100, 55 + state.cage.socialization);
  const spaceScore = Math.max(0, Math.min(100, state.cage.space));
  const eventBonus = state.event.active?.id === "napTime" ? 10 : state.event.active?.id === "greatWheeking" ? 8 : 0;
  const abilityBonus = state.abilities.snackTime > 0 ? 12 : 0;
  const dramaPenalty =
    state.pigs.some((pig) => pig.trait === "Drama Pig") && state.needs.water < 30 ? 12 : 0;
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
          dramaPenalty,
      ),
    ),
  );
}

function updateObjective(state: GameState, deltaSeconds: number): void {
  const objective = state.objective;
  objective.timer -= deltaSeconds;

  if (objective.id === "keepClean" && state.cage.cleanliness >= 80) {
    objective.progress = Math.min(objective.target, objective.progress + deltaSeconds);
  }
  if (objective.id === "collectRare") objective.progress = Math.min(objective.target, state.stats.rarePoopsCleaned);
  if (objective.id === "earnBeans") objective.progress = Math.min(objective.target, Math.floor(state.beans));

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
  const index = state.stats.objectivesCompleted % 6;
  const objectives: GameState["objective"][] = [
    { id: "cleanBurst", title: "Clean 5 beans quickly", progress: 0, target: 5, timer: 35 },
    { id: "keepClean", title: "Keep clean above 80%", progress: 0, target: 20, timer: 45 },
    { id: "collectRare", title: "Clean 2 more rare beans", progress: 0, target: state.stats.rarePoopsCleaned + 2, timer: 70 },
    { id: "useAbility", title: "Use an active ability", progress: 0, target: 1, timer: 60 },
    { id: "placeFurniture", title: "Buy and place furniture", progress: 0, target: 1, timer: 90 },
    { id: "earnBeans", title: "Hold 75 Beans", progress: Math.min(state.beans, 75), target: 75, timer: 90 },
  ];
  return objectives[index];
}

function updateNeeds(state: GameState, deltaSeconds: number): void {
  const pigCount = state.pigs.length;
  const hayDrainMultiplier =
    (state.event.active?.id === "hayFrenzy" ? 1.7 : 1) *
    (state.pigs.some((pig) => pig.trait === "Hay Goblin") ? 1.16 : 1) *
    (state.furniture.chewToy > 0 ? 0.9 : 1) *
    (state.lateGame.hayDimension ? 0.82 : 1);
  const waterDrainMultiplier = state.event.bottleJammed ? 0 : state.cavyWisdom > 0 ? 0.98 ** state.cavyWisdom : 1;
  state.needs.hay = Math.max(0, state.needs.hay - 0.5 * pigCount * hayDrainMultiplier * deltaSeconds);
  state.needs.water = Math.max(0, state.needs.water - 0.25 * pigCount * waterDrainMultiplier * deltaSeconds);
  if (state.lateGame.squeakChoir) state.squeaks += 0.02 * deltaSeconds;
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
      const eventSpeed = state.event.active?.id === "zoomies" ? 2 : state.abilities.zoomieMode > 0 ? 1.8 : 1;
      const tunnelSpeed = state.furniture.tunnel > 0 ? 1.1 : 1;
      const speedMultiplier = (mood === "content" ? 1 : mood === "messy" ? 0.82 : 0.9) * eventSpeed * tunnelSpeed;
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
    } else if (poop.type === "compost") {
      const bloom = state.event.active?.id === "compostBloom" ? 3 : 1;
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
  const trays = state.furniturePlacements.filter((placement) => placement.furnitureId === "litterTray");
  if (trays.length === 0) return;

  for (const tray of trays) {
    if (Math.random() > 0.18 * deltaSeconds) continue;
    const poop = state.poops.find((candidate) => Math.hypot(candidate.x - tray.x, candidate.y - tray.y) <= 42);
    if (!poop) continue;
    const result = cleanPoopsInRadius(state, poop.x, poop.y, 18);
    if (result.cleaned > 0) addLog(state, `Litter Tray auto-cleaned ${result.cleaned} bean for +${result.earned}.`);
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
    updateMilestones(state);
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
    state.poops.reduce((total, poop) => {
      if (poop.type === "stinky") return total + 8;
      if (poop.type === "cursed") return total + 11;
      if (poop.type === "messPile") return total + 13;
      if (poop.type === "blessed") return total + 3;
      return total + 5.5;
    }, 0) * (state.furniture.litterTray > 0 ? 0.9 : 1),
  );
  const inspectionBonus = state.event.active?.id === "cageInspection" && state.cage.cleanliness > 90 ? 5 : 0;
  const beddingBonus = state.furniture.snuggleSack > 0 ? 2 : 0;
  state.cage.cleanliness = Math.max(0, Math.min(100, Math.round(100 - mess + inspectionBonus + beddingBonus)));
}

function getSharedMood(state: GameState): PigMood {
  if (state.cage.happiness < 35) return "messy";
  if (state.cage.cleanliness < 35) return "messy";
  if (state.needs.hay <= 0) return "hungry";
  if (state.needs.water <= 0) return "thirsty";
  if (state.cage.space < 55) return "messy";
  return "content";
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
