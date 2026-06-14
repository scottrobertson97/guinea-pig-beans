import type { GameState, Pig, PigRelationship, PigRelationshipKind } from "./types";
import { clamp, isRecord, normalizePercent } from "./utils";

const MAX_RELATIONSHIPS_PER_PIG = 2;

const RELATIONSHIP_KIND_LABELS: Record<PigRelationshipKind, string> = {
  bonded: "Bonded",
  buddy: "Buddy",
  napPartner: "Nap partner",
  shyFollower: "Shy follower",
  rival: "Rival",
};

const DEFAULT_CONNECTION: Record<PigRelationshipKind, { warmth: number; tension: number }> = {
  bonded: { warmth: 72, tension: 0 },
  buddy: { warmth: 56, tension: 4 },
  napPartner: { warmth: 50, tension: 2 },
  shyFollower: { warmth: 45, tension: 8 },
  rival: { warmth: 24, tension: 38 },
};

export function syncRelationshipWeb(state: GameState): PigRelationship[] {
  const previousIds = new Set((state.relationships ?? []).map((relationship) => relationship.id));
  state.relationships = normalizeRelationshipWeb(state, state.relationships);
  return state.relationships.filter((relationship) => !previousIds.has(relationship.id));
}

export function normalizeRelationshipWeb(state: GameState, value: unknown): PigRelationship[] {
  const relationshipsByPair = new Map<string, PigRelationship>();
  const savedRelationships = Array.isArray(value) ? value : [];

  for (const entry of savedRelationships) {
    const relationship = normalizeSavedRelationship(state, entry);
    if (!relationship) continue;
    relationshipsByPair.set(getRelationshipPairKey(relationship.pigId, relationship.targetPigId), relationship);
  }

  syncBondedPairs(state, relationshipsByPair);

  let relationships = enforceRelationshipLimit(Array.from(relationshipsByPair.values()));
  relationships = backfillVisibleRelationships(state, relationships);
  return enforceRelationshipLimit(relationships);
}

export function setRelationshipForPair(
  state: GameState,
  pigId: number,
  targetPigId: number,
  kind: PigRelationshipKind,
  warmth = DEFAULT_CONNECTION[kind].warmth,
  tension = DEFAULT_CONNECTION[kind].tension,
): void {
  state.relationships = (state.relationships ?? []).filter(
    (relationship) => getRelationshipPairKey(relationship.pigId, relationship.targetPigId) !== getRelationshipPairKey(pigId, targetPigId),
  );
  state.relationships.push(createRelationship(pigId, targetPigId, kind, warmth, tension));
  state.relationships = normalizeRelationshipWeb(state, state.relationships);
}

export function getPigRelationships(state: GameState, pigId: number): PigRelationship[] {
  return (state.relationships ?? []).filter((relationship) => relationship.pigId === pigId || relationship.targetPigId === pigId);
}

export function getRelationshipPartnerId(relationship: PigRelationship, pigId: number): number | null {
  if (relationship.pigId === pigId) return relationship.targetPigId;
  if (relationship.targetPigId === pigId) return relationship.pigId;
  return null;
}

export function getRelationshipBetween(state: GameState, pigId: number, targetPigId: number): PigRelationship | null {
  const pairKey = getRelationshipPairKey(pigId, targetPigId);
  return (state.relationships ?? []).find((relationship) => getRelationshipPairKey(relationship.pigId, relationship.targetPigId) === pairKey) ?? null;
}

export function getPrimaryRelationshipForPig(state: GameState, pigId: number): PigRelationship | null {
  const relationships = getPigRelationships(state, pigId);
  relationships.sort((first, second) => getDisplayPriority(second) - getDisplayPriority(first));
  return relationships[0] ?? null;
}

export function getRequestRelationshipForPig(state: GameState, pigId: number): PigRelationship | null {
  const relationships = getPigRelationships(state, pigId);
  relationships.sort((first, second) => getRequestPriority(second) - getRequestPriority(first));
  return relationships[0] ?? null;
}

export function getPigRelationshipLine(state: GameState, pig: Pig): string {
  const relationship = getPrimaryRelationshipForPig(state, pig.id);
  if (!relationship) return "Relationship: settling in";

  const partnerId = getRelationshipPartnerId(relationship, pig.id);
  const partner = partnerId === null ? null : state.pigs.find((candidate) => candidate.id === partnerId);
  const partnerName = partner?.name ?? "a herdmate";
  return `${getRelationshipKindLabel(relationship.kind)} with ${partnerName} - ${getRelationshipMoodLabel(relationship)}`;
}

export function getRelationshipKindLabel(kind: PigRelationshipKind): string {
  return RELATIONSHIP_KIND_LABELS[kind];
}

export function getRelationshipRequestTitle(kind: PigRelationshipKind): string {
  if (kind === "buddy") return "Buddy Check-In";
  if (kind === "napPartner") return "Nap Pact";
  if (kind === "shyFollower") return "Follow-Along";
  if (kind === "rival") return "Rival Treaty";
  return "Bond Support";
}

export function getRelationshipThought(kind: PigRelationshipKind): string {
  if (kind === "rival") return "Treaty?";
  if (kind === "napPartner") return "Nap?";
  if (kind === "shyFollower") return "Follow?";
  return "Together?";
}

export function getRelationshipSocializationBonus(state: GameState): number {
  return (state.relationships ?? []).reduce((bonus, relationship) => {
    if (relationship.kind === "buddy") return bonus + 2;
    if (relationship.kind === "napPartner" || relationship.kind === "shyFollower" || relationship.kind === "rival") return bonus + 1;
    return bonus;
  }, 0);
}

export function getRelationshipPlayScore(state: GameState, pigId: number, targetPigId: number): number {
  const relationship = getRelationshipBetween(state, pigId, targetPigId);
  if (!relationship) return 0;
  if (relationship.kind === "bonded") return 6;
  if (relationship.kind === "buddy") return 7 + relationship.warmth * 0.03;
  if (relationship.kind === "shyFollower") return 4 + relationship.warmth * 0.02;
  if (relationship.kind === "napPartner") return 2 + relationship.warmth * 0.015;
  return relationship.tension >= 45 ? -6 : 1;
}

export function adjustRelationshipConnection(
  state: GameState,
  relationshipId: string,
  warmthDelta: number,
  tensionDelta: number,
): void {
  const relationship = (state.relationships ?? []).find((candidate) => candidate.id === relationshipId);
  if (!relationship) return;
  relationship.warmth = clamp(relationship.warmth + warmthDelta, 0, 100);
  relationship.tension = clamp(relationship.tension + tensionDelta, 0, 100);
}

export function adjustRelationshipBetween(
  state: GameState,
  pigId: number,
  targetPigId: number,
  warmthDelta: number,
  tensionDelta: number,
): void {
  const relationship = getRelationshipBetween(state, pigId, targetPigId);
  if (!relationship) return;
  adjustRelationshipConnection(state, relationship.id, warmthDelta, tensionDelta);
}

export function calmRelationshipTension(state: GameState, amount: number): void {
  for (const relationship of state.relationships ?? []) {
    relationship.tension = clamp(relationship.tension - amount, 0, 100);
    relationship.warmth = clamp(relationship.warmth + amount * 0.35, 0, 100);
  }
}

export function getRelationshipTensionPressure(state: GameState): number {
  return (state.relationships ?? []).reduce((pressure, relationship) => {
    if (relationship.kind === "rival") return pressure + relationship.tension;
    return pressure + Math.max(0, relationship.tension - 45) * 0.35;
  }, 0);
}

export function getRelationshipMoodLabel(relationship: PigRelationship): string {
  if (relationship.kind === "rival") {
    if (relationship.tension >= 62) return "friction";
    if (relationship.tension <= 24) return "truce";
    return "managed";
  }
  if (relationship.tension >= 55) return "needs space";
  if (relationship.warmth >= 70) return "cozy";
  if (relationship.warmth >= 46) return "steady";
  return "warming up";
}

function normalizeSavedRelationship(state: GameState, value: unknown): PigRelationship | null {
  if (!isRecord(value)) return null;
  const pigId = normalizePigId(state, value.pigId);
  const targetPigId = normalizePigId(state, value.targetPigId);
  if (pigId === null || targetPigId === null || pigId === targetPigId) return null;

  const kind = normalizeRelationshipKind(value.kind) ?? chooseRelationshipKind(getPigById(state, pigId), getPigById(state, targetPigId));
  const defaults = DEFAULT_CONNECTION[kind];
  return createRelationship(
    pigId,
    targetPigId,
    kind,
    normalizePercent(value.warmth, defaults.warmth),
    normalizePercent(value.tension, defaults.tension),
  );
}

function syncBondedPairs(state: GameState, relationshipsByPair: Map<string, PigRelationship>): void {
  const pigIds = new Set(state.pigs.map((pig) => pig.id));
  for (const pig of state.pigs) {
    if (pig.bondedPigId === null || !pigIds.has(pig.bondedPigId)) {
      pig.bondedPigId = null;
      continue;
    }

    const partner = getPigById(state, pig.bondedPigId);
    if (partner && partner.bondedPigId === null) partner.bondedPigId = pig.id;

    const pairKey = getRelationshipPairKey(pig.id, pig.bondedPigId);
    const existing = relationshipsByPair.get(pairKey);
    relationshipsByPair.set(
      pairKey,
      createRelationship(
        pig.id,
        pig.bondedPigId,
        "bonded",
        Math.max(existing?.warmth ?? 0, DEFAULT_CONNECTION.bonded.warmth),
        Math.min(existing?.tension ?? DEFAULT_CONNECTION.bonded.tension, DEFAULT_CONNECTION.bonded.tension),
      ),
    );
  }
}

function backfillVisibleRelationships(state: GameState, relationships: PigRelationship[]): PigRelationship[] {
  const byPair = new Map(relationships.map((relationship) => [getRelationshipPairKey(relationship.pigId, relationship.targetPigId), relationship]));
  const counts = countRelationships(relationships);

  for (const pig of state.pigs) {
    if ((counts.get(pig.id) ?? 0) >= 1) continue;

    const candidate = state.pigs
      .filter((target) => target.id !== pig.id)
      .filter((target) => !byPair.has(getRelationshipPairKey(pig.id, target.id)))
      .filter((target) => (counts.get(target.id) ?? 0) < MAX_RELATIONSHIPS_PER_PIG)
      .sort((first, second) => (counts.get(first.id) ?? 0) - (counts.get(second.id) ?? 0))[0];
    if (!candidate) continue;

    const relationship = createRelationship(pig.id, candidate.id, chooseRelationshipKind(pig, candidate));
    byPair.set(getRelationshipPairKey(relationship.pigId, relationship.targetPigId), relationship);
    counts.set(relationship.pigId, (counts.get(relationship.pigId) ?? 0) + 1);
    counts.set(relationship.targetPigId, (counts.get(relationship.targetPigId) ?? 0) + 1);
  }

  return Array.from(byPair.values());
}

function enforceRelationshipLimit(relationships: PigRelationship[]): PigRelationship[] {
  const counts = new Map<number, number>();
  const result: PigRelationship[] = [];
  for (const relationship of relationships.sort((first, second) => getRelationshipPriority(second) - getRelationshipPriority(first))) {
    if ((counts.get(relationship.pigId) ?? 0) >= MAX_RELATIONSHIPS_PER_PIG) continue;
    if ((counts.get(relationship.targetPigId) ?? 0) >= MAX_RELATIONSHIPS_PER_PIG) continue;
    result.push(relationship);
    counts.set(relationship.pigId, (counts.get(relationship.pigId) ?? 0) + 1);
    counts.set(relationship.targetPigId, (counts.get(relationship.targetPigId) ?? 0) + 1);
  }
  return result.sort((first, second) => first.id.localeCompare(second.id));
}

function createRelationship(
  pigId: number,
  targetPigId: number,
  kind: PigRelationshipKind,
  warmth = DEFAULT_CONNECTION[kind].warmth,
  tension = DEFAULT_CONNECTION[kind].tension,
): PigRelationship {
  return {
    id: getRelationshipId(pigId, targetPigId),
    pigId,
    targetPigId,
    kind,
    warmth: clamp(warmth, 0, 100),
    tension: clamp(tension, 0, 100),
  };
}

function chooseRelationshipKind(pig: Pig | null, target: Pig | null): PigRelationshipKind {
  if (!pig || !target) return "buddy";
  if (pig.trait === "Shy Beaner" || target.trait === "Shy Beaner") return "shyFollower";
  if (isRivalPair(pig, target)) return "rival";
  if (pig.trait === "Chonker" || target.trait === "Chonker" || pig.breed === "Silkie" || target.breed === "Silkie") return "napPartner";
  return "buddy";
}

function isRivalPair(pig: Pig, target: Pig): boolean {
  const traits = new Set([pig.trait, target.trait]);
  return (
    (traits.has("Gremlin") && (traits.has("Neat Freak") || traits.has("Royal Pig"))) ||
    (traits.has("Drama Pig") && traits.has("Hay Goblin"))
  );
}

function normalizePigId(state: GameState, value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return state.pigs.some((pig) => pig.id === value) ? value : null;
}

function normalizeRelationshipKind(value: unknown): PigRelationshipKind | null {
  return value === "bonded" || value === "buddy" || value === "napPartner" || value === "shyFollower" || value === "rival" ? value : null;
}

function getPigById(state: GameState, pigId: number): Pig | null {
  return state.pigs.find((pig) => pig.id === pigId) ?? null;
}

function countRelationships(relationships: PigRelationship[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const relationship of relationships) {
    counts.set(relationship.pigId, (counts.get(relationship.pigId) ?? 0) + 1);
    counts.set(relationship.targetPigId, (counts.get(relationship.targetPigId) ?? 0) + 1);
  }
  return counts;
}

function getRelationshipId(pigId: number, targetPigId: number): string {
  const [first, second] = getSortedPair(pigId, targetPigId);
  return `relationship-${first}-${second}`;
}

function getRelationshipPairKey(pigId: number, targetPigId: number): string {
  return getSortedPair(pigId, targetPigId).join(":");
}

function getSortedPair(pigId: number, targetPigId: number): [number, number] {
  return pigId < targetPigId ? [pigId, targetPigId] : [targetPigId, pigId];
}

function getRelationshipPriority(relationship: PigRelationship): number {
  return getKindPriority(relationship.kind) + relationship.warmth * 0.1 + relationship.tension * 0.04;
}

function getDisplayPriority(relationship: PigRelationship): number {
  return (relationship.kind === "rival" && relationship.tension >= 55 ? 90 : getKindPriority(relationship.kind)) + relationship.warmth * 0.05;
}

function getRequestPriority(relationship: PigRelationship): number {
  return (relationship.kind === "rival" ? 70 + relationship.tension : getKindPriority(relationship.kind) + relationship.warmth) - relationship.tension * 0.25;
}

function getKindPriority(kind: PigRelationshipKind): number {
  if (kind === "bonded") return 80;
  if (kind === "buddy") return 58;
  if (kind === "napPartner") return 50;
  if (kind === "shyFollower") return 48;
  return 44;
}
