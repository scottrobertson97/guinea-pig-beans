import type { CageZoneId, FurnitureCareState, FurnitureId, GameState } from "./types";

export const FURNITURE_IDS: FurnitureId[] = [
  "hideyHouse",
  "tunnel",
  "litterTray",
  "chewToy",
  "snuggleSack",
  "cardboardCastle",
  "royalThrone",
];

const FURNITURE_NAMES: Record<FurnitureId, string> = {
  hideyHouse: "Hidey House",
  tunnel: "Tunnel",
  litterTray: "Litter Tray",
  chewToy: "Chew Toy",
  snuggleSack: "Snuggle Sack",
  cardboardCastle: "Cardboard Castle",
  royalThrone: "Royal Throne",
};

const FURNITURE_CARE_ZONES: Record<FurnitureId, CageZoneId> = {
  hideyHouse: "hideyZone",
  tunnel: "playRun",
  litterTray: "litterCorner",
  chewToy: "playRun",
  snuggleSack: "hideyZone",
  cardboardCastle: "royalCourt",
  royalThrone: "royalCourt",
};

export function createInitialFurnitureCareState(): Record<FurnitureId, FurnitureCareState> {
  return Object.fromEntries(FURNITURE_IDS.map((id) => [id, createFurnitureCareEntry()])) as Record<FurnitureId, FurnitureCareState>;
}

export function normalizeFurnitureCareState(value: unknown): Record<FurnitureId, FurnitureCareState> {
  const saved = isRecord(value) ? value : {};
  return Object.fromEntries(
    FURNITURE_IDS.map((id) => {
      const entry = isRecord(saved[id]) ? saved[id] : {};
      return [
        id,
        {
          condition: normalizePercent(entry.condition, 72),
          cooldown: normalizeTimer(entry.cooldown),
          lastCare: typeof entry.lastCare === "string" ? entry.lastCare : null,
        },
      ];
    }),
  ) as Record<FurnitureId, FurnitureCareState>;
}

export function getFurnitureCareEntry(state: GameState, id: FurnitureId): FurnitureCareState {
  state.furnitureCare = normalizeFurnitureCareState(state.furnitureCare);
  return state.furnitureCare[id] ?? createFurnitureCareEntry();
}

export function updateFurnitureCare(state: GameState, deltaSeconds: number): void {
  const care = normalizeFurnitureCareState(state.furnitureCare);
  for (const id of FURNITURE_IDS) {
    const entry = care[id];
    entry.cooldown = Math.max(0, entry.cooldown - deltaSeconds);
    if (!state.furniture[id]) {
      entry.condition = 72;
      entry.lastCare = null;
      continue;
    }
    entry.condition = Math.max(0, entry.condition - getFurnitureWearRate(state, id) * deltaSeconds);
  }
  state.furnitureCare = care;
}

export function getFurnitureName(id: FurnitureId): string {
  return FURNITURE_NAMES[id];
}

export function getFurnitureCareZoneId(id: FurnitureId): CageZoneId {
  return FURNITURE_CARE_ZONES[id];
}

export function getFurnitureConditionLabel(condition: number): string {
  if (condition >= 88) return "Well-loved";
  if (condition >= 58) return "Ready";
  if (condition >= 32) return "Overworked";
  return "Needs care";
}

export function getFurnitureConditionEffectText(state: GameState, id: FurnitureId): string {
  if (!state.furniture[id]) return "Unlock this furniture to care for it.";
  const condition = getFurnitureCareEntry(state, id).condition;
  if (condition >= 88) return getWellLovedEffectText(id);
  if (condition < 32) return getNeedsCareEffectText(id);
  if (condition < 58) return getOverworkedEffectText(id);
  return "Steady condition keeps its normal habitat bonus.";
}

export function getFurnitureEcologyBonus(state: GameState, id: FurnitureId): number {
  if (!state.furniture[id]) return 0;
  const condition = getFurnitureCareEntry(state, id).condition;
  if (condition >= 88) return 6;
  if (condition < 32) return -9;
  if (condition < 58) return -5;
  return 0;
}

export function getFurnitureAutomationMultiplier(state: GameState, id: FurnitureId): number {
  if (!state.furniture[id]) return 1;
  const condition = getFurnitureCareEntry(state, id).condition;
  if (condition >= 88) return 1.12;
  if (condition < 32) return 0.78;
  if (condition < 58) return 0.9;
  return 1;
}

export function getFurnitureStatBonus(state: GameState, id: FurnitureId): number {
  if (!state.furniture[id]) return 0;
  const condition = getFurnitureCareEntry(state, id).condition;
  if (condition >= 88) return 3;
  if (condition < 32) return -5;
  if (condition < 58) return -3;
  return 0;
}

function createFurnitureCareEntry(): FurnitureCareState {
  return {
    condition: 72,
    cooldown: 0,
    lastCare: null,
  };
}

function getFurnitureWearRate(state: GameState, id: FurnitureId): number {
  const zoneId = getFurnitureCareZoneId(id);
  const zone = state.ecology.zones.find((candidate) => candidate.id === zoneId);
  const trafficPressure = (zone?.traffic ?? 0) * 0.00045;
  const pigPressure = (zone?.pigIds.length ?? 0) * 0.004;
  const messPressure = (zone?.mess ?? 0) * 0.00025;
  const automationPressure =
    id === "litterTray" ? 0.006 + state.poops.length * 0.0012 + (state.automation.overdrive > 0 ? 0.012 : 0) : 0;
  return 0.004 + trafficPressure + pigPressure + messPressure + automationPressure;
}

function getWellLovedEffectText(id: FurnitureId): string {
  if (id === "litterTray") return "Well-loved care gives the tray better cleaning timing.";
  if (id === "chewToy" || id === "tunnel") return "Well-loved care makes the play zone more appealing.";
  if (id === "hideyHouse" || id === "snuggleSack") return "Well-loved care makes the hidey zone calmer.";
  if (id === "cardboardCastle" || id === "royalThrone") return "Well-loved care makes the royal court more inviting.";
  return "Well-loved care adds a small habitat bonus.";
}

function getOverworkedEffectText(id: FurnitureId): string {
  if (id === "litterTray") return "Overworked care slightly weakens tray automation.";
  return `Overworked care slightly lowers ${getFurnitureCareZoneName(id)} comfort.`;
}

function getNeedsCareEffectText(id: FurnitureId): string {
  if (id === "litterTray") return "Needs care: tray automation is noticeably weaker.";
  return `Needs care: ${getFurnitureCareZoneName(id)} loses some comfort.`;
}

function getFurnitureCareZoneName(id: FurnitureId): string {
  const names: Record<CageZoneId, string> = {
    hayCorner: "Hay Corner",
    waterBottle: "Water Bottle",
    hideyZone: "Hidey Zone",
    playRun: "Play Run",
    litterCorner: "Litter Corner",
    openFleece: "Open Fleece",
    royalCourt: "Royal Court",
  };
  return names[getFurnitureCareZoneId(id)];
}

function normalizePercent(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback;
}

function normalizeTimer(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
