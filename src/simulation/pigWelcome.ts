import { getCageZoneName, getPigZoneId, getZoneMetrics } from "./ecology";
import type { GameState, Pig, PigTrait, PigWelcomeState } from "./types";
import { clamp, isRecord } from "./utils";

export const PIG_WELCOME_READY_SECONDS = 6;
const MIN_HAY = 45;
const MIN_WATER = 45;
const MIN_CLEANLINESS = 65;
const MAX_FAVORITE_ZONE_MESS = 45;

const TRAIT_TIPS: Record<PigTrait, string> = {
  Chonker: "Chonkers move at their own pace, but their beans start with extra value.",
  Zoomer: "Zoomers love active play and move fast, so enrichment keeps their energy useful.",
  "Neat Freak": "Neat Freaks prefer tidy corners and make stinky beans less often.",
  Gremlin: "Gremlins like messy corners and work faster when the cage gets dirty.",
  "Royal Pig": "Royal Pigs enjoy courtly spaces and can help royal beans matter later.",
  "Shy Beaner": "Shy Beaners settle best near restful hidey spaces.",
  "Hay Goblin": "Hay Goblins love the hay corner and turn stocked hay into momentum.",
  "Drama Pig": "Drama Pigs notice low water first, so the bottle matters more around them.",
  "Compost Mystic": "Compost Mystics make compost and blessed-bean paths more interesting.",
};

export interface PigWelcomeView {
  pigId: number;
  name: string;
  trait: PigTrait;
  favoriteZone: string;
  progress: number;
  target: number;
  ready: boolean;
  completed: boolean;
  status: string;
  requirement: string;
  rewardText: string;
}

export function createInitialPigWelcomeState(): PigWelcomeState {
  return {
    progressByPigId: {},
    completedPigIds: [],
  };
}

export function normalizePigWelcomeState(state: GameState, value: unknown): PigWelcomeState {
  const saved = isRecord(value) ? value : {};
  const progressSource = isRecord(saved.progressByPigId) ? saved.progressByPigId : {};
  const pigIds = new Set(state.pigs.map((pig) => pig.id));
  const progressByPigId: Record<string, number> = {};

  for (const [key, rawProgress] of Object.entries(progressSource)) {
    const pigId = Number(key);
    if (!Number.isInteger(pigId) || !pigIds.has(pigId)) continue;
    progressByPigId[key] = clampNumber(rawProgress, 0, PIG_WELCOME_READY_SECONDS);
  }

  const completedPigIds = Array.isArray(saved.completedPigIds)
    ? Array.from(
        new Set(
          saved.completedPigIds.filter(
            (pigId): pigId is number => typeof pigId === "number" && Number.isInteger(pigId) && pigIds.has(pigId),
          ),
        ),
      )
    : [];

  return { progressByPigId, completedPigIds };
}

export function ensurePigWelcomeState(state: GameState): PigWelcomeState {
  state.pigWelcome = normalizePigWelcomeState(state, state.pigWelcome);
  return state.pigWelcome;
}

export function updatePigWelcome(state: GameState, deltaSeconds: number): void {
  const welcome = ensurePigWelcomeState(state);
  for (const pig of state.pigs) {
    const key = String(pig.id);
    if (isPigWelcomeComplete(state, pig.id)) {
      delete welcome.progressByPigId[key];
      continue;
    }

    const current = welcome.progressByPigId[key] ?? 0;
    const next = getPigWelcomeReadiness(state, pig).qualifies
      ? current + deltaSeconds
      : current - deltaSeconds * 0.5;
    welcome.progressByPigId[key] = clamp(next, 0, PIG_WELCOME_READY_SECONDS);
  }
}

export function getPigWelcomeViews(state: GameState): PigWelcomeView[] {
  const welcome = ensurePigWelcomeState(state);
  return state.pigs.map((pig) => {
    const completed = welcome.completedPigIds.includes(pig.id);
    const progress = completed ? PIG_WELCOME_READY_SECONDS : welcome.progressByPigId[String(pig.id)] ?? 0;
    const readiness = getPigWelcomeReadiness(state, pig);
    const ready = !completed && progress >= PIG_WELCOME_READY_SECONDS;
    return {
      pigId: pig.id,
      name: pig.name,
      trait: pig.trait,
      favoriteZone: getCageZoneName(pig.favoriteZone),
      progress,
      target: PIG_WELCOME_READY_SECONDS,
      ready,
      completed,
      status: completed ? "Trait discovered" : ready ? "Ready to welcome" : `${Math.ceil(PIG_WELCOME_READY_SECONDS - progress)}s to settle`,
      requirement: completed ? getPigWelcomeTraitTip(pig) : readiness.requirement,
      rewardText: "+12 Beans, +1 Squeak, +3 Happiness",
    };
  });
}

export function getIncompletePigWelcomeViews(state: GameState): PigWelcomeView[] {
  return getPigWelcomeViews(state).filter((view) => !view.completed);
}

export function getReadyPigWelcomeCount(state: GameState): number {
  return getPigWelcomeViews(state).filter((view) => view.ready).length;
}

export function canCompletePigWelcome(state: GameState, pigId: number): boolean {
  return getPigWelcomeViews(state).some((view) => view.pigId === pigId && view.ready);
}

export function markPigWelcomeComplete(state: GameState, pigId: number): boolean {
  if (!canCompletePigWelcome(state, pigId)) return false;
  const welcome = ensurePigWelcomeState(state);
  if (!welcome.completedPigIds.includes(pigId)) welcome.completedPigIds.push(pigId);
  delete welcome.progressByPigId[String(pigId)];
  return true;
}

export function isPigWelcomeComplete(state: GameState, pigId: number): boolean {
  return ensurePigWelcomeState(state).completedPigIds.includes(pigId);
}

export function getPigWelcomeTraitTip(pig: Pick<Pig, "trait">): string {
  return TRAIT_TIPS[pig.trait];
}

function getPigWelcomeReadiness(state: GameState, pig: Pig): { qualifies: boolean; requirement: string } {
  if (state.needs.hay < MIN_HAY) return { qualifies: false, requirement: "Refill hay to 45%+" };
  if (state.needs.water < MIN_WATER) return { qualifies: false, requirement: "Refill water to 45%+" };
  if (state.cage.cleanliness < MIN_CLEANLINESS) return { qualifies: false, requirement: "Keep cleanliness at 65%+" };

  const zone = getZoneMetrics(state, pig.favoriteZone);
  if (zone.mess >= MAX_FAVORITE_ZONE_MESS) {
    return { qualifies: false, requirement: `Clean ${zone.label}` };
  }
  if (getPigZoneId(state, pig) !== pig.favoriteZone) {
    return { qualifies: false, requirement: `Let ${pig.name} settle in ${zone.label}` };
  }

  return { qualifies: true, requirement: `Settling in ${zone.label}` };
}

function clampNumber(value: unknown, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, min, max) : min;
}
