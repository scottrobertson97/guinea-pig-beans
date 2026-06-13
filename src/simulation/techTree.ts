import {
  buyCageUpgrade,
  buyFeedUpgrade,
  buyFurniture,
  buyRobot,
  buyScoopUpgrade,
  buyWisdomPerk,
  canUnlockBeanRecipe,
  chooseWisdomSpecialization,
  prestige,
  unlockBeanRecipe,
  unlockLateGameSystem,
} from "./actions";
import {
  canBuyWisdomPerk,
  canChooseWisdomSpecialization,
  getCosts,
  getGoldenScoopCost,
  getPrestigeCost,
  getPrestigeProgress,
  getPrestigeWisdomGain,
  getWisdomCost,
  getWisdomPerk,
  hasFurnitureSynergy,
  hasGoldenScoopEffect,
  hasSingularityExperimentEffect,
} from "./balance";
import { getFurnitureName } from "./furnitureDefinitions";
import { updateMilestones } from "./milestones";
import { addLog } from "./state";
import type {
  AbilityId,
  BeanRecipeId,
  FurnitureId,
  GameState,
  TechBranchId,
  TechCost,
  TechNodeDefinition,
  TechNodeId,
  TechState,
  WisdomPerkId,
  WisdomSpecializationId,
} from "./types";
import { isRecord } from "./utils";

export const TECH_BRANCHES: Array<{ id: TechBranchId; label: string }> = [
  { id: "care", label: "Care & Cage" },
  { id: "habitat", label: "Habitat" },
  { id: "automation", label: "Automation" },
  { id: "abilities", label: "Abilities & Rare Beans" },
  { id: "wisdom", label: "Wisdom Legacy" },
];

const TECH_NODES: TechNodeDefinition[] = [
  node("betterHay", "care", "Better Hay", "Faster production and better hay systems.", 7),
  node("hayDimension", "care", "Hay Dimension", "Better Hay capstone that slows hay drain and adds room.", 1, ["betterHay"], "derived"),
  node("betterScoop", "care", "Better Scoop", "Wider manual cleaning radius.", 7),
  node("biggerCage", "care", "Bigger Cage", "More herd capacity, space, and mess tolerance.", 7),
  node("cleanStreakTraining", "care", "Clean Streak Training", "Longer combos and stronger streak bonuses.", 3, [], "unlock", [
    { beans: 60 },
    { beans: 180 },
    { beans: 420 },
  ]),
  node("careRoutines", "care", "Care Routines", "Hay and water last longer each level.", 3, ["cleanStreakTraining"], "unlock", [
    { beans: 50 },
    { beans: 150 },
    { beans: 360 },
  ]),

  node("hideyHouse", "habitat", "Hidey House", "A quiet corner for shy pigs and social stability.", 1),
  node("snuggleSack", "habitat", "Snuggle Sack", "Comfort, happiness, and cleaner bedding support.", 1, ["hideyHouse"]),
  node("cozyCorner", "habitat", "Cozy Corner", "Hidey House + Snuggle Sack synergy.", 1, ["hideyHouse", "snuggleSack"], "derived"),
  node("tunnel", "habitat", "Tunnel", "Faster movement and social play.", 1),
  node("chewToy", "habitat", "Chew Toy", "Enrichment and slower hay drain.", 1, ["tunnel"]),
  node("zoomiePlayground", "habitat", "Zoomie Playground", "Tunnel + Chew Toy synergy.", 1, ["tunnel", "chewToy"], "derived"),
  node("litterTray", "habitat", "Litter Tray", "Auto-cleans nearby beans and softens mess.", 1),
  node("cleanupCircuit", "habitat", "Cleanup Circuit", "Litter Tray + Chew Toy synergy.", 1, ["litterTray", "chewToy"], "derived"),
  node("cardboardCastle", "habitat", "Cardboard Castle", "Large-herd support and compost odds.", 1),
  node("royalThrone", "habitat", "Royal Throne", "Royal pig and royal bean support.", 1, ["cardboardCastle"]),
  node("royalCompostCourt", "habitat", "Royal Compost Court", "Castle + Throne synergy.", 1, ["cardboardCastle", "royalThrone"], "derived"),
  node("furnitureCareKit", "habitat", "Furniture Care Kit", "Cheaper, stronger furniture care and slower wear.", 3, ["hideyHouse"], "unlock", [
    { beans: 80 },
    { beans: 180 },
    { beans: 400 },
  ]),
  node("habitatStewardKit", "habitat", "Habitat Steward Kit", "Better zone tending costs, cooldowns, and care gains.", 3, ["furnitureCareKit"], "unlock", [
    { beans: 90 },
    { beans: 220 },
    { beans: 520 },
  ]),

  node("poopRoomba", "automation", "Poop Roomba", "A tiny cleanup operator for loose beans.", 1),
  node("compostOverdrive", "automation", "Compost Overdrive", "Fuel Automation from the Furniture section.", 1, ["poopRoomba"], "derived"),
  node("automationDirectives", "automation", "Automation Directives", "Choose cleanup priorities from Furniture.", 1, ["poopRoomba"], "derived"),
  node("roombaSensors", "automation", "Roomba Sensors", "Faster Roomba movement and wider detection.", 3, ["poopRoomba"], "unlock", [
    { beans: 140 },
    { beans: 320 },
    { beans: 680 },
  ]),
  node("litterMethod", "automation", "Litter Method", "Better Litter Tray timing and reach.", 3, ["litterTray"], "unlock", [
    { compost: 10 },
    { compost: 25 },
    { compost: 50, squeaks: 4 },
  ]),
  node("rareGuardProtocol", "automation", "Rare Guard Protocol", "Unlocks Rare Guard automation behavior.", 1, ["automationDirectives"], "unlock", [
    { beans: 220, squeaks: 4 },
  ]),

  node("abilityWheekCall", "abilities", "Wheek Call", "Calls pigs to snacks and starts the Squeak ability path.", 1, [], "unlock", [{}]),
  node("abilityTreatBag", "abilities", "Treat Bag", "Spend Squeaks for a production burst.", 1, ["abilityWheekCall"], "unlock", [{ squeaks: 2 }]),
  node("abilityFreshBedding", "abilities", "Fresh Bedding", "Spend Squeaks to restore cage cleanliness.", 1, ["abilityWheekCall"], "unlock", [{ squeaks: 3 }]),
  node("abilitySnackTime", "abilities", "Snack Time", "Spend Squeaks for happiness and rare odds.", 1, ["abilityTreatBag"], "unlock", [{ squeaks: 4 }]),
  node("abilityZoomieMode", "abilities", "Zoomie Mode", "Spend Squeaks for fast movement and production.", 1, ["abilityWheekCall"], "unlock", [{ squeaks: 3 }]),
  node("abilityDeepClean", "abilities", "Deep Clean", "Spend Squeaks to clean the whole cage.", 1, ["abilityFreshBedding"], "unlock", [{ squeaks: 5 }]),
  node("squeakTraining", "abilities", "Squeak Training", "Improves Wheek Call, ability costs, and ability timing.", 3, ["abilityWheekCall"], "unlock", [
    { squeaks: 3 },
    { squeaks: 8 },
    { squeaks: 15 },
  ]),
  node("rareCatalog", "abilities", "Rare Catalog", "Improves rare bean odds.", 3, ["abilityWheekCall"], "unlock", [
    { squeaks: 6 },
    { squeaks: 12, goldenBeans: 1 },
    { squeaks: 20, goldenBeans: 2 },
  ]),
  node("beanBlessing", "abilities", "Bean Blessing", "Rare bean recipe that improves rare odds and legendary discounts.", 1, ["rareCatalog"]),
  node("compostCatalyst", "abilities", "Compost Catalyst", "Recipe that strengthens Compost and automation fuel.", 1, ["beanBlessing"]),
  node("royalAccord", "abilities", "Royal Accord", "Recipe for royal herd support and capacity.", 1, ["beanBlessing"]),
  node("beanExchange", "abilities", "Bean Exchange", "Opens rare-resource trades in Recipes.", 1, ["compostCatalyst"]),
  node("goldenScoop", "abilities", "Golden Scoop", "Pulls nearby beans toward your cleanup path.", 1, ["beanExchange"]),
  node("singularityExperiment", "abilities", "Singularity Experiment", "Recipe that turns cursed cleanup into strange gravity.", 1, ["compostCatalyst"]),
  node("singularityStabilizers", "abilities", "Singularity Stabilizers", "Cheaper, stronger Singularity runs.", 3, ["singularityExperiment"], "unlock", [
    { compost: 40, squeaks: 6 },
    { compost: 80, squeaks: 10 },
    { compost: 140, squeaks: 16 },
  ]),

  node("greatComposting", "wisdom", "Great Composting", "Reset a strong run into permanent Cavy Wisdom.", 1, [], "action"),
  node("roomyStart", "wisdom", "Roomy Start", "+2 pig capacity, more cage space, and more mess tolerance.", 1, ["greatComposting"]),
  node("steadySupplies", "wisdom", "Steady Supplies", "Hay and water drain 10% slower.", 1, ["roomyStart"]),
  node("freshStart", "wisdom", "Fresh Start", "Cleanliness gets a permanent +3 cushion.", 1, ["steadySupplies"]),
  node("bondedBeginnings", "wisdom", "Bonded Beginnings", "Bonded pigs add more socialization.", 1, ["greatComposting"]),
  node("socialMemory", "wisdom", "Social Memory", "Every bonded pig adds extra socialization.", 1, ["bondedBeginnings"]),
  node("chorusTraining", "wisdom", "Chorus Training", "Ability costs drop and the herd generates Squeaks.", 1, ["socialMemory"]),
  node("gentleAutomation", "wisdom", "Gentle Automation", "Roomba and Compost fuel are cheaper.", 1, ["greatComposting"]),
  node("compostEngine", "wisdom", "Compost Engine", "Compost fuel is cheaper and compost beans age better.", 1, ["gentleAutomation"]),
  node("trayAffinity", "wisdom", "Tray Affinity", "Litter Tray cleans farther and more often.", 1, ["compostEngine"]),
  node("rareInstinct", "wisdom", "Rare Instinct", "Rare bean odds and enrichment improve.", 1, ["greatComposting"]),
  node("goldenNose", "wisdom", "Golden Nose", "Golden beans are more likely and worth more.", 1, ["rareInstinct"]),
  node("royalMemory", "wisdom", "Royal Memory", "Legendary pigs cost less and royal bean odds improve.", 1, ["goldenNose"]),
  node("gentleCare", "wisdom", "Gentle Care", "A calmer permanent caretaker philosophy.", 1, ["freshStart"]),
  node("automationSteward", "wisdom", "Automation Steward", "A permanent automation-focused caretaker philosophy.", 1, ["trayAffinity"]),
  node("rareBeanAlchemy", "wisdom", "Rare Bean Alchemy", "A permanent strange-bean caretaker philosophy.", 1, ["royalMemory"]),
];

const TECH_NODE_MAP = Object.fromEntries(TECH_NODES.map((definition) => [definition.id, definition])) as Record<
  TechNodeId,
  TechNodeDefinition
>;

const STORED_TECH_NODES = new Set<TechNodeId>([
  "cleanStreakTraining",
  "careRoutines",
  "furnitureCareKit",
  "habitatStewardKit",
  "roombaSensors",
  "litterMethod",
  "rareGuardProtocol",
  "abilityWheekCall",
  "abilityTreatBag",
  "abilityFreshBedding",
  "abilitySnackTime",
  "abilityZoomieMode",
  "abilityDeepClean",
  "squeakTraining",
  "rareCatalog",
  "singularityStabilizers",
]);

const FURNITURE_TECH_NODES: Partial<Record<TechNodeId, FurnitureId>> = {
  hideyHouse: "hideyHouse",
  tunnel: "tunnel",
  litterTray: "litterTray",
  chewToy: "chewToy",
  snuggleSack: "snuggleSack",
  cardboardCastle: "cardboardCastle",
  royalThrone: "royalThrone",
};

const RECIPE_TECH_NODES: Partial<Record<TechNodeId, BeanRecipeId>> = {
  beanBlessing: "beanBlessing",
  compostCatalyst: "compostCatalyst",
  royalAccord: "royalAccord",
  singularityExperiment: "singularityExperiment",
};

const WISDOM_TECH_NODES: Partial<Record<TechNodeId, WisdomPerkId>> = {
  roomyStart: "roomyStart",
  steadySupplies: "steadySupplies",
  freshStart: "freshStart",
  bondedBeginnings: "bondedBeginnings",
  socialMemory: "socialMemory",
  chorusTraining: "chorusTraining",
  gentleAutomation: "gentleAutomation",
  compostEngine: "compostEngine",
  trayAffinity: "trayAffinity",
  rareInstinct: "rareInstinct",
  goldenNose: "goldenNose",
  royalMemory: "royalMemory",
};

const SPECIALIZATION_TECH_NODES: Partial<Record<TechNodeId, WisdomSpecializationId>> = {
  gentleCare: "gentleCare",
  automationSteward: "automationSteward",
  rareBeanAlchemy: "rareBeanAlchemy",
};

const ABILITY_TECH_NODES: Record<AbilityId, TechNodeId> = {
  wheekCall: "abilityWheekCall",
  treatBag: "abilityTreatBag",
  deepClean: "abilityDeepClean",
  freshBedding: "abilityFreshBedding",
  snackTime: "abilitySnackTime",
  zoomieMode: "abilityZoomieMode",
};

function node(
  id: TechNodeId,
  branch: TechBranchId,
  label: string,
  description: string,
  maxLevel: number,
  prerequisites: TechNodeId[] = [],
  kind: TechNodeDefinition["kind"] = "unlock",
  costs?: TechCost[],
): TechNodeDefinition {
  return { id, branch, label, description, maxLevel, prerequisites, kind, costs };
}

export function normalizeTechState(value: unknown): TechState {
  const saved = isRecord(value) && isRecord(value.levels) ? value.levels : {};
  const levels: Partial<Record<TechNodeId, number>> = {};
  for (const definition of TECH_NODES) {
    if (!STORED_TECH_NODES.has(definition.id)) continue;
    const rawLevel = saved[definition.id];
    if (typeof rawLevel !== "number" || !Number.isFinite(rawLevel)) continue;
    levels[definition.id] = Math.max(0, Math.min(definition.maxLevel, Math.floor(rawLevel)));
  }
  return { levels };
}

export function getTechBranches(): Array<{ id: TechBranchId; label: string }> {
  return TECH_BRANCHES;
}

export function getTechNodeDefinitions(branch?: TechBranchId): TechNodeDefinition[] {
  return branch ? TECH_NODES.filter((definition) => definition.branch === branch) : TECH_NODES;
}

export function getTechNodeDefinition(id: TechNodeId): TechNodeDefinition {
  return TECH_NODE_MAP[id];
}

export function getTechLevel(state: GameState, id: TechNodeId): number {
  const definition = getTechNodeDefinition(id);
  if (id === "betterHay") return Math.min(definition.maxLevel, state.upgrades.feedLevel);
  if (id === "betterScoop") return Math.min(definition.maxLevel, state.upgrades.scoopLevel);
  if (id === "biggerCage") return Math.min(definition.maxLevel, state.upgrades.cageLevel);
  if (id === "hayDimension") return state.lateGame.hayDimension || state.upgrades.feedLevel >= 7 ? 1 : 0;
  if (id === "poopRoomba") return state.robot ? 1 : 0;
  if (id === "compostOverdrive") return state.robot ? 1 : 0;
  if (id === "automationDirectives") return state.robot || state.furniture.litterTray ? 1 : 0;
  if (id === "beanExchange") return state.lateGame.beanExchange ? 1 : 0;
  if (id === "goldenScoop") return hasGoldenScoopEffect(state) ? 1 : 0;
  if (id === "greatComposting") {
    return state.cavyWisdom > 0 || state.stats.prestiges > 0 || Object.values(state.wisdom).some(Boolean) ? 1 : 0;
  }

  if (id === "cozyCorner") return hasFurnitureSynergy(state, "cozyCorner") ? 1 : 0;
  if (id === "zoomiePlayground") return hasFurnitureSynergy(state, "zoomiePlayground") ? 1 : 0;
  if (id === "cleanupCircuit") return hasFurnitureSynergy(state, "cleanupCircuit") ? 1 : 0;
  if (id === "royalCompostCourt") return hasFurnitureSynergy(state, "royalCompostCourt") ? 1 : 0;

  const furnitureId = FURNITURE_TECH_NODES[id];
  if (furnitureId) return state.furniture[furnitureId] ? 1 : 0;

  const recipeId = RECIPE_TECH_NODES[id];
  if (recipeId) return state.recipes[recipeId] || (recipeId === "singularityExperiment" && hasSingularityExperimentEffect(state)) ? 1 : 0;

  const wisdomId = WISDOM_TECH_NODES[id];
  if (wisdomId) return state.wisdom[wisdomId] ? 1 : 0;

  const specializationId = SPECIALIZATION_TECH_NODES[id];
  if (specializationId) return state.wisdomSpecialization === specializationId ? 1 : 0;

  return Math.min(definition.maxLevel, state.tech?.levels?.[id] ?? 0);
}

export function isTechComplete(state: GameState, id: TechNodeId): boolean {
  return getTechLevel(state, id) >= getTechNodeDefinition(id).maxLevel;
}

export function isAbilityTechUnlocked(state: GameState, id: AbilityId): boolean {
  return isTechComplete(state, ABILITY_TECH_NODES[id]);
}

export function getAbilityTechNodeId(id: AbilityId): TechNodeId {
  return ABILITY_TECH_NODES[id];
}

export function getAvailableTechUnlockCount(state: GameState): number {
  return TECH_NODES.reduce((total, definition) => total + Number(canUnlockTechNode(state, definition.id)), 0);
}

export function canUnlockTechNode(state: GameState, id: TechNodeId): boolean {
  const definition = getTechNodeDefinition(id);
  if (definition.kind === "derived") return false;
  if (definition.kind === "action") return id === "greatComposting" && getPrestigeWisdomGain(state) > 0;
  if (isTechComplete(state, id) || !arePrerequisitesComplete(state, definition)) return false;

  if (id === "betterHay") return state.beans >= getCosts(state).feed;
  if (id === "betterScoop") return state.beans >= getCosts(state).scoop;
  if (id === "biggerCage") return state.beans >= getCosts(state).cage;
  if (id === "poopRoomba") return !state.robot && state.beans >= getCosts(state).robot;
  if (id === "beanExchange") return !state.lateGame.beanExchange && state.beans >= 1200 && state.goldenBeans >= 2;
  if (id === "goldenScoop") {
    const cost = getGoldenScoopCost();
    return !hasGoldenScoopEffect(state) && state.beans >= cost.beans && state.goldenBeans >= cost.goldenBeans;
  }

  const furnitureId = FURNITURE_TECH_NODES[id];
  if (furnitureId) return !state.furniture[furnitureId] && state.beans >= getCosts(state).furniture[furnitureId];

  const recipeId = RECIPE_TECH_NODES[id];
  if (recipeId) return canUnlockBeanRecipe(state, recipeId);

  const wisdomId = WISDOM_TECH_NODES[id];
  if (wisdomId) return canBuyWisdomPerk(state, wisdomId);

  const specializationId = SPECIALIZATION_TECH_NODES[id];
  if (specializationId) return canChooseWisdomSpecialization(state, specializationId);

  return hasTechCost(state, getNextTechCost(state, id));
}

export function unlockTechNode(state: GameState, id: TechNodeId): boolean {
  if (!canUnlockTechNode(state, id)) return false;

  if (id === "greatComposting") return prestige(state);
  if (id === "betterHay") return buyFeedUpgrade(state);
  if (id === "betterScoop") return buyScoopUpgrade(state);
  if (id === "biggerCage") return buyCageUpgrade(state);
  if (id === "poopRoomba") return buyRobot(state);
  if (id === "beanExchange") return unlockLateGameSystem(state, "beanExchange");
  if (id === "goldenScoop") return unlockLateGameSystem(state, "goldenScoop");

  const furnitureId = FURNITURE_TECH_NODES[id];
  if (furnitureId) return buyFurniture(state, furnitureId);

  const recipeId = RECIPE_TECH_NODES[id];
  if (recipeId) return unlockBeanRecipe(state, recipeId);

  const wisdomId = WISDOM_TECH_NODES[id];
  if (wisdomId) return buyWisdomPerk(state, wisdomId);

  const specializationId = SPECIALIZATION_TECH_NODES[id];
  if (specializationId) return chooseWisdomSpecialization(state, specializationId);

  const cost = getNextTechCost(state, id);
  if (!spendTechCost(state, cost)) return false;
  const nextLevel = getTechLevel(state, id) + 1;
  state.tech.levels[id] = nextLevel;
  const levelText = getLevelText(nextLevel, getTechNodeDefinition(id).maxLevel);
  addLog(state, `${getTechNodeDefinition(id).label}${levelText ? ` ${levelText}` : ""} unlocked.`);
  updateMilestones(state);
  return true;
}

export function getTechNodeStatusText(state: GameState, id: TechNodeId): string {
  const definition = getTechNodeDefinition(id);
  const currentLevel = getTechLevel(state, id);

  if (definition.kind === "action") {
    const wisdomGain = getPrestigeWisdomGain(state);
    if (wisdomGain > 0) return `Gain ${wisdomGain} Wisdom`;
    return formatNeed(getPrestigeProgress(state), getPrestigeCost(), "Lifetime Bean");
  }

  if (currentLevel >= definition.maxLevel) {
    if (definition.maxLevel > 1) return `Lv ${definition.maxLevel}/${definition.maxLevel}`;
    if (SPECIALIZATION_TECH_NODES[id]) return "Active";
    if (WISDOM_TECH_NODES[id]) return "Learned";
    return "Active";
  }

  const missingPrerequisite = definition.prerequisites.find((prerequisite) => !isTechComplete(state, prerequisite));
  if (missingPrerequisite) return `Requires ${getTechNodeDefinition(missingPrerequisite).label}`;

  const wisdomId = WISDOM_TECH_NODES[id];
  if (wisdomId) {
    const perk = getWisdomPerk(wisdomId);
    if (perk.prerequisite && !state.wisdom[perk.prerequisite]) return `Requires ${getWisdomPerk(perk.prerequisite).label}`;
    const cost = getWisdomCost(wisdomId);
    if (state.cavyWisdom < cost) return formatNeed(state.cavyWisdom, cost, "Wisdom", "Wisdom");
    return `Learn ${cost} Wisdom`;
  }

  const specializationId = SPECIALIZATION_TECH_NODES[id];
  if (specializationId) {
    if (state.wisdomSpecialization) return "Philosophy chosen";
    return canChooseWisdomSpecialization(state, specializationId) ? "Choose" : "Requires tier-3 Wisdom";
  }

  const recipeId = RECIPE_TECH_NODES[id];
  if (recipeId) return getRecipeStatusText(state, recipeId);

  if (id === "beanExchange") return getDynamicCostStatus(state, { beans: 1200, goldenBeans: 2 }, "Unlock");
  if (id === "goldenScoop") {
    const cost = getGoldenScoopCost();
    return getDynamicCostStatus(state, { beans: cost.beans, goldenBeans: cost.goldenBeans }, "Unlock");
  }

  if (id === "betterHay") return getDynamicCostStatus(state, { beans: getCosts(state).feed }, `Lv ${currentLevel + 1}/${definition.maxLevel}`);
  if (id === "betterScoop") return getDynamicCostStatus(state, { beans: getCosts(state).scoop }, `Lv ${currentLevel + 1}/${definition.maxLevel}`);
  if (id === "biggerCage") return getDynamicCostStatus(state, { beans: getCosts(state).cage }, `Lv ${currentLevel + 1}/${definition.maxLevel}`);
  if (id === "poopRoomba") return getDynamicCostStatus(state, { beans: getCosts(state).robot }, "Unlock");

  const furnitureId = FURNITURE_TECH_NODES[id];
  if (furnitureId) {
    return getDynamicCostStatus(state, { beans: getCosts(state).furniture[furnitureId] }, getFurnitureName(furnitureId));
  }

  if (definition.kind === "derived") return "Complete prerequisites";

  const cost = getNextTechCost(state, id);
  const readyText = definition.maxLevel > 1 ? `Lv ${currentLevel + 1}/${definition.maxLevel}` : "Unlock";
  return getDynamicCostStatus(state, cost, readyText);
}

export function getTechCostText(cost: TechCost): string {
  const parts: string[] = [];
  if (cost.beans) parts.push(`${cost.beans} Beans`);
  if (cost.compost) parts.push(`${cost.compost} Compost`);
  if (cost.squeaks) parts.push(`${cost.squeaks} Squeaks`);
  if (cost.goldenBeans) parts.push(`${cost.goldenBeans} Gold`);
  if (cost.wisdom) parts.push(`${cost.wisdom} Wisdom`);
  return parts.length > 0 ? parts.join(" + ") : "Free";
}

export function getNextTechCost(state: GameState, id: TechNodeId): TechCost {
  const definition = getTechNodeDefinition(id);
  return definition.costs?.[getTechLevel(state, id)] ?? {};
}

function arePrerequisitesComplete(state: GameState, definition: TechNodeDefinition): boolean {
  return definition.prerequisites.every((prerequisite) => isTechComplete(state, prerequisite));
}

function hasTechCost(state: GameState, cost: TechCost): boolean {
  return (
    state.beans >= (cost.beans ?? 0) &&
    state.compost >= (cost.compost ?? 0) &&
    state.squeaks >= (cost.squeaks ?? 0) &&
    state.goldenBeans >= (cost.goldenBeans ?? 0) &&
    state.cavyWisdom >= (cost.wisdom ?? 0)
  );
}

function spendTechCost(state: GameState, cost: TechCost): boolean {
  if (!hasTechCost(state, cost)) return false;
  state.beans -= cost.beans ?? 0;
  state.compost -= cost.compost ?? 0;
  state.squeaks -= cost.squeaks ?? 0;
  state.goldenBeans -= cost.goldenBeans ?? 0;
  state.cavyWisdom -= cost.wisdom ?? 0;
  return true;
}

function getDynamicCostStatus(state: GameState, cost: TechCost, readyText: string): string {
  if (state.beans < (cost.beans ?? 0)) return formatNeed(state.beans, cost.beans ?? 0, "Bean");
  if (state.compost < (cost.compost ?? 0)) return formatNeed(state.compost, cost.compost ?? 0, "Compost", "Compost");
  if (state.squeaks < (cost.squeaks ?? 0)) return formatNeed(state.squeaks, cost.squeaks ?? 0, "Squeak");
  if (state.goldenBeans < (cost.goldenBeans ?? 0)) return formatNeed(state.goldenBeans, cost.goldenBeans ?? 0, "Golden Bean");
  if (state.cavyWisdom < (cost.wisdom ?? 0)) return formatNeed(state.cavyWisdom, cost.wisdom ?? 0, "Wisdom", "Wisdom");
  const costText = getTechCostText(cost);
  return costText === "Free" ? readyText : `${readyText} - ${costText}`;
}

function getRecipeStatusText(state: GameState, id: BeanRecipeId): string {
  if (state.recipes[id] || (id === "singularityExperiment" && hasSingularityExperimentEffect(state))) return "Active";
  if (id === "beanBlessing") {
    if (state.goldenBeans < 2) return formatNeed(state.goldenBeans, 2, "Golden Bean");
    if (state.squeaks < 8) return formatNeed(state.squeaks, 8, "Squeak");
    if (state.stats.blessedCleaned < 1) return "Clean Blessed";
    return "Unlock";
  }
  if (id === "compostCatalyst") {
    if (state.compost < 40) return formatNeed(state.compost, 40, "Compost", "Compost");
    if (state.stats.compostCleaned < 3) return `Clean ${3 - state.stats.compostCleaned} Compost`;
    if (state.stats.stinkyCleaned < 2) return `Clean ${2 - state.stats.stinkyCleaned} Stinky`;
    return "Unlock";
  }
  if (id === "royalAccord") {
    if (state.goldenBeans < 1) return formatNeed(state.goldenBeans, 1, "Golden Bean");
    if (state.squeaks < 16) return formatNeed(state.squeaks, 16, "Squeak");
    if (state.stats.royalCleaned < 1 && state.stats.legendaryPigsAdopted < 1) return "Clean Royal";
    return "Unlock";
  }
  if (state.compost < 100) return formatNeed(state.compost, 100, "Compost", "Compost");
  if (state.stats.rarePoopsCleaned < 25) return `Clean ${25 - state.stats.rarePoopsCleaned} rare`;
  if (state.stats.cursedCleaned < 1) return "Clean Cursed";
  return "Unlock";
}

function getLevelText(level: number, maxLevel: number): string {
  return maxLevel > 1 ? `level ${level}/${maxLevel}` : "";
}

function formatNeed(current: number, required: number, singular: string, plural = `${singular}s`): string {
  const missing = Math.max(1, Math.ceil(required - current));
  return `Need ${missing} ${missing === 1 ? singular : plural}`;
}
