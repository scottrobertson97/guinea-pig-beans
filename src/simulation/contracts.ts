import { addLog } from "./state";
import {
  CAVY_COUNCIL_HERD_SIZE,
  getPrestigeCost,
  getPrestigeProgress,
  getUnlockedFurnitureCount,
  getWisdomPerks,
  hasCavyCouncilEffect,
  hasWisdomSpecialization,
} from "./balance";
import type {
  ActiveContractState,
  ContractOfferState,
  ContractProgressKind,
  ContractRequirementState,
  ContractResult,
  ContractsState,
  ContractTemplateId,
  GameState,
} from "./types";
import { isRecord } from "./utils";

export interface ContractRequirementView {
  label: string;
  progressText: string;
  complete: boolean;
}

export interface ContractCardView {
  id: string;
  title: string;
  description: string;
  timer: string;
  rewardText: string;
  requirements: ContractRequirementView[];
}

export interface ContractBoardView {
  active: ContractCardView | null;
  offers: ContractCardView[];
  lastResult: ContractResult | null;
}

export interface ContractQuickView {
  title: string;
  progress: string;
  active: boolean;
}

interface ContractTemplate {
  id: ContractTemplateId;
  title: string;
  description: string;
  duration: number;
  rewardText: string;
  reward: {
    beans: number;
    squeaks?: number;
    compost?: number;
    rareEventBoost?: number;
  };
  eligible: (state: GameState) => boolean;
  requirements: () => ContractRequirementState[];
}

const INTRO_CONTRACT_IDS: ContractTemplateId[] = [
  "roomToNest",
  "firstWheek",
  "cleanupRoute",
  "compostStarter",
  "greatCompostingRumor",
];

const ONE_TIME_INTRO_CONTRACT_IDS = new Set<ContractTemplateId>([
  "roomToNest",
  "firstWheek",
  "compostStarter",
  "greatCompostingRumor",
]);

const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "freshCageDelivery",
    title: "Fresh Cage Delivery",
    description: "Ship a basic care bundle by cleaning, refilling, and keeping the cage presentable.",
    duration: 180,
    rewardText: "+45 Beans, +1 Squeak",
    reward: { beans: 45, squeaks: 1 },
    eligible: () => true,
    requirements: () => [
      createRequirement("cleanBeans", "clean", "Clean 8 beans", 8),
      createRequirement("refillCare", "refill", "Refill hay or water once", 1),
      createRequirement("cleanlinessHold", "cleanlinessHold", "Keep cleanliness at 75%+", 15),
    ],
  },
  {
    id: "roomToNest",
    title: "Room to Nest",
    description: "Introduce Furniture by turning early Beans into one cage decision the herd can feel.",
    duration: 240,
    rewardText: "+60 Beans, +1 Squeak",
    reward: { beans: 60, squeaks: 1 },
    eligible: (state) =>
      !isIntroContractSatisfied(state, "roomToNest") &&
      (state.beans >= 25 ||
        state.stats.lifetimeBeans >= 35 ||
        state.stats.cleanedPoops >= 8 ||
        getCompletedTemplateCount(state, "freshCageDelivery") > 0),
    requirements: () => [
      createRequirement("cleanBeans", "clean", "Clean 5 beans", 5),
      createRequirement("furnitureCare", "furnitureCareOrUnlock", "Unlock or care for furniture", 1),
      createRequirement("cleanlinessHold", "cleanlinessHold", "Keep cleanliness at 75%+", 10),
    ],
  },
  {
    id: "firstWheek",
    title: "First Wheek",
    description: "Introduce Abilities by using Wheek Call or another active care move.",
    duration: 210,
    rewardText: "+50 Beans, +2 Squeaks",
    reward: { beans: 50, squeaks: 2 },
    eligible: (state) =>
      !isIntroContractSatisfied(state, "firstWheek") &&
      (state.squeaks > 0 ||
        state.stats.cleanedPoops >= 8 ||
        state.contracts.completed >= 1 ||
        getCompletedTemplateCount(state, "freshCageDelivery") > 0),
    requirements: () => [
      createRequirement("ability", "ability", "Use any active ability", 1),
      createRequirement("refillCare", "refill", "Refill hay or water once", 1),
      createRequirement("combo", "combo", "Reach Clean Streak x3", 3),
    ],
  },
  {
    id: "habitatReset",
    title: "Habitat Reset",
    description: "Turn habitat pressure into a calmer cage through zone care and furniture upkeep.",
    duration: 240,
    rewardText: "+70 Beans, +2 Squeaks",
    reward: { beans: 70, squeaks: 2 },
    eligible: (state) => isIntroContractSatisfied(state, "roomToNest") || getUnlockedFurnitureCount(state) > 0,
    requirements: () => [
      createRequirement("zoneTend", "zoneTend", "Tend 2 different zones", 2),
      createRequirement("furnitureCare", "furnitureCareOrUnlock", "Care for or unlock furniture", 1),
      createRequirement("stressHold", "stressHold", "Average stress below 35", 10),
    ],
  },
  {
    id: "cleanupRoute",
    title: "Cleanup Route",
    description: "Coordinate automation and litter care into one deliberate cleaning route.",
    duration: 240,
    rewardText: "+85 Beans, +6 Compost",
    reward: { beans: 85, compost: 6 },
    eligible: (state) => Boolean(state.robot) || state.furniture.litterTray,
    requirements: () => [
      createRequirement("directive", "automationDirective", "Choose a cleanup directive", 1),
      createRequirement("automationClean", "automationClean", "Automation cleans 4 beans", 4),
      createRequirement("litterAction", "litterAction", "Clean or tend Litter Corner", 1),
    ],
  },
  {
    id: "compostStarter",
    title: "Compost Starter",
    description: "Introduce Bean Recipes by turning Compost or rare cleanup into recipe momentum.",
    duration: 260,
    rewardText: "+90 Beans, +2 Squeaks",
    reward: { beans: 90, squeaks: 2 },
    eligible: (state) =>
      !isIntroContractSatisfied(state, "compostStarter") &&
      (state.compost > 0 ||
        state.stats.compostCleaned > 0 ||
        state.goldenBeans > 0 ||
        state.stats.goldenCleaned > 0 ||
        state.stats.rarePoopsCleaned > 0),
    requirements: () => [
      createRequirement("recipeBeans", "recipeBeanClean", "Clean 1 recipe bean", 1),
      createRequirement("ability", "ability", "Use any active ability", 1),
      createRequirement("recipeOrCompost", "recipeUnlockOrCompostHold", "Hold 40 Compost or unlock a recipe", 1),
    ],
  },
  {
    id: "rareSampleOrder",
    title: "Rare Sample Order",
    description: "Collect a rare sample while preserving enough momentum for a valuable handoff.",
    duration: 240,
    rewardText: "+100 Beans, +1 Squeak, better rare odds",
    reward: { beans: 100, squeaks: 1, rareEventBoost: 1 },
    eligible: (state) => state.stats.rarePoopsCleaned > 0 || state.goldenBeans > 0,
    requirements: () => [
      createRequirement("rareClean", "rareClean", "Clean 1 rare bean", 1),
      createRequirement("combo", "combo", "Reach Clean Streak x4", 4),
      createRequirement("rareResource", "rareResourceHold", "Hold 1 Gold or 8 Squeaks", 1),
    ],
  },
  {
    id: "recipeCommission",
    title: "Recipe Commission",
    description: "Prepare a recipe-minded batch from rare cleanup, abilities, and late resources.",
    duration: 240,
    rewardText: "+120 Beans, +3 Squeaks",
    reward: { beans: 120, squeaks: 3 },
    eligible: (state) =>
      Object.values(state.recipes).some((unlocked) => !unlocked) &&
      (state.compost >= 10 || state.squeaks >= 4 || state.stats.rarePoopsCleaned >= 2 || state.goldenBeans > 0),
    requirements: () => [
      createRequirement("recipeBeans", "recipeBeanClean", "Clean 2 recipe beans", 2),
      createRequirement("ability", "ability", "Use any active ability", 1),
      createRequirement("recipeOrCompost", "recipeUnlockOrCompostHold", "Unlock a recipe or hold 40 Compost", 1),
    ],
  },
  {
    id: "herdCouncilSession",
    title: "Council Session",
    description: "Use a large herd's council to keep morale steady and turn Squeaks into one formal decree.",
    duration: 240,
    rewardText: "+135 Beans, +2 Squeaks",
    reward: { beans: 135, squeaks: 2 },
    eligible: hasCavyCouncilEffect,
    requirements: () => [
      createRequirement("largeHerd", "largeHerdHold", `Keep ${CAVY_COUNCIL_HERD_SIZE} pigs in the herd`, 12),
      createRequirement("happinessHold", "happinessHold", "Keep happiness at 70%+", 12),
      createRequirement("decree", "councilDecree", "Pass 1 Council Decree", 1),
    ],
  },
  {
    id: "greatCompostingRumor",
    title: "Great Composting Rumor",
    description: "Introduce Wisdom by pointing a strong run toward the permanent Great Composting layer.",
    duration: 300,
    rewardText: "+150 Beans, +4 Compost",
    reward: { beans: 150, compost: 4 },
    eligible: (state) =>
      !isIntroContractSatisfied(state, "greatCompostingRumor") &&
      getPrestigeProgress(state) >= getPrestigeCost() * 0.35,
    requirements: () => [
      createRequirement("cleanBeans", "clean", "Clean 20 beans", 20),
      createRequirement("combo", "combo", "Reach Clean Streak x5", 5),
      createRequirement("cleanlinessHold", "cleanlinessHold", "Keep cleanliness at 75%+", 20),
    ],
  },
  {
    id: "caretakerPhilosophy",
    title: "Caretaker Philosophy",
    description: "Prove that permanent Wisdom is shaping this run through care, automation, and personal favors.",
    duration: 260,
    rewardText: "+115 Beans, +2 Squeaks, +4 Compost",
    reward: { beans: 115, squeaks: 2, compost: 4 },
    eligible: (state) => Boolean(state.wisdomSpecialization) || getWisdomPerks().some((perk) => perk.tier >= 3 && state.wisdom[perk.id]),
    requirements: () => [
      createRequirement("zoneTend", "zoneTend", "Tend any habitat zone", 1),
      createRequirement("ability", "ability", "Use any active ability", 1),
      createRequirement("pigRequest", "pigRequest", "Complete 1 pig request", 1),
    ],
  },
];

const TEMPLATE_MAP = Object.fromEntries(CONTRACT_TEMPLATES.map((template) => [template.id, template])) as Record<
  ContractTemplateId,
  ContractTemplate
>;

let nextResultToken = 1;

export function createInitialContractsState(): ContractsState {
  return {
    active: null,
    offers: [],
    completed: 0,
    expired: 0,
    lastResult: null,
    nextOfferSeed: 1,
    rareEventBoost: 0,
    completedTemplates: {},
  };
}

export function normalizeContractsState(value: unknown): ContractsState {
  const saved = isRecord(value) ? value : {};
  return {
    active: normalizeActiveContract(saved.active),
    offers: normalizeContractOffers(saved.offers),
    completed: normalizeWholeNumber(saved.completed),
    expired: normalizeWholeNumber(saved.expired),
    lastResult: normalizeContractResult(saved.lastResult),
    nextOfferSeed: Math.max(1, normalizeWholeNumber(saved.nextOfferSeed, 1)),
    rareEventBoost: normalizeWholeNumber(saved.rareEventBoost),
    completedTemplates: normalizeCompletedTemplates(saved.completedTemplates),
  };
}

export function ensureContractOffers(state: GameState): void {
  state.contracts = normalizeContractsState(state.contracts);
  if (state.contracts.active) return;
  if (state.contracts.offers.length > 0) {
    promoteEligibleIntroOffer(state);
    return;
  }
  state.contracts.offers = createContractOffers(state);
}

export function resetContracts(state: GameState): void {
  state.contracts = createInitialContractsState();
  state.contracts.offers = createContractOffers(state);
}

export function getContractBoardView(state: GameState): ContractBoardView {
  ensureContractOffers(state);
  return {
    active: state.contracts.active ? toContractCardView(state.contracts.active) : null,
    offers: state.contracts.active ? [] : state.contracts.offers.map(toContractCardView),
    lastResult: state.contracts.lastResult,
  };
}

export function getContractQuickView(state: GameState): ContractQuickView {
  ensureContractOffers(state);
  const active = state.contracts.active;
  if (!active) {
    const offerCount = state.contracts.offers.length;
    return {
      title: offerCount > 0 ? "Choose a Contract" : "Contracts Restocking",
      progress: offerCount > 0 ? `${offerCount} offer${offerCount === 1 ? "" : "s"} ready in Goals` : "Check Goals soon",
      active: false,
    };
  }

  const complete = active.requirements.filter((requirement) => isRequirementComplete(requirement)).length;
  const currentRequirement = active.requirements.find((requirement) => !isRequirementComplete(requirement));
  const currentProgress = currentRequirement
    ? ` - ${currentRequirement.label}: ${formatRequirementProgress(currentRequirement)}`
    : "";
  return {
    title: active.title,
    progress: `${complete}/${active.requirements.length} done${currentProgress} - ${Math.ceil(active.timer)}s`,
    active: true,
  };
}

export function selectContract(state: GameState, offerId: string): boolean {
  ensureContractOffers(state);
  if (state.contracts.active) return false;

  const offer = state.contracts.offers.find((candidate) => candidate.id === offerId);
  if (!offer) return false;

  state.contracts.active = {
    ...cloneOffer(offer),
    timer: offer.duration,
  };
  state.contracts.offers = [];
  state.contracts.lastResult = null;
  addLog(state, `Contract accepted: ${offer.title}.`);
  return true;
}

export function updateContracts(state: GameState, deltaSeconds: number): void {
  ensureContractOffers(state);
  const active = state.contracts.active;
  if (!active) return;

  active.timer = Math.max(0, active.timer - deltaSeconds);
  updatePassiveRequirement(state, active, "cleanlinessHold", state.cage.cleanliness >= 75, deltaSeconds);
  updatePassiveRequirement(state, active, "stressHold", state.ecology.averageStress < 35, deltaSeconds);
  updatePassiveRequirement(state, active, "largeHerdHold", state.pigs.length >= CAVY_COUNCIL_HERD_SIZE, deltaSeconds);
  updatePassiveRequirement(state, active, "happinessHold", state.cage.happiness >= 70, deltaSeconds);
  updatePassiveRequirement(state, active, "rareResourceHold", state.goldenBeans >= 1 || state.squeaks >= 8, 1);
  updatePassiveRequirement(
    state,
    active,
    "recipeUnlockOrCompostHold",
    state.compost >= 40 || state.stats.recipesUnlocked > 0,
    1,
  );

  if (completeContractIfReady(state)) return;

  if (active.timer <= 0) {
    state.contracts.expired += 1;
    state.contracts.lastResult = {
      title: active.title,
      rewardText: "Expired",
      completed: false,
      token: nextResultToken++,
    };
    state.contracts.active = null;
    state.contracts.offers = createContractOffers(state);
    addLog(state, `Contract expired: ${active.title}. No penalty, just a missed delivery.`);
  }
}

export function advanceContractProgress(
  state: GameState,
  kind: ContractProgressKind,
  amount = 1,
  source?: string,
): void {
  const active = state.contracts?.active;
  if (!active) return;

  let changed = false;
  for (const requirement of active.requirements) {
    if (requirement.kind !== kind || isRequirementComplete(requirement)) continue;

    if (requirement.id === "zoneTend") {
      if (!source) continue;
      requirement.sources = requirement.sources ?? [];
      if (requirement.sources.includes(source)) continue;
      requirement.sources.push(source);
      requirement.progress = Math.min(requirement.target, requirement.sources.length);
    } else if (requirement.id === "litterAction") {
      if (source !== "litterCorner") continue;
      requirement.progress = requirement.target;
    } else if (requirement.kind === "combo") {
      requirement.progress = Math.min(requirement.target, Math.max(requirement.progress, amount));
    } else {
      requirement.progress = Math.min(requirement.target, requirement.progress + amount);
    }
    changed = true;
  }

  if (changed) completeContractIfReady(state);
}

export function consumeContractRareBoost(state: GameState): void {
  if (state.contracts.rareEventBoost > 0) state.contracts.rareEventBoost = Math.max(0, state.contracts.rareEventBoost - 1);
}

function createContractOffers(state: GameState): ContractOfferState[] {
  const seed = state.contracts.nextOfferSeed;
  const introTemplate = getNextIntroContractTemplate(state);
  const ordinaryEligible = CONTRACT_TEMPLATES.filter(
    (template) =>
      template.id !== introTemplate?.id &&
      !ONE_TIME_INTRO_CONTRACT_IDS.has(template.id) &&
      template.eligible(state),
  );
  const start = ordinaryEligible.length > 0 ? seed % ordinaryEligible.length : 0;
  const rotated = [...ordinaryEligible.slice(start), ...ordinaryEligible.slice(0, start)];
  const selectedTemplates = introTemplate ? [introTemplate, ...rotated.slice(0, 2)] : rotated.slice(0, 3);
  const offers = selectedTemplates.map((template, index) => createOfferFromTemplate(state, template, seed + index));
  state.contracts.nextOfferSeed += Math.max(1, offers.length + 1);
  return offers;
}

function getNextIntroContractTemplate(state: GameState): ContractTemplate | null {
  for (const id of INTRO_CONTRACT_IDS) {
    const template = TEMPLATE_MAP[id];
    if (!template.eligible(state) || isIntroContractSatisfied(state, id)) continue;
    return template;
  }
  return null;
}

function promoteEligibleIntroOffer(state: GameState): void {
  const introTemplate = getNextIntroContractTemplate(state);
  if (!introTemplate || state.contracts.offers.some((offer) => offer.templateId === introTemplate.id)) return;

  const introOffer = createOfferFromTemplate(state, introTemplate, state.contracts.nextOfferSeed);
  state.contracts.nextOfferSeed += 1;
  state.contracts.offers = [
    introOffer,
    ...state.contracts.offers.filter((offer) => !ONE_TIME_INTRO_CONTRACT_IDS.has(offer.templateId)),
  ].slice(0, 3);
}

function createOfferFromTemplate(state: GameState, template: ContractTemplate, seed: number): ContractOfferState {
  const offer: ContractOfferState = {
    id: `${template.id}-${seed}`,
    templateId: template.id,
    title: template.title,
    description: template.description,
    rewardText: getContractRewardText(state, template),
    duration: template.duration,
    requirements: template.requirements(),
  };
  return offer;
}

function getContractRewardText(state: GameState, template: ContractTemplate): string {
  if (hasWisdomSpecialization(state, "gentleCare") && template.id === "caretakerPhilosophy") {
    return `${template.rewardText}, Gentle +20 Beans`;
  }
  if (hasWisdomSpecialization(state, "automationSteward") && template.id === "cleanupRoute") {
    return `${template.rewardText}, Steward +3 Compost`;
  }
  if (hasWisdomSpecialization(state, "rareBeanAlchemy") && template.id === "rareSampleOrder") {
    return `${template.rewardText}, Alchemy rare boost`;
  }
  if (hasWisdomSpecialization(state, "rareBeanAlchemy") && template.id === "recipeCommission") {
    return `${template.rewardText}, Alchemy +1 Squeak`;
  }
  return template.rewardText;
}

function completeContractIfReady(state: GameState): boolean {
  const active = state.contracts.active;
  if (!active || !active.requirements.every(isRequirementComplete)) return false;

  const template = TEMPLATE_MAP[active.templateId];
  const beansReward = template.reward.beans + (hasWisdomSpecialization(state, "gentleCare") && active.templateId === "caretakerPhilosophy" ? 20 : 0);
  const squeakReward = (template.reward.squeaks ?? 0) + (hasWisdomSpecialization(state, "rareBeanAlchemy") && active.templateId === "recipeCommission" ? 1 : 0);
  const compostReward = (template.reward.compost ?? 0) + (hasWisdomSpecialization(state, "automationSteward") && active.templateId === "cleanupRoute" ? 3 : 0);
  const rareBoostReward =
    (template.reward.rareEventBoost ?? 0) + (hasWisdomSpecialization(state, "rareBeanAlchemy") && active.templateId === "rareSampleOrder" ? 1 : 0);
  state.beans += beansReward;
  state.stats.lifetimeBeans += beansReward;
  state.squeaks += squeakReward;
  state.compost += compostReward;
  state.contracts.rareEventBoost = Math.max(state.contracts.rareEventBoost, rareBoostReward);
  state.contracts.completed += 1;
  state.contracts.completedTemplates[active.templateId] = getCompletedTemplateCount(state, active.templateId) + 1;
  state.stats.objectivesCompleted += 1;
  state.contracts.lastResult = {
    title: active.title,
    rewardText: active.rewardText,
    completed: true,
    token: nextResultToken++,
  };
  state.contracts.active = null;
  state.contracts.offers = createContractOffers(state);
  addLog(state, `Contract complete: ${active.title}. ${active.rewardText}.`);
  return true;
}

function updatePassiveRequirement(
  state: GameState,
  active: ActiveContractState,
  kind: ContractProgressKind,
  condition: boolean,
  amount: number,
): void {
  if (!condition) return;
  for (const requirement of active.requirements) {
    if (requirement.kind === kind && !isRequirementComplete(requirement)) {
      requirement.progress = Math.min(requirement.target, requirement.progress + amount);
    }
  }
}

function toContractCardView(contract: ContractOfferState | ActiveContractState): ContractCardView {
  return {
    id: contract.id,
    title: contract.title,
    description: contract.description,
    timer: `${Math.ceil("timer" in contract ? contract.timer : contract.duration)}s`,
    rewardText: contract.rewardText,
    requirements: contract.requirements.map(toRequirementView),
  };
}

function toRequirementView(requirement: ContractRequirementState): ContractRequirementView {
  const complete = isRequirementComplete(requirement);
  return {
    label: requirement.label,
    progressText: complete ? "Done" : formatRequirementProgress(requirement),
    complete,
  };
}

function formatRequirementProgress(requirement: ContractRequirementState): string {
  if (
    requirement.kind === "cleanlinessHold" ||
    requirement.kind === "stressHold" ||
    requirement.kind === "largeHerdHold" ||
    requirement.kind === "happinessHold"
  ) {
    return `${Math.floor(requirement.progress)}/${requirement.target}s`;
  }
  return `${Math.floor(requirement.progress)}/${requirement.target}`;
}

function createRequirement(
  id: string,
  kind: ContractProgressKind,
  label: string,
  target: number,
): ContractRequirementState {
  return {
    id,
    kind,
    label,
    progress: 0,
    target,
  };
}

function isRequirementComplete(requirement: ContractRequirementState): boolean {
  return requirement.progress >= requirement.target;
}

function normalizeActiveContract(value: unknown): ActiveContractState | null {
  const saved = isRecord(value) ? value : null;
  if (!saved || !isContractTemplateId(saved.templateId)) return null;
  const template = TEMPLATE_MAP[saved.templateId];
  return {
    ...createOfferSkeleton(saved, template),
    timer: normalizeNumber(saved.timer, template.duration),
  };
}

function normalizeContractOffers(value: unknown): ContractOfferState[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((offer) => {
      const saved = isRecord(offer) ? offer : null;
      if (!saved || !isContractTemplateId(saved.templateId)) return null;
      return createOfferSkeleton(saved, TEMPLATE_MAP[saved.templateId]);
    })
    .filter((offer): offer is ContractOfferState => Boolean(offer))
    .slice(0, 3);
}

function createOfferSkeleton(saved: Record<string, unknown>, template: ContractTemplate): ContractOfferState {
  const defaults = template.requirements();
  const savedRequirements = Array.isArray(saved.requirements) ? saved.requirements : [];
  return {
    id: typeof saved.id === "string" ? saved.id : `${template.id}-saved`,
    templateId: template.id,
    title: template.title,
    description: template.description,
    rewardText: template.rewardText,
    duration: template.duration,
    requirements: defaults.map((requirement) => {
      const savedRequirement = savedRequirements.find((candidate) => isRecord(candidate) && candidate.id === requirement.id);
      return isRecord(savedRequirement)
        ? {
            ...requirement,
            progress: normalizeNumber(savedRequirement.progress, 0),
            sources: Array.isArray(savedRequirement.sources)
              ? savedRequirement.sources.filter((source): source is string => typeof source === "string")
              : undefined,
          }
        : requirement;
    }),
  };
}

function cloneOffer(offer: ContractOfferState): ContractOfferState {
  return {
    ...offer,
    requirements: offer.requirements.map((requirement) => ({
      ...requirement,
      sources: requirement.sources ? [...requirement.sources] : undefined,
    })),
  };
}

function normalizeContractResult(value: unknown): ContractResult | null {
  const saved = isRecord(value) ? value : null;
  if (!saved) return null;
  return {
    title: typeof saved.title === "string" ? saved.title : "Contract",
    rewardText: typeof saved.rewardText === "string" ? saved.rewardText : "",
    completed: saved.completed === true,
    token: normalizeWholeNumber(saved.token),
  };
}

function normalizeCompletedTemplates(value: unknown): Partial<Record<ContractTemplateId, number>> {
  const saved = isRecord(value) ? value : {};
  const completed: Partial<Record<ContractTemplateId, number>> = {};
  for (const id of Object.keys(TEMPLATE_MAP) as ContractTemplateId[]) {
    const count = normalizeWholeNumber(saved[id]);
    if (count > 0) completed[id] = count;
  }
  return completed;
}

function getCompletedTemplateCount(state: GameState, id: ContractTemplateId): number {
  state.contracts.completedTemplates = state.contracts.completedTemplates ?? {};
  return state.contracts.completedTemplates[id] ?? 0;
}

function isIntroContractSatisfied(state: GameState, id: ContractTemplateId): boolean {
  if (getCompletedTemplateCount(state, id) > 0) return true;
  if (id === "roomToNest") return getUnlockedFurnitureCount(state) > 0 || state.stats.furnitureBought > 0;
  if (id === "firstWheek") return state.stats.abilitiesUsed > 0;
  if (id === "cleanupRoute") return false;
  if (id === "compostStarter") return state.stats.recipesUnlocked > 0 || Object.values(state.recipes).some(Boolean);
  if (id === "greatCompostingRumor") {
    return (
      state.cavyWisdom > 0 ||
      state.stats.wisdomPerks > 0 ||
      state.stats.prestiges > 0 ||
      state.prestige.ascensions > 0 ||
      Object.values(state.wisdom).some(Boolean) ||
      Boolean(state.wisdomSpecialization)
    );
  }
  return false;
}

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function normalizeWholeNumber(value: unknown, fallback = 0): number {
  return Math.floor(normalizeNumber(value, fallback));
}

function isContractTemplateId(value: unknown): value is ContractTemplateId {
  return typeof value === "string" && value in TEMPLATE_MAP;
}
