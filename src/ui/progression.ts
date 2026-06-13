import {
  getCosts,
  getPrestigeCost,
  getPrestigeProgress,
  getPrestigeWisdomGain,
  getUnlockedFurnitureCount,
  getWisdomPerks,
  hasSingularityExperimentEffect,
} from "../simulation/balance";
import { getEcologyConcernCount } from "../simulation/ecology";
import type { ContractTemplateId, GameState } from "../simulation/types";

export type DockSectionId =
  | "care"
  | "shop"
  | "furniture"
  | "abilities"
  | "recipes"
  | "wisdom"
  | "herd"
  | "goals"
  | "log";

export type SectionRevealId = "furniture" | "abilities" | "recipes" | "wisdom";
export type SectionRevealState = Record<SectionRevealId, boolean>;

const CORE_SECTIONS = new Set<DockSectionId>(["care", "shop", "wisdom", "herd", "goals", "log"]);

const SECTION_REVEAL_IDS: Record<SectionRevealId, DockSectionId> = {
  furniture: "furniture",
  abilities: "abilities",
  recipes: "recipes",
  wisdom: "wisdom",
};

const FURNITURE_REVEAL_CONTRACTS = new Set<ContractTemplateId>(["roomToNest", "habitatReset", "cleanupRoute", "caretakerPhilosophy"]);
const FURNITURE_CARE_CONTRACTS = new Set<ContractTemplateId>(["roomToNest", "habitatReset", "caretakerPhilosophy"]);
const HABITAT_CONTRACTS = new Set<ContractTemplateId>(["habitatReset", "cleanupRoute", "caretakerPhilosophy"]);
const ABILITY_CONTRACTS = new Set<ContractTemplateId>(["firstWheek", "compostStarter", "caretakerPhilosophy"]);
const RECIPE_CONTRACTS = new Set<ContractTemplateId>(["compostStarter", "rareSampleOrder", "recipeCommission"]);
const WISDOM_CONTRACTS = new Set<ContractTemplateId>(["greatCompostingRumor", "caretakerPhilosophy"]);
const WISDOM_REVEAL_PROGRESS_RATIO = 0.4;

export function getRevealedSections(state: GameState): SectionRevealState {
  return {
    furniture: isFurnitureRevealed(state),
    abilities: isAbilitiesRevealed(state),
    recipes: isRecipesRevealed(state),
    wisdom: isWisdomRevealed(state),
  };
}

export function isDockSectionRevealed(state: GameState, section: DockSectionId): boolean {
  if (CORE_SECTIONS.has(section)) return true;
  const reveals = getRevealedSections(state);
  return (Object.entries(SECTION_REVEAL_IDS) as [SectionRevealId, DockSectionId][]).some(
    ([revealId, dockSection]) => dockSection === section && reveals[revealId],
  );
}

export function getDockSectionForReveal(id: SectionRevealId): DockSectionId {
  return SECTION_REVEAL_IDS[id];
}

export function getRevealHint(id: SectionRevealId): string {
  if (id === "furniture") return "New: Furniture is available. The cage is ready for habitat decisions.";
  if (id === "abilities") return "New: Abilities are available. Squeaks can become active care.";
  if (id === "recipes") return "New: Bean Recipes are available. Rare resources can shape the run.";
  return "New: Wisdom is available. Great Composting is coming into view.";
}

export function isFurnitureCareRevealed(state: GameState): boolean {
  return isFurnitureRevealed(state) && (hasOwnedFurniture(state) || hasActiveContractTemplate(state, FURNITURE_CARE_CONTRACTS));
}

export function isHabitatCareRevealed(state: GameState): boolean {
  return (
    isFurnitureRevealed(state) &&
    (hasOwnedFurniture(state) ||
      hasActiveContractTemplate(state, HABITAT_CONTRACTS) ||
      hasMeaningfulHabitatPressure(state))
  );
}

export function isAutomationOperationsRevealed(state: GameState): boolean {
  return isFurnitureRevealed(state) && (Boolean(state.robot) || state.furniture.litterTray || state.automation.overdrive > 0);
}

export function isWisdomSpecializationRevealed(state: GameState): boolean {
  return Boolean(state.wisdomSpecialization) || hasTierThreeWisdom(state);
}

function isFurnitureRevealed(state: GameState): boolean {
  const furnitureCosts = Object.values(getCosts(state).furniture);
  const firstFurnitureCost = Math.min(...furnitureCosts);
  return (
    hasOwnedFurniture(state) ||
    state.beans >= firstFurnitureCost ||
    state.stats.lifetimeBeans >= firstFurnitureCost ||
    state.stats.furnitureBought > 0 ||
    Boolean(state.robot) ||
    state.furniture.litterTray ||
    hasMeaningfulHabitatPressure(state) ||
    hasActiveContractTemplate(state, FURNITURE_REVEAL_CONTRACTS)
  );
}

function isAbilitiesRevealed(state: GameState): boolean {
  return (
    state.squeaks > 0 ||
    state.stats.abilitiesUsed > 0 ||
    state.stats.cleanedPoops >= 8 ||
    hasActiveContractTemplate(state, ABILITY_CONTRACTS)
  );
}

function isRecipesRevealed(state: GameState): boolean {
  return (
    state.goldenBeans > 0 ||
    state.compost >= 10 ||
    state.stats.rarePoopsCleaned > 0 ||
    state.stats.goldenCleaned > 0 ||
    state.stats.blessedCleaned > 0 ||
    state.stats.compostCleaned > 0 ||
    state.stats.royalCleaned > 0 ||
    state.stats.cursedCleaned > 0 ||
    state.stats.recipesUnlocked > 0 ||
    Object.values(state.recipes).some(Boolean) ||
    state.lateGame.beanExchange ||
    hasSingularityExperimentEffect(state) ||
    hasActiveContractTemplate(state, RECIPE_CONTRACTS)
  );
}

function isWisdomRevealed(state: GameState): boolean {
  const prestigeProgress = getPrestigeProgress(state);
  return (
    state.cavyWisdom > 0 ||
    state.stats.wisdomPerks > 0 ||
    state.stats.prestiges > 0 ||
    state.prestige.ascensions > 0 ||
    Object.values(state.wisdom).some(Boolean) ||
    Boolean(state.wisdomSpecialization) ||
    getPrestigeWisdomGain(state) > 0 ||
    prestigeProgress >= getPrestigeCost() * WISDOM_REVEAL_PROGRESS_RATIO ||
    hasActiveContractTemplate(state, WISDOM_CONTRACTS)
  );
}

function hasOwnedFurniture(state: GameState): boolean {
  return getUnlockedFurnitureCount(state) > 0;
}

function hasMeaningfulHabitatPressure(state: GameState): boolean {
  if (getEcologyConcernCount(state) <= 0 && state.ecology.averageStress < 42) return false;
  return (
    state.poops.length >= 6 ||
    state.cage.cleanliness < 70 ||
    state.ecology.averageStress >= 42
  );
}

function hasTierThreeWisdom(state: GameState): boolean {
  return getWisdomPerks().some((perk) => perk.tier >= 3 && state.wisdom[perk.id]);
}

function hasActiveContractTemplate(state: GameState, templateIds: Set<ContractTemplateId>): boolean {
  return Boolean(state.contracts.active && templateIds.has(state.contracts.active.templateId));
}
