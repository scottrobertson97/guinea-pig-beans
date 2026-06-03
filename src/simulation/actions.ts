import {
  canBuyWisdomPerk,
  getAbilityCost,
  getAutomationFuelCost,
  getCosts,
  getPigCapacity,
  getPrestigeCost,
  getPrestigeProgress,
  getPrestigeWisdomGain,
  getScoopRadius,
  getWisdomCost,
  getWisdomPerk,
} from "./balance";
import { updateMilestones } from "./milestones";
import { advancePigRequest, updateHeldPigRequestProgress } from "./pigRequests";
import { addLegendaryPig, addLog, addPig, spawnEventPoop, syncCageDimensionsToLevel } from "./state";
import type { AbilityId, BeanRecipeId, EventChoiceId, EventId, FurnitureId, GameState, PoopType, WisdomPerkId } from "./types";

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
    { id: "wheekingEcho", eventId: "greatWheeking", label: "Echo Into Mythos", description: "Spend Squeaks to gain a Golden Bean." },
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
    advanceObjective(state, "cleanBurst", result.cleaned);
    addLog(
      state,
      getCleanLog(result.cleaned, result.earned, result.comboBonus, result.comboCount, result.golden, result.stinky),
    );
    updateMilestones(state);
  }

  return result;
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
    cleanedPoops: [],
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
    advancePigRequest(state, "clean", result.cleaned);
    advancePigRequest(state, "combo", comboCount);
    updateHeldPigRequestProgress(state);
  }
  return result;
}

export function refillHay(state: GameState): void {
  state.needs.hay = 100;
  advancePigRequest(state, "hayRefill", 1);
  addLog(state, "Hay rack refilled. The room has been judged acceptable.");
}

export function refillWater(state: GameState): void {
  if (state.event.bottleJammed) {
    state.event.bottleJammed = false;
    addLog(state, "Bottle jam fixed. The water bottle has resumed its duties.");
  }
  state.needs.water = 100;
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
  state.stats.furnitureBought += 1;
  advanceObjective(state, "unlockFurniture", 1);
  advancePigRequest(state, "furniture", 1);
  addLog(state, `${getFurnitureName(id)} unlocked and placed in the cage.`);
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
  const squeakCost = getAbilityCost(state, id);
  if (state.squeaks < squeakCost) {
    addLog(state, `${getAbilityName(id)} needs ${squeakCost} Squeak${squeakCost === 1 ? "" : "s"}.`);
    return false;
  }
  state.squeaks -= squeakCost;

  if (id === "wheekCall") {
    state.abilities.wheekCall = 10;
    state.squeaks += state.wisdom.chorusTraining ? 2 : 1;
    addLog(state, "Wheek call issued. Pigs are converging on snacks.");
  } else if (id === "treatBag") {
    state.abilities.treatBag = 15;
    addLog(state, `Treat bag shaken for ${squeakCost} Squeaks. Production has become emotionally complicated.`);
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
    addLog(state, `Snack Time spent ${squeakCost} Squeaks to boost happiness and rare bean odds.`);
  } else {
    state.abilities.zoomieMode = 12;
    addLog(state, `Zoomie Mode spent ${squeakCost} Squeaks. The cage is now a traffic study.`);
  }

  state.stats.abilitiesUsed += 1;
  advanceObjective(state, "useAbility", 1);
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
  const fuelSeconds =
    18 + (state.recipes.compostCatalyst ? 8 : 0) + (state.wisdom.gentleAutomation ? 5 : 0) + (state.wisdom.compostEngine ? 4 : 0);
  state.automation.overdrive = Math.min(60, state.automation.overdrive + fuelSeconds);
  advanceObjective(state, "fuelAutomation", 1);
  addLog(state, `Compost fuel spent. Automation overdrive active for ${Math.ceil(state.automation.overdrive)}s.`);
  updateMilestones(state);
  return true;
}

export function unlockBeanRecipe(state: GameState, id: BeanRecipeId): boolean {
  if (state.recipes[id]) return false;
  if (!canUnlockBeanRecipe(state, id)) return false;

  if (id === "beanBlessing") {
    state.goldenBeans -= 2;
    state.squeaks -= 8;
  } else if (id === "compostCatalyst") {
    state.compost -= 40;
  } else {
    state.goldenBeans -= 1;
    state.squeaks -= 16;
  }

  state.recipes[id] = true;
  state.stats.recipesUnlocked += 1;
  advanceObjective(state, "unlockRecipe", 1);
  addLog(state, `${getBeanRecipeName(id)} unlocked. Bean chemistry now has consequences.`);
  updateMilestones(state);
  return true;
}

export function canUnlockBeanRecipe(state: GameState, id: BeanRecipeId): boolean {
  if (state.recipes[id]) return false;
  if (id === "beanBlessing") return state.goldenBeans >= 2 && state.squeaks >= 8 && state.stats.blessedCleaned >= 1;
  if (id === "compostCatalyst") return state.compost >= 40 && state.stats.compostCleaned >= 3 && state.stats.stinkyCleaned >= 2;
  return state.goldenBeans >= 1 && state.squeaks >= 16 && (state.stats.royalCleaned >= 1 || state.stats.legendaryPigsAdopted >= 1);
}

export function getBeanRecipeStatus(state: GameState, id: BeanRecipeId): string {
  if (state.recipes[id]) return "Active";
  if (id === "beanBlessing") return "2G + 8S + Blessed";
  if (id === "compostCatalyst") return "40C + Compost/Stinky";
  return "1G + 16S + Royal";
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
  } else {
    state.squeaks -= 5;
    state.goldenBeans += 1;
    addLog(state, "The Great Wheeking echoed into mythos. +1 Golden Bean.");
  }

  state.event.responseReady = false;
  state.stats.eventResponses += 1;
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
  state.pigs.splice(2);
  while (state.pigs.length < 2) addPig(state);
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
  state.recipes.beanBlessing = false;
  state.recipes.compostCatalyst = false;
  state.recipes.royalAccord = false;
  state.event.active = null;
  state.event.nextTimer = 20;
  state.event.bottleJammed = false;
  state.event.responseReady = false;
  state.survival.deathCheckTimer = 12;
  state.stats.prestiges += 1;
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

function getBeanRecipeName(id: BeanRecipeId): string {
  const names: Record<BeanRecipeId, string> = {
    beanBlessing: "Bean Blessing",
    compostCatalyst: "Compost Catalyst",
    royalAccord: "Royal Accord",
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

function awardBeans(state: GameState, amount: number): void {
  state.beans += amount;
  state.stats.lifetimeBeans += amount;
}

function spawnBeansNearPigs(state: GameState, type: PoopType, count: number): void {
  for (let index = 0; index < count; index += 1) {
    const pig = state.pigs[index % Math.max(1, state.pigs.length)];
    const x = (pig?.x ?? state.cage.width / 2) + randomBetween(-28, 28);
    const y = (pig?.y ?? state.cage.height / 2) + randomBetween(-24, 24);
    spawnEventPoop(state, type, x, y);
  }
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function formatNeed(current: number, required: number, singular: string, plural = `${singular}s`): string {
  const missing = Math.max(1, Math.ceil(required - current));
  return `Need ${missing} ${missing === 1 ? singular : plural}`;
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
