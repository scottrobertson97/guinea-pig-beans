import { getCosts, getScoopRadius } from "./balance";
import { updateMilestones } from "./milestones";
import { addLegendaryPig, addLog, addPig } from "./state";
import type { AbilityId, FurnitureId, GameState } from "./types";

export interface CleanResult {
  cleaned: number;
  earned: number;
  baseEarned: number;
  comboBonus: number;
  comboCount: number;
  golden: number;
  stinky: number;
  rare: number;
}

export function cleanAt(state: GameState, x: number, y: number): number {
  const result = cleanPoopsInRadius(state, x, y, getScoopRadius(state));
  if (result.cleaned > 0) {
    advanceObjective(state, "cleanBurst", result.cleaned);
    addLog(
      state,
      getCleanLog(result.cleaned, result.earned, result.comboBonus, result.comboCount, result.golden, result.stinky),
    );
    updateMilestones(state);
  }

  return result.earned;
}

export function cleanPoopsInRadius(state: GameState, x: number, y: number, radius: number): CleanResult {
  const result: CleanResult = {
    cleaned: 0,
    earned: 0,
    baseEarned: 0,
    comboBonus: 0,
    comboCount: 0,
    golden: 0,
    stinky: 0,
    rare: 0,
  };

  state.poops = state.poops.filter((poop) => {
    const hit = Math.hypot(poop.x - x, poop.y - y) <= radius;
    if (!hit) return true;

    if (poop.hitsRemaining > 1) {
      poop.hitsRemaining -= 1;
      poop.value = Math.max(1, poop.value - 1);
      addLog(state, `Mess pile weakened. ${poop.hitsRemaining} cleanups remain.`);
      return true;
    }

    result.cleaned += 1;
    result.baseEarned += poop.value;
    if (poop.type === "golden") result.golden += 1;
    if (poop.type === "stinky") result.stinky += 1;
    if (poop.type !== "normal" && poop.type !== "stinky") result.rare += 1;
    if (poop.type === "compost") state.compost += 2 + Math.floor(poop.age / 12);
    if (poop.type === "golden") state.goldenBeans += 1;
    if (poop.type === "blessed") state.squeaks += 1;
    if (poop.type === "mystery") applyMysteryBean(state);
    return false;
  });

  if (result.cleaned > 0) {
    const comboCount = state.combo.timer > 0 ? state.combo.count + 1 : 1;
    const comboBonus = comboCount > 1 ? Math.ceil(result.baseEarned * Math.min(1, (comboCount - 1) * 0.15)) : 0;
    result.comboCount = comboCount;
    result.comboBonus = comboBonus;
    result.earned = result.baseEarned + comboBonus;

    state.combo.count = comboCount;
    state.combo.best = Math.max(state.combo.best, comboCount);
    state.combo.timer = 2.25;
    state.beans += result.earned;
    state.stats.lifetimeBeans += result.earned;
    state.stats.cleanedPoops += result.cleaned;
    state.stats.goldenCleaned += result.golden;
    state.stats.stinkyCleaned += result.stinky;
    state.stats.rarePoopsCleaned += result.rare;
  }
  return result;
}

export function refillHay(state: GameState): void {
  state.needs.hay = 100;
  addLog(state, "Hay rack refilled. The room has been judged acceptable.");
}

export function refillWater(state: GameState): void {
  if (state.event.bottleJammed) {
    state.event.bottleJammed = false;
    addLog(state, "Bottle jam fixed. The water bottle has resumed its duties.");
  }
  state.needs.water = 100;
  addLog(state, "Water bottle topped up with dramatic precision.");
}

export function addBeans(state: GameState, amount: number): void {
  state.beans += amount;
  state.stats.lifetimeBeans += amount;
  addLog(state, `Dev tools added ${amount} Beans.`);
  updateMilestones(state);
}

export function setBeans(state: GameState, amount: number): void {
  state.beans = Math.max(0, amount);
  addLog(state, `Dev tools set Beans to ${state.beans}.`);
  updateMilestones(state);
}

export function buyPig(state: GameState): boolean {
  const cost = getCosts(state).pig;
  if (state.beans < cost) return false;
  state.beans -= cost;
  const pig = addPig(state);
  state.stats.pigsAdopted += 1;
  addLog(state, `${pig.name} joined as a ${pig.breed} ${pig.trait}. Favorite: ${pig.favoriteFood}.`);
  updateMilestones(state);
  return true;
}

export function buyFeedUpgrade(state: GameState): boolean {
  const cost = getCosts(state).feed;
  if (state.beans < cost) return false;
  state.beans -= cost;
  state.upgrades.feedLevel += 1;
  state.stats.feedUpgrades += 1;
  addLog(state, `Better Hay level ${state.upgrades.feedLevel} unlocked.`);
  updateMilestones(state);
  return true;
}

export function buyScoopUpgrade(state: GameState): boolean {
  const cost = getCosts(state).scoop;
  if (state.beans < cost) return false;
  state.beans -= cost;
  state.upgrades.scoopLevel += 1;
  state.stats.scoopUpgrades += 1;
  addLog(state, `Better Scoop level ${state.upgrades.scoopLevel} unlocked.`);
  updateMilestones(state);
  return true;
}

export function buyCageUpgrade(state: GameState): boolean {
  const cost = getCosts(state).cage;
  if (state.beans < cost) return false;
  state.beans -= cost;
  state.upgrades.cageLevel += 1;
  state.cage.space += 25;
  addLog(state, `Cage expanded to level ${state.upgrades.cageLevel}. The herd has opinions.`);
  updateMilestones(state);
  return true;
}

export function buyFurniture(state: GameState, id: FurnitureId): boolean {
  const cost = getCosts(state).furniture[id];
  if (state.beans < cost) return false;
  state.beans -= cost;
  state.furniture[id] += 1;
  state.stats.furnitureBought += 1;
  state.placement.pendingFurniture = id;
  advanceObjective(state, "placeFurniture", 1);
  addLog(state, `${getFurnitureName(id)} purchased. Click the cage to place it.`);
  updateMilestones(state);
  return true;
}

export function buyRarePig(state: GameState): boolean {
  const cost = getCosts(state).rarePig;
  if (state.beans < cost || state.goldenBeans < 1) return false;
  state.beans -= cost;
  state.goldenBeans -= 1;
  const pig = addLegendaryPig(state);
  state.stats.pigsAdopted += 1;
  state.stats.legendaryPigsAdopted += 1;
  addLog(state, `${pig.name} arrived as a legendary ${pig.breed} ${pig.trait}.`);
  updateMilestones(state);
  return true;
}

export function unlockLateGameSystem(state: GameState, id: keyof GameState["lateGame"]): boolean {
  if (state.lateGame[id]) return false;

  const requirements: Record<keyof GameState["lateGame"], () => boolean> = {
    hayDimension: () => state.beans >= 750 && state.compost >= 25,
    beanExchange: () => state.beans >= 1200 && state.goldenBeans >= 2,
    cavyCouncil: () => state.pigs.length >= 8 && state.squeaks >= 10,
    squeakChoir: () => state.squeaks >= 25,
    beanSingularity: () => state.compost >= 100 && state.stats.rarePoopsCleaned >= 25,
  };

  if (!requirements[id]()) return false;
  if (id === "hayDimension") {
    state.beans -= 750;
    state.compost -= 25;
  } else if (id === "beanExchange") {
    state.beans -= 1200;
    state.goldenBeans -= 2;
  } else if (id === "cavyCouncil") {
    state.squeaks -= 10;
  } else if (id === "squeakChoir") {
    state.squeaks -= 25;
  } else {
    state.compost -= 100;
  }

  state.lateGame[id] = true;
  addLog(state, `${getLateGameName(id)} unlocked. The cage has become less normal.`);
  updateMilestones(state);
  return true;
}

export function buyRobot(state: GameState): boolean {
  const cost = getCosts(state).robot;
  if (state.robot || state.beans < cost) return false;

  state.beans -= cost;
  state.robot = createRobotState(state);
  state.stats.roombaPurchased = true;
  addLog(state, "Poop Roomba has entered the cage. The beans are no longer safe.");
  updateMilestones(state);
  return true;
}

export function unlockRobot(state: GameState): boolean {
  if (state.robot) {
    addLog(state, "Dev tools checked the Poop Roomba. Still ominous.");
    return false;
  }

  state.robot = createRobotState(state);
  state.stats.roombaPurchased = true;
  addLog(state, "Dev tools unlocked Poop Roomba.");
  updateMilestones(state);
  return true;
}

export function clearPoops(state: GameState): void {
  const cleared = state.poops.length;
  state.poops = [];
  addLog(state, `Dev tools cleared ${cleared} bean${cleared === 1 ? "" : "s"}.`);
}

export function useAbility(state: GameState, id: AbilityId): boolean {
  if (state.abilities[id] > 0) return false;

  if (id === "wheekCall") {
    state.abilities.wheekCall = 10;
    state.squeaks += 1;
    addLog(state, "Wheek call issued. Pigs are converging on snacks.");
  } else if (id === "treatBag") {
    state.abilities.treatBag = 15;
    state.squeaks += 2;
    addLog(state, "Treat bag shaken. Production has become emotionally complicated.");
  } else if (id === "deepClean") {
    const result = cleanPoopsInRadius(state, state.cage.width / 2, state.cage.height / 2, Math.max(state.cage.width, state.cage.height));
    state.abilities.deepClean = 45;
    addLog(state, `Deep Clean cleared ${result.cleaned} beans for +${result.earned}.`);
  } else if (id === "freshBedding") {
    state.cage.cleanliness = 100;
    state.abilities.freshBedding = 35;
    addLog(state, "Fresh bedding restored the cage to suspicious respectability.");
  } else if (id === "snackTime") {
    state.abilities.snackTime = 20;
    state.squeaks += 3;
    addLog(state, "Snack Time boosted herd happiness and rare bean odds.");
  } else {
    state.abilities.zoomieMode = 12;
    state.squeaks += 1;
    addLog(state, "Zoomie Mode engaged. The cage is now a traffic study.");
  }

  state.stats.abilitiesUsed += 1;
  advanceObjective(state, "useAbility", 1);
  updateMilestones(state);
  return true;
}

export function respondToEvent(state: GameState): boolean {
  const event = state.event.active;
  if (!event || !state.event.responseReady) return false;

  if (event.id === "bottleJam") {
    state.event.bottleJammed = false;
    state.needs.water = Math.min(100, state.needs.water + 35);
    addLog(state, "Bottle Jam handled before the herd could draft a complaint.");
  } else if (event.id === "cageInspection") {
    const reward = state.cage.cleanliness >= 85 ? 40 : 12;
    state.beans += reward;
    state.stats.lifetimeBeans += reward;
    addLog(state, `Cage Inspection response earned +${reward} Beans.`);
  } else if (event.id === "compostBloom") {
    state.compost += 10;
    addLog(state, "Compost Bloom harvested for +10 Compost.");
  } else if (event.id === "greatWheeking") {
    state.squeaks += 8;
    addLog(state, "The Great Wheeking was answered with alarming unity.");
  } else if (event.id === "hayFrenzy") {
    state.needs.hay = Math.min(100, state.needs.hay + 25);
    addLog(state, "Hay Frenzy stabilized with emergency timothy.");
  } else if (event.id === "zoomies") {
    state.combo.timer = Math.max(state.combo.timer, 3);
    state.combo.count = Math.max(state.combo.count, 2);
    addLog(state, "Zoomies redirected into cleaning momentum.");
  } else {
    state.cage.happiness = Math.min(100, state.cage.happiness + 12);
    addLog(state, "Nap Time protected. The pigs respect this.");
  }

  state.event.responseReady = false;
  state.stats.eventResponses += 1;
  updateMilestones(state);
  return true;
}

export function prestige(state: GameState): boolean {
  const cost = getCosts(state).prestige;
  if (state.stats.lifetimeBeans < cost) return false;

  const wisdomGained = Math.max(1, Math.floor(Math.sqrt(state.stats.lifetimeBeans / cost)));
  state.cavyWisdom += wisdomGained;
  state.beans = 0;
  state.compost = 0;
  state.squeaks = 0;
  state.goldenBeans = 0;
  state.poops = [];
  state.robot = null;
  state.pigs.splice(1);
  state.upgrades.feedLevel = 0;
  state.upgrades.scoopLevel = 0;
  state.upgrades.cageLevel = 0;
  state.needs.hay = 100;
  state.needs.water = 100;
  state.cage.cleanliness = 100;
  state.cage.enrichment = 0;
  state.cage.socialization = 0;
  state.cage.space = 100;
  for (const id of Object.keys(state.furniture) as FurnitureId[]) state.furniture[id] = 0;
  state.event.active = null;
  state.event.nextTimer = 20;
  state.event.bottleJammed = false;
  state.event.responseReady = false;
  state.stats.prestiges += 1;
  state.furniturePlacements = [];
  state.placement.pendingFurniture = null;
  state.objective = {
    id: "cleanBurst",
    title: "Clean 3 beans quickly",
    progress: 0,
    target: 3,
    timer: 45,
  };
  state.prestige.ascensions += 1;
  state.prestige.unlocked = Array.from(new Set([...state.prestige.unlocked, "Sacred Scoop", "Ancient Hay Lore"]));
  addLog(state, `The Great Composting grants ${wisdomGained} Cavy Wisdom.`);
  updateMilestones(state);
  return true;
}

function createRobotState(state: GameState): NonNullable<GameState["robot"]> {
  return {
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
}

function getCleanLog(
  cleaned: number,
  earned: number,
  comboBonus: number,
  comboCount: number,
  golden: number,
  stinky: number,
): string {
  const combo = comboBonus > 0 ? ` Clean Streak x${comboCount} added +${comboBonus}.` : "";
  if (golden > 0) return `Cleaned ${cleaned} beans, including ${golden} golden, for +${earned}.${combo}`;
  if (stinky > 0) return `Removed ${stinky} stinky bean${stinky === 1 ? "" : "s"} and earned +${earned}.${combo}`;
  return `Cleaned ${cleaned} bean${cleaned === 1 ? "" : "s"} for +${earned}.${combo}`;
}

function applyMysteryBean(state: GameState): void {
  const roll = Math.random();
  if (roll < 0.33) {
    state.squeaks += 3;
    addLog(state, "Mystery bean released three Squeaks.");
  } else if (roll < 0.66) {
    state.compost += 5;
    addLog(state, "Mystery bean became emergency Compost.");
  } else {
    state.needs.hay = Math.min(100, state.needs.hay + 20);
    addLog(state, "Mystery bean somehow improved the hay situation.");
  }
}

function advanceObjective(state: GameState, id: GameState["objective"]["id"], amount: number): void {
  if (state.objective.id !== id) return;
  state.objective.progress = Math.min(state.objective.target, state.objective.progress + amount);
}

function getFurnitureName(id: FurnitureId): string {
  const names: Record<FurnitureId, string> = {
    hideyHouse: "Hidey House",
    tunnel: "Tunnel",
    litterTray: "Litter Tray",
    chewToy: "Chew Toy",
    snuggleSack: "Snuggle Sack",
    cardboardCastle: "Cardboard Castle",
    royalThrone: "Royal Throne",
  };
  return names[id];
}

function getLateGameName(id: keyof GameState["lateGame"]): string {
  const names: Record<keyof GameState["lateGame"], string> = {
    hayDimension: "The Hay Dimension",
    beanExchange: "The Bean Exchange",
    cavyCouncil: "Cavy Council",
    squeakChoir: "Squeak Choir",
    beanSingularity: "Bean Singularity",
  };
  return names[id];
}
