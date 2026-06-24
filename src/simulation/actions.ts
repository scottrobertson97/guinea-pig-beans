import {
  CAVY_COUNCIL_HERD_SIZE,
  GOLDEN_SCOOP_MAGNET_MAX_STEP,
  GOLDEN_SCOOP_MAGNET_RADIUS_BONUS,
  GOLDEN_SCOOP_MAGNET_STRENGTH,
  HAY_DIMENSION_FEED_LEVEL,
  SINGULARITY_RECIPE_COMPOST_COST,
  SINGULARITY_RECIPE_CURSED_CLEANED,
  SINGULARITY_RECIPE_RARE_CLEANED,
  canBuyWisdomPerk,
  canChooseWisdomSpecialization,
  getAbilityCost,
  getAutomationFuelDuration,
  getAutomationFuelCost,
  getCosts,
  getGoldenScoopCost,
  getPigCapacity,
  getPrestigeCost,
  getPrestigeProgress,
  getPrestigeWisdomGain,
  getScoopRadius,
  getWisdomCost,
  getWisdomPerk,
  getWisdomSpecialization,
  hasCavyCouncilEffect,
  hasGoldenScoopEffect,
  hasSingularityExperimentEffect,
  hasWisdomSpecialization,
  getSingularityExperimentCost,
} from "./balance";
import { advanceContractProgress, resetContracts } from "./contracts";
import {
  adjustHerdStress,
  adjustPigStressInZone,
  getCageZoneName,
  getPigZoneId,
  getPoopZoneId,
  getZoneMetrics,
  getZoneStewardship,
  refreshEcology,
} from "./ecology";
import { createInitialEventChainsState, recordEventChainChoice } from "./eventChains";
import {
  FURNITURE_IDS,
  createInitialFurnitureCareState,
  getFurnitureCareEntry,
  getFurnitureCareZoneId,
  getFurnitureConditionEffectText,
  getFurnitureConditionLabel,
  getFurnitureName,
} from "./furnitureCare";
import { updateMilestones } from "./milestones";
import { advancePigRequest, updateHeldPigRequestProgress } from "./pigRequests";
import { getPigWelcomeTraitTip, markPigWelcomeComplete } from "./pigWelcome";
import { calmRelationshipTension, getPigRelationshipLine, syncRelationshipWeb } from "./relationships";
import { addLegendaryPig, addLog, addPig, spawnEventPoop, syncCageDimensionsToLevel } from "./state";
import type {
  AbilityId,
  AutomationDirectiveId,
  BeanExchangeTradeId,
  BeanRecipeId,
  CouncilDecreeId,
  EventChoiceId,
  EventId,
  FurnitureId,
  GameState,
  CageZoneId,
  Poop,
  PoopType,
  TechNodeId,
  WisdomPerkId,
  WisdomSpecializationId,
} from "./types";
import { awardBeans, clamp, formatNeed, randomBetween } from "./utils";

type LateGamePurchaseId = Exclude<keyof GameState["lateGame"], "hayDimension" | "squeakChoir" | "cavyCouncil" | "beanSingularity">;

export interface CleanResult {
  cleaned: number;
  earned: number;
  baseEarned: number;
  comboBonus: number;
  comboCount: number;
  golden: number;
  stinky: number;
  rare: number;
  cleanedPoops: CleanedPoop[];
}

interface CleanOptions {
  advanceRequests?: boolean;
  shouldClean?: (poop: Poop) => boolean;
}

export interface BeanExchangeTradeDefinition {
  id: BeanExchangeTradeId;
  label: string;
  description: string;
  log: string;
}

export interface CouncilDecreeDefinition {
  id: CouncilDecreeId;
  label: string;
  description: string;
}

export interface AutomationDirectiveDefinition {
  id: AutomationDirectiveId;
  label: string;
  description: string;
}

export interface FurnitureCareView {
  id: FurnitureId;
  label: string;
  condition: number;
  conditionLabel: string;
  status: string;
  effect: string;
  canCare: boolean;
  zoneId: CageZoneId;
}

const BEAN_EXCHANGE_TRADES: BeanExchangeTradeDefinition[] = [
  {
    id: "beansToCompost",
    label: "Compost Futures",
    description: "Convert Beans into Compost.",
    log: "Bean Exchange converted 250 Beans into 20 Compost.",
  },
  {
    id: "compostToSqueaks",
    label: "Squeak Brokerage",
    description: "Convert Compost into Squeaks.",
    log: "Bean Exchange converted 30 Compost into 5 Squeaks.",
  },
  {
    id: "goldToBeans",
    label: "Liquidate Gold",
    description: "Convert a Golden Bean into Beans.",
    log: "Bean Exchange liquidated 1 Golden Bean into 300 Beans.",
  },
  {
    id: "squeaksToGold",
    label: "Mint Gold",
    description: "Convert Squeaks and Beans into a Golden Bean.",
    log: "Bean Exchange minted 1 Golden Bean from 20 Squeaks and 150 Beans.",
  },
];

const COUNCIL_DECREES: CouncilDecreeDefinition[] = [
  {
    id: "careMandate",
    label: "Care Mandate",
    description: "Spend 6 Squeaks to restore +30 Hay, +30 Water, and +4 Happiness.",
  },
  {
    id: "cleanupOrdinance",
    label: "Cleanup Ordinance",
    description: "Spend 8 Squeaks to clean a wide area in the cage center.",
  },
  {
    id: "herdCharter",
    label: "Herd Charter",
    description: "Spend 10 Squeaks to grant +75 Beans and +1 Golden Bean to a large, happy herd.",
  },
];

const AUTOMATION_DIRECTIVES: AutomationDirectiveDefinition[] = [
  {
    id: "balanced",
    label: "Balanced Sweep",
    description: "Roomba and tray use their normal nearest-bean behavior.",
  },
  {
    id: "cleanliness",
    label: "Protect Cleanliness",
    description: "Automation hunts the messiest beans first to stabilize the cage.",
  },
  {
    id: "litterFocus",
    label: "Litter Focus",
    description: "Automation patrols the litter corner and gives tray cleaning extra reach.",
  },
  {
    id: "rareGuard",
    label: "Rare Guard",
    description: "Automation avoids special beans so the player can clean them manually.",
  },
];

const ABILITY_TECH_NODES: Record<AbilityId, TechNodeId> = {
  wheekCall: "abilityWheekCall",
  treatBag: "abilityTreatBag",
  deepClean: "abilityDeepClean",
  freshBedding: "abilityFreshBedding",
  snackTime: "abilitySnackTime",
  zoomieMode: "abilityZoomieMode",
};

export interface CleanedPoop {
  id: number;
  type: PoopType;
  x: number;
  y: number;
  value: number;
}

export interface EventChoiceView {
  id: EventChoiceId;
  eventId: EventId;
  label: string;
  description: string;
}

const EVENT_CHOICES: Record<EventId, EventChoiceView[]> = {
  zoomies: [
    { id: "zoomiesGuide", eventId: "zoomies", label: "Guide the Zoomies", description: "Start a clean streak and steady the chaos." },
    { id: "zoomiesChaos", eventId: "zoomies", label: "Ride the Chaos", description: "Gain Beans, but a few new beans appear." },
    { id: "zoomiesMomentum", eventId: "zoomies", label: "Channel Momentum", description: "Spend Squeaks to push automation or combo energy." },
  ],
  hayFrenzy: [
    { id: "hayEmergency", eventId: "hayFrenzy", label: "Emergency Timothy", description: "Restore hay with no downside." },
    { id: "hayFeast", eventId: "hayFrenzy", label: "Let Them Feast", description: "Trade hay for Beans and a small happiness bump." },
    { id: "hayBundles", eventId: "hayFrenzy", label: "Pack Hay Bundles", description: "Spend Beans to fully restock hay and earn a Squeak." },
  ],
  napTime: [
    { id: "napProtect", eventId: "napTime", label: "Protect the Nap", description: "Raise happiness while the herd rests." },
    { id: "napQuietClean", eventId: "napTime", label: "Quiet Cleaning", description: "Clean the cage center, but drop the current combo." },
    { id: "napDreamSqueaks", eventId: "napTime", label: "Dream Squeaks", description: "Spend Beans to gain Squeaks." },
  ],
  bottleJam: [
    { id: "bottleFix", eventId: "bottleJam", label: "Fix the Bottle", description: "Clear the jam and restore water." },
    { id: "bottleTap", eventId: "bottleJam", label: "Tap the Nozzle", description: "Gain Beans and some water, with a tiny mood hit." },
    { id: "bottleSpare", eventId: "bottleJam", label: "Use Spare Bottle", description: "Spend Beans to fully restore water." },
  ],
  cageInspection: [
    { id: "inspectionTidy", eventId: "cageInspection", label: "Tidy the Evidence", description: "Clean a wide area using normal cleanup rewards." },
    { id: "inspectionPresent", eventId: "cageInspection", label: "Present the Cage", description: "Cash in a clean cage for Beans." },
    { id: "inspectionSqueaks", eventId: "cageInspection", label: "Offer Squeaks", description: "Spend Squeaks to earn a bigger Bean reward." },
  ],
  compostBloom: [
    { id: "compostHarvest", eventId: "compostBloom", label: "Harvest Bloom", description: "Collect Compost immediately." },
    { id: "compostRipen", eventId: "compostBloom", label: "Let It Ripen", description: "Spawn compost beans for later cleanup." },
    { id: "compostFuel", eventId: "compostBloom", label: "Fuel the System", description: "Spend Compost for overdrive, or Beans without Roomba." },
  ],
  greatWheeking: [
    { id: "wheekingAnswer", eventId: "greatWheeking", label: "Answer the Chorus", description: "Gain Squeaks immediately." },
    { id: "wheekingConduct", eventId: "greatWheeking", label: "Conduct the Herd", description: "Spend Beans for happiness and Squeaks." },
    { id: "wheekingEcho", eventId: "greatWheeking", label: "Echo Into Gold", description: "Spend Squeaks to gain a Golden Bean." },
  ],
  litterRevolt: [
    { id: "litterScrub", eventId: "litterRevolt", label: "Scrub the Corner", description: "Clean the litter corner and calm tidy pigs." },
    { id: "litterCompost", eventId: "litterRevolt", label: "Compost the Evidence", description: "Accept a little mess for Compost and relief." },
    { id: "litterCircuit", eventId: "litterRevolt", label: "Run Cleanup Circuit", description: "Use Roomba or Compost to stabilize the dirty corner." },
  ],
  hideySquabble: [
    { id: "hideyQuiet", eventId: "hideySquabble", label: "Quiet Time", description: "Give shy pigs space and lower hidey stress." },
    { id: "hideyTreaty", eventId: "hideySquabble", label: "Treat Treaty", description: "Spend Beans to settle the argument with snacks." },
    { id: "hideyRebond", eventId: "hideySquabble", label: "Rebond Pair", description: "Spend Squeaks to strengthen social stability." },
  ],
  zoomieTraffic: [
    { id: "trafficLanes", eventId: "zoomieTraffic", label: "Mark Zoomie Lanes", description: "Guide the run into combo momentum." },
    { id: "trafficSprint", eventId: "zoomieTraffic", label: "Join the Sprint", description: "Gain Beans, but the play run gets messier." },
    { id: "trafficTunnel", eventId: "zoomieTraffic", label: "Close the Tunnel Loop", description: "Use the Tunnel to turn traffic into calmer speed." },
  ],
};

const EVENT_CHOICE_MAP = Object.fromEntries(
  Object.values(EVENT_CHOICES).flat().map((choice) => [choice.id, choice]),
) as Record<EventChoiceId, EventChoiceView>;

export function cleanAt(state: GameState, x: number, y: number): number {
  return cleanAtWithResult(state, x, y).earned;
}

export function cleanAtWithResult(state: GameState, x: number, y: number): CleanResult {
  const result = cleanPoopsInRadius(state, x, y, getScoopRadius(state));
  if (result.cleaned > 0) {
    addLog(
      state,
      getCleanLog(result.cleaned, result.earned, result.comboBonus, result.comboCount, result.golden, result.stinky),
    );
    updateMilestones(state);
  }

  return result;
}

export function magnetizePoopsTowardScoop(state: GameState, x: number, y: number): number {
  if (!hasGoldenScoopEffect(state)) return 0;

  const magnetRadius = getScoopRadius(state) + GOLDEN_SCOOP_MAGNET_RADIUS_BONUS;
  let moved = 0;

  for (const poop of state.poops) {
    const dx = x - poop.x;
    const dy = y - poop.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0.1 || distance > magnetRadius) continue;

    const step = Math.min(GOLDEN_SCOOP_MAGNET_MAX_STEP, distance * GOLDEN_SCOOP_MAGNET_STRENGTH);
    poop.x = clamp(poop.x + (dx / distance) * step, 18, state.cage.width - 18);
    poop.y = clamp(poop.y + (dy / distance) * step, 18, state.cage.height - 18);
    moved += 1;
  }

  return moved;
}

export function cleanPoopsInRadius(state: GameState, x: number, y: number, radius: number, options: CleanOptions = {}): CleanResult {
  const result: CleanResult = {
    cleaned: 0,
    earned: 0,
    baseEarned: 0,
    comboBonus: 0,
    comboCount: 0,
    golden: 0,
    stinky: 0,
    rare: 0,
    cleanedPoops: [],
  };

  state.poops = state.poops.filter((poop) => {
    const hit = Math.hypot(poop.x - x, poop.y - y) <= radius;
    if (!hit || (options.shouldClean && !options.shouldClean(poop))) return true;

    if (poop.hitsRemaining > 1) {
      poop.hitsRemaining -= 1;
      poop.value = Math.max(1, poop.value - 1);
      addLog(state, `Mess pile weakened. ${poop.hitsRemaining} cleanups remain.`);
      return true;
    }

    result.cleaned += 1;
    result.baseEarned += poop.value;
    result.cleanedPoops.push({
      id: poop.id,
      type: poop.type,
      x: poop.x,
      y: poop.y,
      value: poop.value,
    });
    if (poop.type === "golden") result.golden += 1;
    if (poop.type === "stinky") result.stinky += 1;
    if (poop.type !== "normal" && poop.type !== "stinky") result.rare += 1;
    if (poop.type === "compost") state.compost += 2 + Math.floor(poop.age / 12);
    if (poop.type === "golden") state.goldenBeans += 1;
    if (poop.type === "blessed") state.squeaks += 1;
    if (poop.type === "mystery") applyMysteryBean(state);
    if (poop.type === "compost") state.stats.compostCleaned += 1;
    if (poop.type === "blessed") state.stats.blessedCleaned += 1;
    if (poop.type === "royal") state.stats.royalCleaned += 1;
    if (poop.type === "cursed") state.stats.cursedCleaned += 1;
    return false;
  });

  if (result.cleaned > 0) {
    const comboCount = state.combo.timer > 0 ? state.combo.count + 1 : 1;
    const cleanStreakLevel = state.tech?.levels?.cleanStreakTraining ?? 0;
    const comboStep = 0.15 + cleanStreakLevel * 0.02;
    const comboBonus = comboCount > 1 ? Math.ceil(result.baseEarned * Math.min(1, (comboCount - 1) * comboStep)) : 0;
    result.comboCount = comboCount;
    result.comboBonus = comboBonus;
    result.earned = result.baseEarned + comboBonus;

    state.combo.count = comboCount;
    state.combo.best = Math.max(state.combo.best, comboCount);
    state.combo.timer = 2.25 + cleanStreakLevel * 0.2;
    state.beans += result.earned;
    state.stats.lifetimeBeans += result.earned;
    state.stats.cleanedPoops += result.cleaned;
    state.stats.goldenCleaned += result.golden;
    state.stats.stinkyCleaned += result.stinky;
    state.stats.rarePoopsCleaned += result.rare;
    advanceContractProgress(state, "clean", result.cleaned);
    advanceContractProgress(state, "combo", comboCount);
    if (result.rare > 0) advanceContractProgress(state, "rareClean", result.rare);
    const recipeBeanCount = result.cleanedPoops.filter((poop) =>
      poop.type === "compost" || poop.type === "blessed" || poop.type === "royal" || poop.type === "golden"
    ).length;
    if (recipeBeanCount > 0) advanceContractProgress(state, "recipeBeanClean", recipeBeanCount);
    if (result.cleanedPoops.some((poop) => getPoopZoneId(state, poop) === "litterCorner")) {
      advanceContractProgress(state, "litterAction", 1, "litterCorner");
    }
    if (options.advanceRequests !== false) {
      advancePigRequest(state, "clean", result.cleaned);
      advancePigRequest(state, "combo", comboCount);
      const activeRequest = state.pigRequest?.active;
      const requestPig = activeRequest ? state.pigs.find((pig) => pig.id === activeRequest.pigId) : null;
      if (requestPig && activeRequest?.id === "favoriteCornerFavor") {
        const favoriteZoneCleans = result.cleanedPoops.filter((poop) => getPoopZoneId(state, poop) === requestPig.favoriteZone).length;
        if (favoriteZoneCleans > 0) advancePigRequest(state, "ecologyClean", favoriteZoneCleans);
      }
      updateHeldPigRequestProgress(state);
    }
  }
  return result;
}

export function refillHay(state: GameState): void {
  state.needs.hay = 100;
  advanceContractProgress(state, "refill", 1);
  advancePigRequest(state, "hayRefill", 1);
  addLog(state, "Hay rack refilled. The room has been judged acceptable.");
}

export function refillWater(state: GameState): void {
  if (state.event.bottleJammed) {
    state.event.bottleJammed = false;
    addLog(state, "Bottle jam fixed. The water bottle has resumed its duties.");
  }
  state.needs.water = 100;
  advanceContractProgress(state, "refill", 1);
  advancePigRequest(state, "waterRefill", 1);
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
  if (state.pigs.length >= getPigCapacity(state)) {
    addLog(state, "The cage is full. Buy a Bigger Cage before adopting another pig.");
    return false;
  }
  const cost = getCosts(state).pig;
  if (state.beans < cost) return false;
  state.beans -= cost;
  const pig = addPig(state);
  state.stats.pigsAdopted += 1;
  addLog(
    state,
    `${pig.name} joined as a ${pig.breed} ${pig.trait}. Favorite: ${pig.favoriteFood}; zone: ${getCageZoneName(pig.favoriteZone)}; ${getPigRelationshipLine(state, pig)}.`,
  );
  updateMilestones(state);
  return true;
}

export function completePigWelcome(state: GameState, pigId: number): boolean {
  const pig = state.pigs.find((candidate) => candidate.id === pigId);
  if (!pig || !markPigWelcomeComplete(state, pigId)) return false;

  awardBeans(state, 12);
  state.squeaks += 1;
  state.cage.happiness = clamp(state.cage.happiness + 3, 0, 100);
  pig.stress = Math.max(0, pig.stress - 8);
  addLog(state, `${pig.name} is welcomed. Trait discovered: ${getPigWelcomeTraitTip(pig)}`);
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
  if (!state.lateGame.hayDimension && state.upgrades.feedLevel >= HAY_DIMENSION_FEED_LEVEL) {
    state.lateGame.hayDimension = true;
    refreshEcology(state);
    addLog(state, "Better Hay opened the Hay Dimension: hay lasts longer, pigs produce faster, and the habitat gains room.");
  }
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
  const previousDimensions = { width: state.cage.width, height: state.cage.height };
  syncCageDimensionsToLevel(state);
  const widthIncrease = state.cage.width - previousDimensions.width;
  const heightIncrease = state.cage.height - previousDimensions.height;
  addLog(
    state,
    `Cage expanded to level ${state.upgrades.cageLevel}: +${widthIncrease}x${heightIncrease} space. Capacity is now ${getPigCapacity(state)} pigs.`,
  );
  updateMilestones(state);
  return true;
}

export function buyFurniture(state: GameState, id: FurnitureId): boolean {
  if (state.furniture[id]) return false;
  const cost = getCosts(state).furniture[id];
  if (state.beans < cost) return false;
  state.beans -= cost;
  state.furniture[id] = true;
  const care = getFurnitureCareEntry(state, id);
  care.condition = Math.max(care.condition, 72);
  care.cooldown = 0;
  state.furnitureCare[id] = care;
  state.stats.furnitureBought += 1;
  advanceContractProgress(state, "furnitureCareOrUnlock", 1);
  advancePigRequest(state, "furniture", 1);
  addLog(state, `${getFurnitureName(id)} unlocked and placed in the cage.`);
  updateMilestones(state);
  return true;
}

export function getFurnitureCareViews(state: GameState): FurnitureCareView[] {
  return FURNITURE_IDS.filter((id) => state.furniture[id]).map((id) => {
    const care = getFurnitureCareEntry(state, id);
    return {
      id,
      label: getFurnitureName(id),
      condition: Math.round(care.condition),
      conditionLabel: getFurnitureConditionLabel(care.condition),
      status: getFurnitureCareStatus(state, id),
      effect: getFurnitureConditionEffectText(state, id),
      canCare: canCareForFurniture(state, id),
      zoneId: getFurnitureCareZoneId(id),
    };
  });
}

export function canCareForFurniture(state: GameState, id: FurnitureId): boolean {
  if (!state.furniture[id]) return false;
  const care = getFurnitureCareEntry(state, id);
  if (care.cooldown > 0 || care.condition >= 100) return false;
  const cost = getFurnitureCareCost(state, id);
  return cost.resource === "compost" ? state.compost >= cost.amount : state.beans >= cost.amount;
}

export function getFurnitureCareStatus(state: GameState, id: FurnitureId): string {
  if (!state.furniture[id]) return "Unlock first";
  const care = getFurnitureCareEntry(state, id);
  if (care.cooldown > 0) return `Cooldown ${Math.ceil(care.cooldown)}s`;
  if (care.condition >= 100) return "Fully cared";
  const cost = getFurnitureCareCost(state, id);
  if (cost.resource === "compost" && state.compost < cost.amount) return formatNeed(state.compost, cost.amount, "Compost", "Compost");
  if (cost.resource === "beans" && state.beans < cost.amount) return formatNeed(state.beans, cost.amount, "Bean");
  return cost.resource === "compost" ? `Care ${cost.amount} Compost` : `Care ${cost.amount} Beans`;
}

export function careForFurniture(state: GameState, id: FurnitureId): boolean {
  if (!canCareForFurniture(state, id)) return false;

  const cost = getFurnitureCareCost(state, id);
  if (cost.resource === "compost") {
    state.compost -= cost.amount;
  } else {
    state.beans -= cost.amount;
  }

  const care = getFurnitureCareEntry(state, id);
  const previousCondition = care.condition;
  const careKitLevel = state.tech?.levels?.furnitureCareKit ?? 0;
  care.condition = Math.min(100, care.condition + 30 + careKitLevel * 3);
  care.cooldown = hasWisdomSpecialization(state, "gentleCare") ? 7 : 10;
  care.lastCare = `Cared for ${getFurnitureName(id)}`;
  state.furnitureCare[id] = care;

  const zoneId = getFurnitureCareZoneId(id);
  const stewardship = getZoneStewardship(state, zoneId);
  stewardship.care = Math.min(100, stewardship.care + 8);
  stewardship.lastAction = `${getFurnitureName(id)} cared for`;
  state.ecology.stewardship[zoneId] = stewardship;
  advanceContractProgress(state, "furnitureCareOrUnlock", 1);
  adjustPigStressInZone(state, zoneId, hasWisdomSpecialization(state, "gentleCare") ? -7 : -4);
  refreshEcology(state);
  addLog(state, getFurnitureCareLog(id, cost, previousCondition, care.condition));
  updateMilestones(state);
  return true;
}

export function canTendHabitatZone(state: GameState, zoneId: CageZoneId): boolean {
  if (getZoneStewardship(state, zoneId).cooldown > 0) return false;
  const cost = getHabitatTendCost(state, zoneId);
  return cost.resource === "compost" ? state.compost >= cost.amount : state.beans >= cost.amount;
}

export function getHabitatTendStatus(state: GameState, zoneId: CageZoneId): string {
  const stewardship = getZoneStewardship(state, zoneId);
  if (stewardship.cooldown > 0) return `Cooldown ${Math.ceil(stewardship.cooldown)}s`;

  const cost = getHabitatTendCost(state, zoneId);
  if (zoneId === "litterCorner" && state.compost < cost.amount && state.beans < cost.amount) {
    return cost.resource === "compost"
      ? `Need ${cost.amount} Compost or ${hasWisdomSpecialization(state, "gentleCare") ? 14 : 18} Beans`
      : formatNeed(state.beans, cost.amount, "Bean");
  }
  if (cost.resource === "compost" && state.compost < cost.amount) return formatNeed(state.compost, cost.amount, "Compost", "Compost");
  if (cost.resource === "beans" && state.beans < cost.amount) return formatNeed(state.beans, cost.amount, "Bean");
  return cost.resource === "compost" ? `Tend ${cost.amount} Compost` : `Tend ${cost.amount} Beans`;
}

export function tendHabitatZone(state: GameState, zoneId: CageZoneId): boolean {
  if (!canTendHabitatZone(state, zoneId)) return false;

  const cost = getHabitatTendCost(state, zoneId);
  if (cost.resource === "compost") {
    state.compost -= cost.amount;
  } else {
    state.beans -= cost.amount;
  }

  const zone = getZoneMetrics(state, zoneId);
  const stewardship = getZoneStewardship(state, zoneId);
  const bottleWasJammed = zoneId === "waterBottle" && state.event.bottleJammed;
  const stewardKitLevel = state.tech?.levels?.habitatStewardKit ?? 0;
  stewardship.care = Math.min(100, stewardship.care + (hasWisdomSpecialization(state, "gentleCare") ? 28 : 22) + stewardKitLevel * 2);
  stewardship.cooldown = Math.max(3, (hasWisdomSpecialization(state, "gentleCare") ? 6 : 8) - stewardKitLevel * 0.5);
  stewardship.lastAction = `Tended ${zone.label}`;
  state.ecology.stewardship[zoneId] = stewardship;

  for (const pig of state.pigs) {
    if (getPigZoneId(state, pig) === zoneId || pig.favoriteZone === zoneId) {
      pig.stress = Math.max(0, pig.stress - (hasWisdomSpecialization(state, "gentleCare") ? 12 : 8));
    }
  }

  if (zoneId === "hayCorner") {
    state.needs.hay = Math.min(100, state.needs.hay + 12);
  } else if (zoneId === "waterBottle") {
    if (state.event.bottleJammed) state.event.bottleJammed = false;
    state.needs.water = Math.min(100, state.needs.water + 12);
  } else if (zoneId === "litterCorner") {
    cleanPoopsInRadius(state, zone.x, zone.y, zone.radius * 0.55);
  }

  advanceContractProgress(state, "zoneTend", 1, zoneId);
  if (zoneId === "litterCorner") advanceContractProgress(state, "litterAction", 1, "litterCorner");
  refreshEcology(state);
  addLog(state, getHabitatTendLog(zoneId, cost, bottleWasJammed));
  updateMilestones(state);
  return true;
}

export function buyRarePig(state: GameState): boolean {
  if (state.pigs.length >= getPigCapacity(state)) {
    addLog(state, "The cage is full. Buy a Bigger Cage before adopting another pig.");
    return false;
  }
  const cost = getCosts(state).rarePig;
  if (state.beans < cost || state.goldenBeans < 1) return false;
  state.beans -= cost;
  state.goldenBeans -= 1;
  const pig = addLegendaryPig(state);
  state.stats.pigsAdopted += 1;
  state.stats.legendaryPigsAdopted += 1;
  addLog(
    state,
    `${pig.name} arrived as a legendary ${pig.breed} ${pig.trait} who favors ${getCageZoneName(pig.favoriteZone)}; ${getPigRelationshipLine(state, pig)}.`,
  );
  updateMilestones(state);
  return true;
}

export function unlockLateGameSystem(state: GameState, id: LateGamePurchaseId): boolean {
  if (state.lateGame[id]) return false;

  const requirements: Record<LateGamePurchaseId, () => boolean> = {
    beanExchange: () => state.beans >= 1200 && state.goldenBeans >= 2,
    goldenScoop: () => {
      const cost = getGoldenScoopCost();
      return state.beans >= cost.beans && state.goldenBeans >= cost.goldenBeans;
    },
  };

  if (!requirements[id]()) return false;
  if (id === "goldenScoop") {
    const cost = getGoldenScoopCost();
    state.beans -= cost.beans;
    state.goldenBeans -= cost.goldenBeans;
  } else {
    state.beans -= 1200;
    state.goldenBeans -= 2;
  }

  state.lateGame[id] = true;
  addLog(
    state,
    id === "goldenScoop"
      ? "Golden Scoop unlocked. Nearby beans now drift toward your cleanup path."
      : `${getLateGameName(id)} unlocked. The cage has become less normal.`,
  );
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
  if (!hasAbilityLicense(state, id)) {
    addLog(state, `${getAbilityName(id)} needs a Tech Tree unlock first.`);
    return false;
  }
  if (state.abilities[id] > 0) return false;
  const squeakCost = getAbilityCost(state, id);
  if (state.squeaks < squeakCost) {
    addLog(state, `${getAbilityName(id)} needs ${squeakCost} Squeak${squeakCost === 1 ? "" : "s"}.`);
    return false;
  }
  state.squeaks -= squeakCost;
  const squeakTrainingLevel = state.tech?.levels?.squeakTraining ?? 0;
  const timingBonus = squeakTrainingLevel >= 3 ? 1 : 0;

  if (id === "wheekCall") {
    state.abilities.wheekCall = 10 + timingBonus * 3;
    state.squeaks += (state.wisdom.chorusTraining ? 2 : 1) + (squeakTrainingLevel >= 1 ? 1 : 0);
    addLog(state, "Wheek call issued. Pigs are converging on snacks.");
  } else if (id === "treatBag") {
    state.abilities.treatBag = 15 + timingBonus * 3;
    addLog(state, `Treat bag shaken for ${squeakCost} Squeaks. Production has become emotionally complicated.`);
  } else if (id === "deepClean") {
    const result = cleanPoopsInRadius(state, state.cage.width / 2, state.cage.height / 2, Math.max(state.cage.width, state.cage.height));
    state.abilities.deepClean = Math.max(32, 45 - timingBonus * 6);
    addLog(state, `Deep Clean cleared ${result.cleaned} beans for +${result.earned}.`);
  } else if (id === "freshBedding") {
    state.cage.cleanliness = 100;
    state.abilities.freshBedding = Math.max(24, 35 - timingBonus * 5);
    adjustHerdStress(state, -8);
    addLog(state, "Fresh bedding restored the cage to suspicious respectability.");
  } else if (id === "snackTime") {
    state.abilities.snackTime = 20 + timingBonus * 4;
    adjustHerdStress(state, -6);
    addLog(state, `Snack Time spent ${squeakCost} Squeaks to boost happiness and rare bean odds.`);
  } else {
    state.abilities.zoomieMode = 12 + timingBonus * 3;
    addLog(state, `Zoomie Mode spent ${squeakCost} Squeaks. The cage is now a traffic study.`);
  }

  state.stats.abilitiesUsed += 1;
  advanceContractProgress(state, "ability", 1);
  advancePigRequest(state, "ability", 1);
  updateMilestones(state);
  return true;
}

export function fuelAutomation(state: GameState): boolean {
  if (!state.robot) {
    addLog(state, "Automation fuel needs a Poop Roomba first.");
    return false;
  }
  const cost = getAutomationFuelCost(state);
  if (state.compost < cost) return false;

  state.compost -= cost;
  const fuelSeconds = getAutomationFuelDuration(state);
  state.automation.overdrive = Math.min(60, state.automation.overdrive + fuelSeconds);
  addLog(state, `Compost fuel spent. Automation overdrive active for ${Math.ceil(state.automation.overdrive)}s.`);
  updateMilestones(state);
  return true;
}

export function getAutomationDirectives(): AutomationDirectiveDefinition[] {
  return AUTOMATION_DIRECTIVES;
}

export function canSetAutomationDirective(state: GameState, id: AutomationDirectiveId): boolean {
  if (id === "rareGuard" && (state.tech?.levels?.rareGuardProtocol ?? 0) <= 0) return false;
  return hasAutomationTool(state) && state.automation.directive !== id;
}

export function getAutomationDirectiveStatus(state: GameState, id: AutomationDirectiveId): string {
  if (!hasAutomationTool(state)) return "Needs automation";
  if (id === "rareGuard" && (state.tech?.levels?.rareGuardProtocol ?? 0) <= 0) return "Unlock protocol";
  if (state.automation.directive === id) return "Active";
  return "Select";
}

export function setAutomationDirective(state: GameState, id: AutomationDirectiveId): boolean {
  if (!canSetAutomationDirective(state, id)) return false;
  state.automation.directive = id;
  if (id === "cleanliness" || id === "litterFocus") advanceContractProgress(state, "automationDirective", 1);
  addLog(state, `Automation directive set to ${getAutomationDirectiveName(id)}.`);
  updateMilestones(state);
  return true;
}

export function getAutomationDirectiveName(id: AutomationDirectiveId): string {
  return AUTOMATION_DIRECTIVES.find((directive) => directive.id === id)?.label ?? "Balanced Sweep";
}

export function unlockBeanRecipe(state: GameState, id: BeanRecipeId): boolean {
  if (state.recipes[id]) return false;
  if (!canUnlockBeanRecipe(state, id)) return false;

  if (id === "beanBlessing") {
    state.goldenBeans -= 2;
    state.squeaks -= 8;
  } else if (id === "compostCatalyst") {
    state.compost -= 40;
  } else if (id === "royalAccord") {
    state.goldenBeans -= 1;
    state.squeaks -= 16;
  } else {
    state.compost -= SINGULARITY_RECIPE_COMPOST_COST;
  }

  state.recipes[id] = true;
  state.stats.recipesUnlocked += 1;
  advanceContractProgress(state, "recipeUnlockOrCompostHold", 1);
  addLog(state, `${getBeanRecipeName(id)} unlocked. Bean chemistry now has consequences.`);
  updateMilestones(state);
  return true;
}

export function runSingularityExperiment(state: GameState): boolean {
  if (!canRunSingularityExperiment(state)) return false;

  const cost = getSingularityExperimentCost(state);
  const stabilizerLevel = state.tech?.levels?.singularityStabilizers ?? 0;
  state.compost -= cost.compost;
  state.squeaks -= cost.squeaks;
  pullPoopsTowardCenter(state, 0.45 + stabilizerLevel * 0.06);
  state.contracts.rareEventBoost = Math.max(
    state.contracts.rareEventBoost,
    (hasWisdomSpecialization(state, "rareBeanAlchemy") ? 3 : 2) + Math.floor(stabilizerLevel / 2),
  );
  spawnEventPoop(
    state,
    "cursed",
    state.cage.width / 2 + randomBetween(-18, 18),
    state.cage.height / 2 + randomBetween(-14, 14),
  );
  advanceContractProgress(state, "recipeUnlockOrCompostHold", 1);
  addLog(state, "Singularity Experiment ran: loose beans pulled inward and cursed bean pressure rose.");
  updateMilestones(state);
  return true;
}

export function canRunSingularityExperiment(state: GameState): boolean {
  const cost = getSingularityExperimentCost(state);
  return (
    hasSingularityExperimentEffect(state) &&
    state.compost >= cost.compost &&
    state.squeaks >= cost.squeaks
  );
}

export function getSingularityExperimentStatus(state: GameState): string {
  if (!hasSingularityExperimentEffect(state)) return "Unlock recipe";
  const cost = getSingularityExperimentCost(state);
  if (state.compost < cost.compost) {
    return formatNeed(state.compost, cost.compost, "Compost", "Compost");
  }
  if (state.squeaks < cost.squeaks) {
    return formatNeed(state.squeaks, cost.squeaks, "Squeak");
  }
  return `${cost.compost}C + ${cost.squeaks}S`;
}

export function getBeanExchangeTrades(): BeanExchangeTradeDefinition[] {
  return BEAN_EXCHANGE_TRADES;
}

export function exchangeBeanResource(state: GameState, tradeId: BeanExchangeTradeId): boolean {
  if (!state.lateGame.beanExchange || getBeanExchangeTradeStatus(state, tradeId) !== "Trade") return false;

  if (tradeId === "beansToCompost") {
    state.beans -= 250;
    state.compost += 20;
  } else if (tradeId === "compostToSqueaks") {
    state.compost -= 30;
    state.squeaks += 5;
  } else if (tradeId === "goldToBeans") {
    state.goldenBeans -= 1;
    state.beans += 300;
    state.stats.lifetimeBeans += 300;
  } else {
    state.squeaks -= 20;
    state.beans -= 150;
    state.goldenBeans += 1;
  }

  addLog(state, getBeanExchangeTrade(tradeId).log);
  updateMilestones(state);
  return true;
}

export function getBeanExchangeTradeStatus(state: GameState, tradeId: BeanExchangeTradeId): string {
  if (!state.lateGame.beanExchange) return "Unlock Bean Exchange";
  if (tradeId === "beansToCompost" && state.beans < 250) return formatNeed(state.beans, 250, "Bean");
  if (tradeId === "compostToSqueaks" && state.compost < 30) return formatNeed(state.compost, 30, "Compost", "Compost");
  if (tradeId === "goldToBeans" && state.goldenBeans < 1) return formatNeed(state.goldenBeans, 1, "Golden Bean");
  if (tradeId === "squeaksToGold") {
    if (state.squeaks < 20) return formatNeed(state.squeaks, 20, "Squeak");
    if (state.beans < 150) return formatNeed(state.beans, 150, "Bean");
  }
  return "Trade";
}

function getBeanExchangeTrade(tradeId: BeanExchangeTradeId): BeanExchangeTradeDefinition {
  return BEAN_EXCHANGE_TRADES.find((trade) => trade.id === tradeId) ?? BEAN_EXCHANGE_TRADES[0];
}

export function getCouncilDecrees(): CouncilDecreeDefinition[] {
  return COUNCIL_DECREES;
}

export function useCouncilDecree(state: GameState, decreeId: CouncilDecreeId): boolean {
  if (getCouncilDecreeStatus(state, decreeId) !== "Pass") return false;

  if (decreeId === "careMandate") {
    state.squeaks -= 6;
    state.needs.hay = Math.min(100, state.needs.hay + 30);
    state.needs.water = Math.min(100, state.needs.water + 30);
    state.cage.happiness = Math.min(100, state.cage.happiness + 4);
    addLog(state, "Cavy Council passed a Care Mandate: hay, water, and morale improved.");
  } else if (decreeId === "cleanupOrdinance") {
    state.squeaks -= 8;
    const radius = Math.max(state.cage.width, state.cage.height) * 0.45;
    const result = cleanPoopsInRadius(state, state.cage.width / 2, state.cage.height / 2, radius, { advanceRequests: false });
    addLog(state, `Cavy Council passed a Cleanup Ordinance: cleaned ${result.cleaned} beans for +${result.earned}.`);
  } else {
    state.squeaks -= 10;
    awardBeans(state, 75);
    state.goldenBeans += 1;
    addLog(state, "Cavy Council ratified a Herd Charter for +75 Beans and +1 Golden Bean.");
  }

  advanceContractProgress(state, "councilDecree", 1, decreeId);
  updateMilestones(state);
  return true;
}

export function getCouncilDecreeStatus(state: GameState, decreeId: CouncilDecreeId): string {
  if (!hasCavyCouncilEffect(state)) return formatNeed(state.pigs.length, CAVY_COUNCIL_HERD_SIZE, "Pig");
  if (decreeId === "careMandate") {
    if (state.squeaks < 6) return formatNeed(state.squeaks, 6, "Squeak");
    return "Pass";
  }
  if (decreeId === "cleanupOrdinance") {
    if (state.squeaks < 8) return formatNeed(state.squeaks, 8, "Squeak");
    if (state.poops.length === 0) return "No beans to clean";
    return "Pass";
  }
  if (state.squeaks < 10) return formatNeed(state.squeaks, 10, "Squeak");
  if (state.pigs.length < CAVY_COUNCIL_HERD_SIZE) return formatNeed(state.pigs.length, CAVY_COUNCIL_HERD_SIZE, "Pig");
  if (state.cage.happiness < 70) return "Need 70% Happy";
  return "Pass";
}

export function canUnlockBeanRecipe(state: GameState, id: BeanRecipeId): boolean {
  if (state.recipes[id]) return false;
  if (id === "beanBlessing") return state.goldenBeans >= 2 && state.squeaks >= 8 && state.stats.blessedCleaned >= 1;
  if (id === "compostCatalyst") return state.compost >= 40 && state.stats.compostCleaned >= 3 && state.stats.stinkyCleaned >= 2;
  if (id === "royalAccord") {
    return state.goldenBeans >= 1 && state.squeaks >= 16 && (state.stats.royalCleaned >= 1 || state.stats.legendaryPigsAdopted >= 1);
  }
  return (
    state.compost >= SINGULARITY_RECIPE_COMPOST_COST &&
    state.stats.rarePoopsCleaned >= SINGULARITY_RECIPE_RARE_CLEANED &&
    state.stats.cursedCleaned >= SINGULARITY_RECIPE_CURSED_CLEANED
  );
}

export function getBeanRecipeStatus(state: GameState, id: BeanRecipeId): string {
  if (state.recipes[id] || (id === "singularityExperiment" && hasSingularityExperimentEffect(state))) return "Active";
  if (id === "beanBlessing") return "2G + 8S + Blessed";
  if (id === "compostCatalyst") return "40C + Compost/Stinky";
  if (id === "royalAccord") return "1G + 16S + Royal";
  return "100C + 25 rare + Cursed";
}

export function buyWisdomPerk(state: GameState, id: WisdomPerkId): boolean {
  if (!canBuyWisdomPerk(state, id)) return false;
  const cost = getWisdomCost(id);

  state.cavyWisdom -= cost;
  state.wisdom[id] = true;
  state.stats.wisdomPerks += 1;
  addLog(state, `${getWisdomPerkName(id)} learned. Future cages will be less improvised.`);
  updateMilestones(state);
  return true;
}

export function chooseWisdomSpecialization(state: GameState, id: WisdomSpecializationId): boolean {
  if (!canChooseWisdomSpecialization(state, id)) return false;
  const specialization = getWisdomSpecialization(id);
  state.wisdomSpecialization = id;
  addLog(state, `Caretaker Philosophy chosen: ${specialization.label}. ${specialization.effect}`);
  updateMilestones(state);
  return true;
}

export function getEventChoices(state: GameState): EventChoiceView[] {
  const event = state.event.active;
  if (!event || !state.event.responseReady) return [];
  return EVENT_CHOICES[event.id];
}

export function canUseEventChoice(state: GameState, id: EventChoiceId): boolean {
  return getEventChoiceStatus(state, id) === "";
}

export function getEventChoiceStatus(state: GameState, id: EventChoiceId): string {
  const event = state.event.active;
  const choice = EVENT_CHOICE_MAP[id];
  if (!event || !state.event.responseReady || choice.eventId !== event.id) return "Unavailable";
  if (id === "zoomiesMomentum" && state.squeaks < 2) return formatNeed(state.squeaks, 2, "Squeak");
  if (id === "hayBundles" && state.beans < 25) return formatNeed(state.beans, 25, "Bean");
  if (id === "napDreamSqueaks" && state.beans < 20) return formatNeed(state.beans, 20, "Bean");
  if (id === "bottleSpare" && state.beans < 25) return formatNeed(state.beans, 25, "Bean");
  if (id === "inspectionPresent" && state.cage.cleanliness < 75) return "Need 75% Clean";
  if (id === "inspectionSqueaks" && state.squeaks < 3) return formatNeed(state.squeaks, 3, "Squeak");
  if (id === "compostFuel" && state.compost < 8) return formatNeed(state.compost, 8, "Compost", "Compost");
  if (id === "wheekingConduct" && state.beans < 30) return formatNeed(state.beans, 30, "Bean");
  if (id === "wheekingEcho" && state.squeaks < 5) return formatNeed(state.squeaks, 5, "Squeak");
  if (id === "litterCircuit" && !state.robot && state.compost < 5) return "Need Roomba or 5 Compost";
  if (id === "hideyTreaty" && state.beans < 20) return formatNeed(state.beans, 20, "Bean");
  if (id === "hideyRebond" && state.squeaks < 2) return formatNeed(state.squeaks, 2, "Squeak");
  if (id === "trafficTunnel" && !state.furniture.tunnel) return "Need Tunnel";
  return "";
}

export function respondToEventChoice(state: GameState, id: EventChoiceId): boolean {
  const event = state.event.active;
  const choice = EVENT_CHOICE_MAP[id];
  if (!event || !state.event.responseReady || choice.eventId !== event.id || !canUseEventChoice(state, id)) return false;

  if (id === "zoomiesGuide") {
    state.combo.timer = Math.max(state.combo.timer, 4);
    state.combo.count = Math.max(state.combo.count, 2);
    addLog(state, "Zoomies guided into a clean streak. The herd accepts this routing.");
  } else if (id === "zoomiesChaos") {
    awardBeans(state, 35);
    spawnBeansNearPigs(state, "normal", 2);
    addLog(state, "Zoomies ridden for +35 Beans. Two fresh beans joined the traffic pattern.");
  } else if (id === "zoomiesMomentum") {
    state.squeaks -= 2;
    if (state.robot) {
      state.automation.overdrive = Math.min(60, state.automation.overdrive + 10);
      addLog(state, "Zoomie momentum spent 2 Squeaks to boost Roomba overdrive.");
    } else {
      state.combo.timer = Math.max(state.combo.timer, 4);
      state.combo.count += 2;
      addLog(state, "Zoomie momentum spent 2 Squeaks to raise the clean streak.");
    }
  } else if (id === "hayEmergency") {
    state.needs.hay = Math.min(100, state.needs.hay + 30);
    addLog(state, "Emergency Timothy restored +30 Hay.");
  } else if (id === "hayFeast") {
    awardBeans(state, 20);
    state.needs.hay = Math.max(0, state.needs.hay - 15);
    state.cage.happiness = Math.min(100, state.cage.happiness + 5);
    addLog(state, "The herd feasted for +20 Beans. Hay suffered a little.");
  } else if (id === "hayBundles") {
    state.beans -= 25;
    state.needs.hay = 100;
    state.squeaks += 1;
    addLog(state, "Hay bundles packed for 25 Beans. Hay is full and the herd gave +1 Squeak.");
  } else if (id === "napProtect") {
    state.cage.happiness = Math.min(100, state.cage.happiness + 12);
    addLog(state, "Nap Time protected. Happiness rose by 12.");
  } else if (id === "napQuietClean") {
    const result = cleanPoopsInRadius(state, state.cage.width / 2, state.cage.height / 2, 160);
    state.combo.timer = 0;
    state.combo.count = 0;
    addLog(state, `Quiet Cleaning handled ${result.cleaned} beans for +${result.earned}. The combo went quiet too.`);
  } else if (id === "napDreamSqueaks") {
    state.beans -= 20;
    state.squeaks += 3;
    addLog(state, "Dream Squeaks traded 20 Beans for +3 Squeaks.");
  } else if (id === "bottleFix") {
    state.event.bottleJammed = false;
    state.needs.water = Math.min(100, state.needs.water + 35);
    addLog(state, "Bottle Jam fixed before the herd could draft a complaint.");
  } else if (id === "bottleTap") {
    awardBeans(state, 15);
    state.needs.water = Math.min(100, state.needs.water + 15);
    state.cage.happiness = Math.max(0, state.cage.happiness - 3);
    addLog(state, "Bottle tapped for +15 Beans and +15 Water. The herd noticed the technique.");
  } else if (id === "bottleSpare") {
    state.beans -= 25;
    state.event.bottleJammed = false;
    state.needs.water = 100;
    addLog(state, "Spare bottle installed for 25 Beans. Water is full.");
  } else if (id === "inspectionTidy") {
    const result = cleanPoopsInRadius(state, state.cage.width / 2, state.cage.height / 2, Math.max(state.cage.width, state.cage.height) * 0.72);
    addLog(state, `Inspection tidy cleaned ${result.cleaned} beans for +${result.earned}.`);
  } else if (id === "inspectionPresent") {
    awardBeans(state, 45);
    addLog(state, "The cage was presented with dignity. Inspection awarded +45 Beans.");
  } else if (id === "inspectionSqueaks") {
    state.squeaks -= 3;
    awardBeans(state, 70);
    addLog(state, "Three Squeaks persuaded the inspector. +70 Beans.");
  } else if (id === "compostHarvest") {
    state.compost += 10;
    addLog(state, "Compost Bloom harvested for +10 Compost.");
  } else if (id === "compostRipen") {
    spawnBeansNearPigs(state, "compost", 2);
    addLog(state, "Compost Bloom left to ripen. Two compost beans appeared.");
  } else if (id === "compostFuel") {
    state.compost -= 8;
    if (state.robot) {
      state.automation.overdrive = Math.min(60, state.automation.overdrive + 18);
      addLog(state, "Compost Bloom fueled Roomba overdrive for 18 seconds.");
    } else {
      awardBeans(state, 35);
      addLog(state, "Compost Bloom converted 8 Compost into +35 Beans.");
    }
  } else if (id === "wheekingAnswer") {
    state.squeaks += 8;
    addLog(state, "The Great Wheeking was answered with alarming unity.");
  } else if (id === "wheekingConduct") {
    state.beans -= 30;
    state.cage.happiness = Math.min(100, state.cage.happiness + 10);
    state.squeaks += 4;
    addLog(state, "The herd was conducted for 30 Beans. Happiness rose and +4 Squeaks rang out.");
  } else if (id === "wheekingEcho") {
    state.squeaks -= 5;
    state.goldenBeans += 1;
    addLog(state, "The Great Wheeking echoed into gold. +1 Golden Bean.");
  } else if (id === "litterScrub") {
    const litter = getZoneMetrics(state, "litterCorner");
    const result = cleanPoopsInRadius(state, litter.x, litter.y, litter.radius * 0.92);
    adjustPigStressInZone(state, "litterCorner", -16);
    addLog(state, `Litter Revolt scrubbed down: cleaned ${result.cleaned} beans and settled the corner.`);
  } else if (id === "litterCompost") {
    state.compost += 8;
    state.cage.cleanliness = Math.max(0, state.cage.cleanliness - 4);
    adjustPigStressInZone(state, "litterCorner", -8);
    addLog(state, "Litter Revolt composted into +8 Compost. The bedding looks offended but calmer.");
  } else if (id === "litterCircuit") {
    const litter = getZoneMetrics(state, "litterCorner");
    if (state.robot) {
      state.automation.overdrive = Math.min(60, state.automation.overdrive + 12);
    } else {
      state.compost -= 5;
    }
    const result = cleanPoopsInRadius(state, litter.x, litter.y, litter.radius * 0.72);
    adjustPigStressInZone(state, "litterCorner", -18);
    addLog(state, `Cleanup Circuit stabilized the litter corner and cleaned ${result.cleaned} beans.`);
  } else if (id === "hideyQuiet") {
    adjustPigStressInZone(state, "hideyZone", -18);
    state.cage.happiness = Math.min(100, state.cage.happiness + 4);
    addLog(state, "Hidey Squabble resolved with quiet time. Shy corners are calmer.");
  } else if (id === "hideyTreaty") {
    state.beans -= 20;
    adjustPigStressInZone(state, "hideyZone", -24);
    state.cage.happiness = Math.min(100, state.cage.happiness + 7);
    addLog(state, "Treat Treaty spent 20 Beans. The hidey zone accepted snack diplomacy.");
  } else if (id === "hideyRebond") {
    state.squeaks -= 2;
    adjustHerdStress(state, -10);
    calmRelationshipTension(state, 16);
    state.cage.socialization += 4;
    addLog(state, "Two Squeaks rebonded the herd. Relationship tension eased and social stability improved.");
  } else if (id === "trafficLanes") {
    state.combo.timer = Math.max(state.combo.timer, 5);
    state.combo.count = Math.max(state.combo.count, 3);
    adjustPigStressInZone(state, "playRun", -10);
    addLog(state, "Zoomie lanes marked. Clean streak momentum is ready.");
  } else if (id === "trafficSprint") {
    awardBeans(state, 40);
    spawnBeansNearPigs(state, "normal", 3);
    adjustPigStressInZone(state, "playRun", 5);
    addLog(state, "You joined the sprint for +40 Beans. Three beans joined the traffic report.");
  } else if (id === "trafficTunnel") {
    state.abilities.zoomieMode = Math.max(state.abilities.zoomieMode, 8);
    adjustPigStressInZone(state, "playRun", -18);
    addLog(state, "Tunnel loop closed. Zoomies are faster and less frantic for a bit.");
  }

  state.event.responseReady = false;
  state.stats.eventResponses += 1;
  recordEventChainChoice(state, event, id);
  updateMilestones(state);
  return true;
}

export function prestige(state: GameState): boolean {
  const cost = getPrestigeCost();
  if (getPrestigeProgress(state) < cost) return false;

  const wisdomGained = getPrestigeWisdomGain(state);
  state.cavyWisdom += wisdomGained;
  state.prestige.lifetimeBeansClaimed = state.stats.lifetimeBeans;
  state.beans = 0;
  state.compost = 0;
  state.squeaks = 0;
  state.goldenBeans = 0;
  state.poops = [];
  state.robot = null;
  state.automation.overdrive = 0;
  state.automation.directive = "balanced";
  state.pigs.splice(2);
  while (state.pigs.length < 2) addPig(state);
  if (state.pigs[0] && state.pigs[1]) {
    state.pigs[0].bondedPigId = state.pigs[1].id;
    state.pigs[1].bondedPigId = state.pigs[0].id;
  }
  syncRelationshipWeb(state);
  state.upgrades.feedLevel = 0;
  state.upgrades.scoopLevel = 0;
  state.upgrades.cageLevel = 0;
  syncCageDimensionsToLevel(state);
  state.needs.hay = 100;
  state.needs.water = 100;
  state.cage.cleanliness = 100;
  state.cage.enrichment = 0;
  state.cage.socialization = 0;
  state.cage.space = 100;
  for (const id of Object.keys(state.furniture) as FurnitureId[]) state.furniture[id] = false;
  state.furnitureCare = createInitialFurnitureCareState();
  state.recipes.beanBlessing = false;
  state.recipes.compostCatalyst = false;
  state.recipes.royalAccord = false;
  state.lateGame.hayDimension = false;
  state.lateGame.beanExchange = false;
  state.lateGame.goldenScoop = false;
  state.lateGame.cavyCouncil = false;
  state.lateGame.squeakChoir = false;
  state.lateGame.beanSingularity = false;
  state.tech.levels = {};
  state.event.active = null;
  state.event.nextTimer = 20;
  state.event.bottleJammed = false;
  state.event.responseReady = false;
  state.eventChains = createInitialEventChainsState();
  for (const pig of state.pigs) pig.stress = 0;
  refreshEcology(state);
  state.survival.deathCheckTimer = 12;
  state.stats.prestiges += 1;
  state.objective = {
    id: "cleanBurst",
    title: "Clean 3 beans quickly",
    progress: 0,
    target: 3,
    timer: 45,
  };
  resetContracts(state);
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

function getAbilityName(id: AbilityId): string {
  const names: Record<AbilityId, string> = {
    wheekCall: "Wheek Call",
    treatBag: "Treat Bag",
    deepClean: "Deep Clean",
    freshBedding: "Fresh Bedding",
    snackTime: "Snack Time",
    zoomieMode: "Zoomie Mode",
  };
  return names[id];
}

function hasAbilityLicense(state: GameState, id: AbilityId): boolean {
  return (state.tech?.levels?.[ABILITY_TECH_NODES[id]] ?? 0) > 0;
}

function hasAutomationTool(state: GameState): boolean {
  return Boolean(state.robot) || state.furniture.litterTray;
}

function getBeanRecipeName(id: BeanRecipeId): string {
  const names: Record<BeanRecipeId, string> = {
    beanBlessing: "Bean Blessing",
    compostCatalyst: "Compost Catalyst",
    royalAccord: "Royal Accord",
    singularityExperiment: "Singularity Experiment",
  };
  return names[id];
}

function getWisdomPerkName(id: WisdomPerkId): string {
  return getWisdomPerk(id).label;
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

function getHabitatTendCost(state: GameState, zoneId: CageZoneId): { resource: "beans" | "compost"; amount: number } {
  const gentleCare = hasWisdomSpecialization(state, "gentleCare");
  const stewardDiscount = state.tech?.levels?.habitatStewardKit ?? 0;
  if (zoneId === "litterCorner") {
    const compostCost = gentleCare ? 3 : 4;
    return state.compost >= compostCost
      ? { resource: "compost", amount: Math.max(1, compostCost - Math.floor(stewardDiscount / 2)) }
      : { resource: "beans", amount: Math.max(8, (gentleCare ? 14 : 18) - stewardDiscount) };
  }
  if (zoneId === "hayCorner" || zoneId === "waterBottle") {
    return { resource: "beans", amount: Math.max(5, (gentleCare ? 8 : 10) - stewardDiscount) };
  }
  return { resource: "beans", amount: Math.max(7, (gentleCare ? 11 : 14) - stewardDiscount) };
}

function getFurnitureCareCost(state: GameState, id: FurnitureId): { resource: "beans" | "compost"; amount: number } {
  const discount = (hasWisdomSpecialization(state, "gentleCare") ? 3 : 0) + (state.tech?.levels?.furnitureCareKit ?? 0);
  if (id === "litterTray" && state.compost >= 3) return { resource: "compost", amount: Math.max(2, 3 - (discount > 0 ? 1 : 0)) };
  const condition = getFurnitureCareEntry(state, id).condition;
  if (condition < 32) return { resource: "beans", amount: Math.max(10, 18 - discount) };
  if (condition < 58) return { resource: "beans", amount: Math.max(8, 14 - discount) };
  return { resource: "beans", amount: Math.max(6, 10 - discount) };
}

function getHabitatTendLog(zoneId: CageZoneId, cost: { resource: "beans" | "compost"; amount: number }, bottleWasJammed: boolean): string {
  const costText = cost.resource === "compost" ? `${cost.amount} Compost` : `${cost.amount} Beans`;
  if (zoneId === "hayCorner") return `Hay Corner tended for ${costText}. Hay rose and the corner feels cared for.`;
  if (zoneId === "waterBottle") {
    return bottleWasJammed
      ? `Water Bottle tended for ${costText}. The bottle is flowing and the zone feels calmer.`
      : `Water Bottle tended for ${costText}. Water rose and the zone feels calmer.`;
  }
  if (zoneId === "litterCorner") return `Litter Corner tended for ${costText}. Nearby beans were scooped and the corner settled.`;
  return `${getCageZoneName(zoneId)} tended for ${costText}. The habitat feels a little more intentional.`;
}

function getFurnitureCareLog(
  id: FurnitureId,
  cost: { resource: "beans" | "compost"; amount: number },
  previousCondition: number,
  nextCondition: number,
): string {
  const costText = cost.resource === "compost" ? `${cost.amount} Compost` : `${cost.amount} Beans`;
  const condition = getFurnitureConditionLabel(nextCondition);
  return `${getFurnitureName(id)} cared for ${costText}. Condition ${Math.round(previousCondition)} -> ${Math.round(nextCondition)} (${condition}).`;
}

function spawnBeansNearPigs(state: GameState, type: PoopType, count: number): void {
  for (let index = 0; index < count; index += 1) {
    const pig = state.pigs[index % Math.max(1, state.pigs.length)];
    const x = (pig?.x ?? state.cage.width / 2) + randomBetween(-28, 28);
    const y = (pig?.y ?? state.cage.height / 2) + randomBetween(-24, 24);
    spawnEventPoop(state, type, x, y);
  }
}

function pullPoopsTowardCenter(state: GameState, strength: number): void {
  const centerX = state.cage.width / 2;
  const centerY = state.cage.height / 2;
  for (const poop of state.poops) {
    poop.x += (centerX - poop.x) * strength;
    poop.y += (centerY - poop.y) * strength;
  }
}

function getLateGameName(id: LateGamePurchaseId): string {
  const names: Record<LateGamePurchaseId, string> = {
    beanExchange: "The Bean Exchange",
    goldenScoop: "Golden Scoop",
  };
  return names[id];
}
