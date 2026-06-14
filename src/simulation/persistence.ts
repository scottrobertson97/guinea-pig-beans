import { addLog, createInitialState, syncCageDimensionsToLevel, syncEntityIdCounters } from "./state";
import { HAY_DIMENSION_FEED_LEVEL } from "./balance";
import { ensureContractOffers, normalizeContractsState } from "./contracts";
import { chooseFavoriteZoneForPig, createInitialEcologyState, normalizeCageZoneId, normalizeStewardshipState, refreshEcology } from "./ecology";
import { normalizeFurnitureCareState } from "./furnitureCare";
import { normalizePigWelcomeState } from "./pigWelcome";
import { normalizeRelationshipWeb } from "./relationships";
import { normalizeTechState } from "./techTree";
import type { GameState, Pig, PigGoal, WisdomSpecializationId } from "./types";
import { isRecord, normalizePercent, normalizeTimer } from "./utils";

export const SAVE_KEY = "gpb-save-v1";
export const SAVE_STATUS_EVENT = "guinea-pig-save-status";

const SAVE_VERSION = 1;
const SAVE_THROTTLE_MS = 900;

type SaveStatus = "idle" | "saving" | "saved" | "unavailable";

interface SaveEnvelope {
  version: number;
  savedAt: string;
  state: GameState;
}

export interface SaveStatusDetail {
  status: SaveStatus;
  savedAt?: string;
}

export interface LoadGameStateResult {
  state: GameState;
  recovered: boolean;
}

let pendingState: GameState | null = null;
let saveTimer: number | null = null;
let lastSerializedState = "";

export function loadGameState(): LoadGameStateResult {
  const freshState = createInitialState();

  try {
    const rawSave = localStorage.getItem(SAVE_KEY);
    if (!rawSave) {
      freshState.contracts = normalizeContractsState(freshState.contracts);
      ensureContractOffers(freshState);
      syncEntityIdCounters(freshState);
      lastSerializedState = serializeState(freshState);
      return { state: freshState, recovered: false };
    }

    const parsed = JSON.parse(rawSave) as Partial<SaveEnvelope>;
    if (parsed.version !== SAVE_VERSION || !isRecord(parsed.state)) {
      removeUnreadableSave();
      addLog(freshState, "Saved run could not be read, so a fresh cage moved in.");
      freshState.contracts = normalizeContractsState(freshState.contracts);
      ensureContractOffers(freshState);
      syncEntityIdCounters(freshState);
      lastSerializedState = serializeState(freshState);
      return { state: freshState, recovered: true };
    }

    const hydratedState = hydrateState(freshState, parsed.state as Partial<GameState>);
    syncCageDimensionsToLevel(hydratedState);
    refreshEcology(hydratedState);
    syncEntityIdCounters(hydratedState);
    lastSerializedState = serializeState(hydratedState);
    return { state: hydratedState, recovered: false };
  } catch {
    removeUnreadableSave();
    addLog(freshState, "Saved run could not be read, so a fresh cage moved in.");
    freshState.contracts = normalizeContractsState(freshState.contracts);
    ensureContractOffers(freshState);
    syncEntityIdCounters(freshState);
    lastSerializedState = serializeState(freshState);
    return { state: freshState, recovered: true };
  }
}

export function requestSave(state: GameState): void {
  pendingState = state;
  if (saveTimer !== null) return;

  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    flushSave();
  }, SAVE_THROTTLE_MS);
}

export function resetSavedGame(): void {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
    saveTimer = null;
  }
  pendingState = null;
  lastSerializedState = "";
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    emitSaveStatus({ status: "unavailable" });
  }
}

function flushSave(): void {
  if (!pendingState) return;

  try {
    const serializedState = serializeState(pendingState);
    if (serializedState === lastSerializedState) {
      pendingState = null;
      return;
    }

    emitSaveStatus({ status: "saving" });
    const savedAt = new Date().toISOString();
    const envelope: SaveEnvelope = {
      version: SAVE_VERSION,
      savedAt,
      state: pendingState,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(envelope));
    lastSerializedState = serializedState;
    pendingState = null;
    emitSaveStatus({ status: "saved", savedAt });
  } catch {
    emitSaveStatus({ status: "unavailable" });
  }
}

function removeUnreadableSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // If storage cannot be written, the fresh recovered run still needs to load.
  }
}

function hydrateState(defaultState: GameState, savedState: Partial<GameState>): GameState {
  const hydrated = mergeDefaults(defaultState, savedState) as GameState;
  hydrated.ecology = hydrated.ecology ?? createInitialEcologyState(hydrated.cage.width, hydrated.cage.height);
  hydrated.ecology.stewardship = normalizeStewardshipState(hydrated.ecology.stewardship);
  hydrated.furnitureCare = normalizeFurnitureCareState(hydrated.furnitureCare);
  hydrated.tech = normalizeTechState(hydrated.tech);
  hydrated.contracts = normalizeContractsState(hydrated.contracts);
  hydrated.automation.directive = normalizeAutomationDirective(hydrated.automation.directive);
  hydrated.wisdomSpecialization = normalizeWisdomSpecialization(hydrated.wisdomSpecialization);
  if (hydrated.upgrades.feedLevel >= HAY_DIMENSION_FEED_LEVEL) hydrated.lateGame.hayDimension = true;
  if (hydrated.lateGame.beanSingularity) hydrated.recipes.singularityExperiment = true;
  hydrated.pigs = hydrated.pigs.map((pig, index) => hydratePigLifeState(pig, index));
  hydrated.relationships = normalizeRelationshipWeb(hydrated, hydrated.relationships);
  hydrated.pigWelcome = normalizePigWelcomeState(hydrated, hydrated.pigWelcome);
  refreshEcology(hydrated);
  ensureContractOffers(hydrated);
  return hydrated;
}

function normalizeWisdomSpecialization(value: unknown): WisdomSpecializationId | null {
  return value === "gentleCare" || value === "automationSteward" || value === "rareBeanAlchemy" ? value : null;
}

function hydratePigLifeState(pig: Pig, index: number): Pig {
  return {
    ...pig,
    hunger: normalizePercent(pig.hunger, 82),
    thirst: normalizePercent(pig.thirst, 84),
    energy: normalizePercent(pig.energy, 76),
    goal: normalizePigGoal(pig.goal),
    goalTimer: normalizeTimer(pig.goalTimer),
    favoriteZone: normalizeCageZoneId(pig.favoriteZone, chooseFavoriteZoneForPig(pig, index)),
    stress: normalizePercent(pig.stress, 0),
  };
}

function normalizePigGoal(value: unknown): PigGoal {
  return value === "seekFood" ||
    value === "eat" ||
    value === "seekWater" ||
    value === "drink" ||
    value === "seekSleep" ||
    value === "sleep" ||
    value === "seekPlay" ||
    value === "playWithPig" ||
    value === "playWithFurniture" ||
    value === "roam"
    ? value
    : "roam";
}

function normalizeAutomationDirective(value: unknown): GameState["automation"]["directive"] {
  return value === "balanced" || value === "cleanliness" || value === "litterFocus" || value === "rareGuard" ? value : "balanced";
}

function mergeDefaults(defaultValue: unknown, savedValue: unknown): unknown {
  if (Array.isArray(defaultValue)) return Array.isArray(savedValue) ? savedValue : defaultValue;
  if (!isRecord(defaultValue)) return savedValue ?? defaultValue;
  if (!isRecord(savedValue)) return defaultValue;

  const merged: Record<string, unknown> = { ...defaultValue };
  for (const [key, value] of Object.entries(savedValue)) {
    merged[key] = key in merged ? mergeDefaults(merged[key], value) : value;
  }
  return merged;
}

function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

function emitSaveStatus(detail: SaveStatusDetail): void {
  window.dispatchEvent(new CustomEvent<SaveStatusDetail>(SAVE_STATUS_EVENT, { detail }));
}
