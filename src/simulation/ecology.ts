import { hasFurnitureSynergy } from "./balance";
import type { CageEcologyState, CageZoneId, CageZoneMetrics, CageZoneRole, CageZoneStewardship, GameState, Pig, Poop } from "./types";

interface CageZoneDefinition {
  id: CageZoneId;
  label: string;
  role: CageZoneRole;
  x: number;
  y: number;
  radius: number;
}

interface WeightedZone {
  id: CageZoneId;
  weight: number;
}

const CAGE_ZONE_IDS: CageZoneId[] = [
  "hayCorner",
  "waterBottle",
  "hideyZone",
  "playRun",
  "litterCorner",
  "openFleece",
  "royalCourt",
];

const CAGE_ZONE_LABELS: Record<CageZoneId, string> = {
  hayCorner: "Hay Corner",
  waterBottle: "Water Bottle",
  hideyZone: "Hidey Zone",
  playRun: "Play Run",
  litterCorner: "Litter Corner",
  openFleece: "Open Fleece",
  royalCourt: "Royal Court",
};

const CAGE_ZONE_ROLES: Record<CageZoneId, CageZoneRole> = {
  hayCorner: "care",
  waterBottle: "care",
  hideyZone: "rest",
  playRun: "play",
  litterCorner: "cleanup",
  openFleece: "open",
  royalCourt: "prestige",
};

export function createInitialEcologyState(width: number, height: number): CageEcologyState {
  return {
    zones: getZoneDefinitions(width, height).map((zone) => ({
      ...zone,
      mess: 0,
      comfort: 50,
      traffic: 0,
      appeal: 50,
      pigIds: [],
      status: "Settled",
      action: "Keep the cage steady",
    })),
    averageStress: 0,
    dominantStressZone: null,
    stewardship: createInitialStewardshipState(),
  };
}

export function refreshEcology(state: GameState): CageEcologyState {
  const stewardship = normalizeStewardshipState(state.ecology?.stewardship);
  const definitions = getZoneDefinitions(state.cage.width, state.cage.height);
  const zones = definitions.map((definition) => buildZoneMetrics(state, definition));
  const averageStress =
    state.pigs.length === 0 ? 0 : state.pigs.reduce((total, pig) => total + normalizeStress(pig.stress), 0) / state.pigs.length;
  const dominantStressZone = getDominantStressZone(state);

  state.ecology = {
    zones,
    averageStress: Math.round(averageStress),
    dominantStressZone,
    stewardship,
  };
  return state.ecology;
}

export function createInitialStewardshipState(): Record<CageZoneId, CageZoneStewardship> {
  return Object.fromEntries(CAGE_ZONE_IDS.map((id) => [id, createStewardshipEntry()])) as Record<CageZoneId, CageZoneStewardship>;
}

export function normalizeStewardshipState(value: unknown): Record<CageZoneId, CageZoneStewardship> {
  const saved = isRecord(value) ? value : {};
  return Object.fromEntries(
    CAGE_ZONE_IDS.map((id) => {
      const entry = isRecord(saved[id]) ? saved[id] : {};
      return [
        id,
        {
          care: normalizePercent(entry.care, 0),
          cooldown: normalizeTimer(entry.cooldown),
          lastAction: typeof entry.lastAction === "string" ? entry.lastAction : null,
        },
      ];
    }),
  ) as Record<CageZoneId, CageZoneStewardship>;
}

export function getZoneStewardship(state: GameState, id: CageZoneId): CageZoneStewardship {
  state.ecology.stewardship = normalizeStewardshipState(state.ecology.stewardship);
  return state.ecology.stewardship[id] ?? createStewardshipEntry();
}

export function updateHabitatStewardship(state: GameState, deltaSeconds: number): void {
  const stewardship = normalizeStewardshipState(state.ecology.stewardship);
  for (const id of CAGE_ZONE_IDS) {
    const entry = stewardship[id];
    entry.cooldown = Math.max(0, entry.cooldown - deltaSeconds);
    entry.care = Math.max(0, entry.care - 0.12 * deltaSeconds);
  }
  state.ecology.stewardship = stewardship;
}

export function getCageZoneName(id: CageZoneId): string {
  return CAGE_ZONE_LABELS[id];
}

export function normalizeCageZoneId(value: unknown, fallback: CageZoneId): CageZoneId {
  return typeof value === "string" && CAGE_ZONE_IDS.includes(value as CageZoneId) ? (value as CageZoneId) : fallback;
}

export function chooseFavoriteZoneForPig(pig: Pick<Pig, "id" | "trait">, index = pig.id - 1): CageZoneId {
  if (pig.trait === "Hay Goblin") return "hayCorner";
  if (pig.trait === "Drama Pig") return "waterBottle";
  if (pig.trait === "Shy Beaner") return "hideyZone";
  if (pig.trait === "Zoomer") return "playRun";
  if (pig.trait === "Neat Freak") return "litterCorner";
  if (pig.trait === "Royal Pig") return "royalCourt";
  if (pig.trait === "Compost Mystic") return index % 2 === 0 ? "litterCorner" : "royalCourt";
  if (pig.trait === "Gremlin") return index % 2 === 0 ? "openFleece" : "litterCorner";
  return CAGE_ZONE_IDS[index % CAGE_ZONE_IDS.length];
}

export function getPigZoneId(state: GameState, pig: Pig): CageZoneId {
  return getCageZoneIdAt(state, pig.x, pig.y);
}

export function getPoopZoneId(state: GameState, poop: Pick<Poop, "x" | "y">): CageZoneId {
  return getCageZoneIdAt(state, poop.x, poop.y);
}

export function getZoneMetrics(state: GameState, id: CageZoneId): CageZoneMetrics {
  return getEcologyZones(state).find((zone) => zone.id === id) ?? buildZoneMetrics(state, getZoneDefinition(state, id));
}

export function getPreferredRoamTarget(state: GameState, pig: Pig): { x: number; y: number } {
  const preferredZone = choosePreferredRoamZone(state, pig);
  return getZoneTarget(state, preferredZone.id, Math.max(18, preferredZone.radius * 0.42));
}

export function getZoneTarget(state: GameState, id: CageZoneId, radius?: number): { x: number; y: number } {
  const zone = getZoneDefinition(state, id);
  const spread = radius ?? Math.max(16, zone.radius * 0.34);
  return {
    x: clamp(zone.x + randomBetween(-spread, spread), 34, state.cage.width - 34),
    y: clamp(zone.y + randomBetween(-spread, spread), 34, state.cage.height - 34),
  };
}

export function updatePigEcology(state: GameState, pig: Pig, deltaSeconds: number): void {
  const zone = getZoneMetrics(state, getPigZoneId(state, pig));
  const zoneStewardship = getZoneStewardship(state, zone.id);
  const favoriteStewardship = getZoneStewardship(state, pig.favoriteZone);
  const partner = state.pigs.find((candidate) => candidate.id === pig.bondedPigId);
  const partnerSameZone = partner ? getPigZoneId(state, partner) === zone.id : false;
  const favoriteComfort = zone.id === pig.favoriteZone && zone.comfort >= 55 ? 13 : 0;
  const partnerComfort = partnerSameZone && zone.comfort >= 45 ? 9 : 0;
  const eventPressure =
    (state.event.active?.id === "litterRevolt" && zone.id === "litterCorner") ||
    (state.event.active?.id === "hideySquabble" && zone.id === "hideyZone") ||
    (state.event.active?.id === "zoomieTraffic" && zone.id === "playRun")
      ? 18
      : 0;
  const targetStress = clamp(
    zone.mess * 0.34 +
      Math.max(0, zone.traffic - 48) * 0.42 +
      Math.max(0, 62 - zone.comfort) * 0.36 +
      eventPressure -
      favoriteComfort -
      partnerComfort -
      Math.max(zoneStewardship.care, favoriteStewardship.care) * 0.1,
    0,
    100,
  );
  const drift = targetStress > pig.stress ? 7.5 : 10.5;
  pig.stress = clamp(pig.stress + (targetStress - pig.stress) * Math.min(1, (deltaSeconds * drift) / 100), 0, 100);
}

export function adjustPigStressInZone(state: GameState, zoneId: CageZoneId, amount: number): void {
  for (const pig of state.pigs) {
    if (getPigZoneId(state, pig) === zoneId || pig.favoriteZone === zoneId) {
      pig.stress = clamp(pig.stress + amount, 0, 100);
    }
  }
  refreshEcology(state);
}

export function adjustHerdStress(state: GameState, amount: number): void {
  for (const pig of state.pigs) {
    pig.stress = clamp(pig.stress + amount, 0, 100);
  }
  refreshEcology(state);
}

export function getEcologyStatusLine(state: GameState): string | null {
  const zones = getEcologyZones(state);
  const urgent = zones.find((zone) => zone.mess >= 65 || zone.traffic >= 78 || zone.comfort <= 28);
  if (urgent) return `${urgent.label} needs attention: ${urgent.action}.`;

  const stressedPig = state.pigs.find((pig) => pig.stress >= 70);
  if (stressedPig) return `${stressedPig.name} is stressed in the habitat. Check favorite zones and crowding.`;

  const favorite = zones.find((zone) => zone.appeal >= 82 && zone.pigIds.length > 0);
  if (favorite) return `${favorite.label} is thriving. Pigs there produce a little more confidently.`;

  return null;
}

export function getEcologyConcernCount(state: GameState): number {
  return getEcologyZones(state).filter((zone) => zone.mess >= 55 || zone.traffic >= 72 || zone.comfort <= 32).length;
}

export function isPigComfortableInFavoriteZone(state: GameState, pig: Pig): boolean {
  const zone = getZoneMetrics(state, pig.favoriteZone);
  return zone.pigIds.includes(pig.id) && zone.comfort >= 62 && zone.mess < 45;
}

export function getCageZoneIdAt(state: GameState, x: number, y: number): CageZoneId {
  const zones = getZoneDefinitions(state.cage.width, state.cage.height);
  let bestZone = zones[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const zone of zones) {
    const distance = Math.hypot(x - zone.x, y - zone.y);
    const score = 1 - distance / zone.radius;
    if (score > bestScore) {
      bestScore = score;
      bestZone = zone;
    }
  }

  return bestScore < -0.35 ? "openFleece" : bestZone.id;
}

function buildZoneMetrics(state: GameState, definition: CageZoneDefinition): CageZoneMetrics {
  const pigIds = state.pigs
    .filter((pig) => getCageZoneIdAt(state, pig.x, pig.y) === definition.id)
    .map((pig) => pig.id);
  const poops = state.poops.filter((poop) => getCageZoneIdAt(state, poop.x, poop.y) === definition.id);
  const mess = getZoneMess(state, definition, poops);
  const traffic = getZoneTraffic(state, definition, pigIds.length, poops.length);
  const baseComfort = getZoneComfort(state, definition, mess, traffic);
  const stewardship = getZoneStewardship(state, definition.id);
  const comfort = clamp(Math.round(baseComfort + stewardship.care * 0.18), 0, 100);
  const appeal = clamp(
    Math.round(comfort - mess * 0.48 - Math.max(0, traffic - 45) * 0.24 + getRoleAppealBonus(state, definition) + stewardship.care * 0.14),
    0,
    100,
  );

  return {
    ...definition,
    mess,
    comfort,
    traffic,
    appeal,
    pigIds,
    status: getZoneStatus(definition, mess, comfort, traffic),
    action: getZoneAction(state, definition, mess, comfort, traffic),
  };
}

function getZoneMess(state: GameState, definition: CageZoneDefinition, poops: Poop[]): number {
  const rawMess = poops.reduce((total, poop) => {
    if (poop.type === "messPile") return total + 22;
    if (poop.type === "stinky") return total + 15;
    if (poop.type === "cursed") return total + 18;
    if (poop.type === "compost") return total + 8;
    return total + 6;
  }, 0);
  const trayReduction = definition.id === "litterCorner" && state.furniture.litterTray ? 0.78 : 1;
  const circuitReduction = definition.id === "litterCorner" && hasFurnitureSynergy(state, "cleanupCircuit") ? 0.82 : 1;
  return clamp(Math.round(rawMess * trayReduction * circuitReduction), 0, 100);
}

function getZoneTraffic(state: GameState, definition: CageZoneDefinition, pigCount: number, poopCount: number): number {
  const eventBonus =
    (state.event.active?.id === "zoomies" || state.event.active?.id === "zoomieTraffic") && definition.id === "playRun"
      ? 18
      : 0;
  const rolePressure = definition.id === "hayCorner" && state.needs.hay < 35 ? 8 : definition.id === "waterBottle" && state.needs.water < 35 ? 8 : 0;
  return clamp(Math.round(pigCount * 28 + poopCount * 4 + eventBonus + rolePressure), 0, 100);
}

function getZoneComfort(state: GameState, definition: CageZoneDefinition, mess: number, traffic: number): number {
  const baseComfort: Record<CageZoneId, number> = {
    hayCorner: 44 + state.needs.hay * 0.28 + (state.furniture.chewToy ? 7 : 0) + (state.lateGame.hayDimension ? 7 : 0),
    waterBottle: 45 + state.needs.water * 0.3 - (state.event.bottleJammed ? 30 : 0),
    hideyZone:
      40 +
      (state.furniture.hideyHouse ? 24 : 0) +
      (state.furniture.snuggleSack ? 10 : 0) +
      (hasFurnitureSynergy(state, "cozyCorner") ? 18 : 0),
    playRun:
      38 +
      (state.furniture.tunnel ? 18 : 0) +
      (state.furniture.chewToy ? 18 : 0) +
      (hasFurnitureSynergy(state, "zoomiePlayground") ? 16 : 0),
    litterCorner:
      35 +
      (state.furniture.litterTray ? 26 : 0) +
      (state.wisdom.trayAffinity ? 8 : 0) +
      (hasFurnitureSynergy(state, "cleanupCircuit") ? 17 : 0),
    openFleece: 50 + state.cage.space * 0.22 + state.upgrades.cageLevel * 2,
    royalCourt:
      32 +
      (state.furniture.royalThrone ? 27 : 0) +
      (state.furniture.cardboardCastle ? 14 : 0) +
      (hasFurnitureSynergy(state, "royalCompostCourt") ? 18 : 0),
  };
  const crowdPenalty = Math.max(0, traffic - 58) * (definition.id === "playRun" && hasFurnitureSynergy(state, "zoomiePlayground") ? 0.14 : 0.24);
  return clamp(Math.round(baseComfort[definition.id] - mess * 0.32 - crowdPenalty), 0, 100);
}

function getRoleAppealBonus(state: GameState, definition: CageZoneDefinition): number {
  if (definition.id === "litterCorner" && state.poops.length > 5) return 8;
  if (definition.id === "hayCorner" && state.needs.hay > 70) return 6;
  if (definition.id === "waterBottle" && state.needs.water > 70) return 6;
  if (definition.id === "royalCourt" && state.recipes.royalAccord) return 8;
  return 0;
}

function choosePreferredRoamZone(state: GameState, pig: Pig): CageZoneMetrics {
  const partner = state.pigs.find((candidate) => candidate.id === pig.bondedPigId);
  const partnerZoneId = partner ? getPigZoneId(state, partner) : null;
  const options = getEcologyZones(state).map((zone) => {
    let weight = Math.max(4, zone.appeal + zone.comfort * 0.2 - zone.mess * 0.28 - zone.traffic * 0.12);
    if (zone.id === pig.favoriteZone) weight += 26;
    if (zone.id === partnerZoneId) weight += 12;
    if (zone.id === getTraitZone(pig)) weight += 18;
    if (pig.stress >= 55 && (zone.role === "rest" || zone.id === pig.favoriteZone)) weight += 12;
    if (pig.trait === "Gremlin" && zone.mess > 25) weight += 10;
    return { id: zone, weight };
  });
  return pickWeighted(options);
}

function getTraitZone(pig: Pig): CageZoneId {
  if (pig.trait === "Hay Goblin") return "hayCorner";
  if (pig.trait === "Drama Pig") return "waterBottle";
  if (pig.trait === "Shy Beaner") return "hideyZone";
  if (pig.trait === "Zoomer") return "playRun";
  if (pig.trait === "Neat Freak") return "litterCorner";
  if (pig.trait === "Royal Pig") return "royalCourt";
  if (pig.trait === "Compost Mystic") return "litterCorner";
  return pig.favoriteZone;
}

function getDominantStressZone(state: GameState): CageZoneId | null {
  let dominant: { zoneId: CageZoneId; stress: number } | null = null;
  for (const pig of state.pigs) {
    if (pig.stress < 45) continue;
    const zoneId = getPigZoneId(state, pig);
    const stress = state.pigs
      .filter((candidate) => getPigZoneId(state, candidate) === zoneId)
      .reduce((total, candidate) => total + normalizeStress(candidate.stress), 0);
    if (!dominant || stress > dominant.stress) dominant = { zoneId, stress };
  }
  return dominant?.zoneId ?? null;
}

function getZoneStatus(definition: CageZoneDefinition, mess: number, comfort: number, traffic: number): string {
  if (mess >= 70) return "Mess crisis";
  if (traffic >= 78) return "Crowded";
  if (comfort <= 28) return "Uncomfortable";
  if (comfort >= 78 && mess < 25) return "Thriving";
  if (definition.role === "cleanup" && mess >= 38) return "Needs scoop";
  return "Steady";
}

function getZoneAction(state: GameState, definition: CageZoneDefinition, mess: number, comfort: number, traffic: number): string {
  if (definition.id === "hayCorner" && state.needs.hay < 35) return "Refill hay";
  if (definition.id === "waterBottle" && (state.needs.water < 35 || state.event.bottleJammed)) return "Fix water";
  if (mess >= 55) return "Clean nearby beans";
  if (traffic >= 75) return definition.id === "hideyZone" ? "Add comfort or split the herd" : "Give pigs another attraction";
  if (comfort <= 32) return getComfortAction(definition.id);
  if (definition.id === "litterCorner" && !state.furniture.litterTray) return "Unlock Litter Tray";
  if (definition.id === "hideyZone" && !state.furniture.hideyHouse) return "Unlock Hidey House";
  if (definition.id === "playRun" && !state.furniture.tunnel) return "Unlock Tunnel";
  return "Keep this rhythm";
}

function getComfortAction(id: CageZoneId): string {
  if (id === "hideyZone") return "Add Hidey House or Snuggle Sack";
  if (id === "playRun") return "Add Tunnel or Chew Toy";
  if (id === "royalCourt") return "Add throne/castle support";
  if (id === "openFleece") return "Expand the cage";
  return "Improve care supplies";
}

function getEcologyZones(state: GameState): CageZoneMetrics[] {
  if (!state.ecology?.zones?.length) return refreshEcology(state).zones;
  return state.ecology.zones;
}

function getZoneDefinition(state: GameState, id: CageZoneId): CageZoneDefinition {
  return getZoneDefinitions(state.cage.width, state.cage.height).find((zone) => zone.id === id) ?? getZoneDefinitions(state.cage.width, state.cage.height)[0];
}

function getZoneDefinitions(width: number, height: number): CageZoneDefinition[] {
  return [
    { id: "hayCorner", label: CAGE_ZONE_LABELS.hayCorner, role: CAGE_ZONE_ROLES.hayCorner, x: 88, y: 88, radius: 84 },
    { id: "waterBottle", label: CAGE_ZONE_LABELS.waterBottle, role: CAGE_ZONE_ROLES.waterBottle, x: width - 90, y: 82, radius: 78 },
    { id: "hideyZone", label: CAGE_ZONE_LABELS.hideyZone, role: CAGE_ZONE_ROLES.hideyZone, x: width * 0.18, y: height * 0.78, radius: 92 },
    { id: "playRun", label: CAGE_ZONE_LABELS.playRun, role: CAGE_ZONE_ROLES.playRun, x: width * 0.48, y: height * 0.52, radius: 108 },
    { id: "litterCorner", label: CAGE_ZONE_LABELS.litterCorner, role: CAGE_ZONE_ROLES.litterCorner, x: width * 0.83, y: height * 0.8, radius: 94 },
    { id: "openFleece", label: CAGE_ZONE_LABELS.openFleece, role: CAGE_ZONE_ROLES.openFleece, x: width * 0.52, y: height * 0.3, radius: 112 },
    { id: "royalCourt", label: CAGE_ZONE_LABELS.royalCourt, role: CAGE_ZONE_ROLES.royalCourt, x: width * 0.82, y: height * 0.31, radius: 94 },
  ];
}

function normalizeStress(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, 0, 100) : 0;
}

function createStewardshipEntry(): CageZoneStewardship {
  return {
    care: 0,
    cooldown: 0,
    lastAction: null,
  };
}

function normalizePercent(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, 0, 100) : fallback;
}

function normalizeTimer(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pickWeighted<T>(items: Array<{ id: T; weight: number }>): T {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= Math.max(0, item.weight);
    if (roll <= 0) return item.id;
  }
  return items[items.length - 1].id;
}
