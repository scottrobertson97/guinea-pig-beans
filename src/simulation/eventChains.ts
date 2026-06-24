import { adjustPigStressInZone, getZoneMetrics } from "./ecology";
import { getHerdLifeSnapshot } from "./lifecycle";
import type {
  ActiveEvent,
  ActiveEventChain,
  EventChainId,
  EventChainsState,
  EventChainStep,
  EventChoiceId,
  EventId,
  GameState,
} from "./types";
import { clamp, isRecord } from "./utils";

interface EventChainDefinition {
  id: EventChainId;
  title: string;
  sourceEventId: EventId;
  followUpEventId: EventId;
  followUpName: string;
  followUpTimer: number;
}

const EVENT_CHAIN_DEFINITIONS: Record<EventChainId, EventChainDefinition> = {
  hideyRecovery: {
    id: "hideyRecovery",
    title: "Hidey Recovery",
    sourceEventId: "hideySquabble",
    followUpEventId: "hideySquabble",
    followUpName: "Quiet Recovery",
    followUpTimer: 16,
  },
  hayPantry: {
    id: "hayPantry",
    title: "Hay Pantry",
    sourceEventId: "hayFrenzy",
    followUpEventId: "hayFrenzy",
    followUpName: "Pantry Prep",
    followUpTimer: 16,
  },
};

export function createInitialEventChainsState(): EventChainsState {
  return {
    active: null,
    completed: {},
    lastResult: null,
  };
}

export function normalizeEventChainsState(value: unknown): EventChainsState {
  if (!isRecord(value)) return createInitialEventChainsState();
  return {
    active: normalizeActiveEventChain(value.active),
    completed: normalizeCompletedChains(value.completed),
    lastResult: normalizeEventChainResult(value.lastResult),
  };
}

export function maybeStartEventChainForEvent(state: GameState, event: ActiveEvent): void {
  if (state.eventChains.active || event.chainId) return;
  const chainId = getChainIdForSourceEvent(event.id);
  if (!chainId || !shouldStartChain(state, chainId)) return;

  const definition = EVENT_CHAIN_DEFINITIONS[chainId];
  state.eventChains.active = {
    id: definition.id,
    title: definition.title,
    step: "base",
    sourceEventId: definition.sourceEventId,
    followUpEventId: definition.followUpEventId,
    choices: [],
  };
  state.eventChains.lastResult = null;
  event.chainId = chainId;
  state.log.unshift(`${definition.title} began. The next care choice can shape a follow-up event.`);
}

export function getDueEventChainFollowUp(state: GameState): ActiveEvent | null {
  const chain = state.eventChains.active;
  if (!chain || chain.step !== "followUpPending") return null;
  const definition = EVENT_CHAIN_DEFINITIONS[chain.id];
  chain.step = "followUp";
  return {
    id: definition.followUpEventId,
    name: definition.followUpName,
    timer: definition.followUpTimer,
    chainId: chain.id,
  };
}

export function recordEventChainChoice(state: GameState, event: ActiveEvent, choiceId: EventChoiceId): void {
  const chain = state.eventChains.active;
  if (!chain || event.chainId !== chain.id) return;
  chain.choices.push(choiceId);

  if (chain.step === "base") {
    chain.step = "followUpPending";
    addChainProgressLog(state, chain);
    return;
  }

  if (chain.step === "followUp") {
    completeEventChain(state, chain);
  }
}

export function getActiveEventChainText(state: GameState): string | null {
  const chain = state.eventChains.active;
  if (!chain) return null;
  if (chain.step === "base") return `${chain.title}: first beat active.`;
  if (chain.step === "followUpPending") return `${chain.title}: follow-up waiting for the next event window.`;
  return `${chain.title}: resolving now.`;
}

export function getEventChainGoalView(state: GameState): { title: string; status: string; description: string } | null {
  const chain = state.eventChains.active;
  if (!chain) return null;
  const definition = EVENT_CHAIN_DEFINITIONS[chain.id];
  const status =
    chain.step === "base"
      ? "First beat"
      : chain.step === "followUpPending"
        ? "Follow-up queued"
        : "Resolving";
  const description =
    chain.step === "followUpPending"
      ? `${definition.followUpName} will get priority when the next event is ready.`
      : getChainDescription(chain.id);
  return {
    title: `Event Chain: ${chain.title}`,
    status,
    description,
  };
}

export function getEventChainContractBias(state: GameState, templateId: string): number {
  const chain = state.eventChains.active;
  if (!chain) return 0;
  if (chain.id === "hideyRecovery") {
    if (templateId === "habitatReset") return 0.9;
    if (templateId === "freshCageDelivery") return 0.25;
  }
  if (chain.id === "hayPantry") {
    if (templateId === "freshCageDelivery") return 0.9;
    if (templateId === "firstWheek") return 0.25;
  }
  return 0;
}

function shouldStartChain(state: GameState, chainId: EventChainId): boolean {
  const life = getHerdLifeSnapshot(state);
  if (chainId === "hideyRecovery") {
    const hidey = getZoneMetrics(state, "hideyZone");
    return life.stressPressure >= 30 || life.relationshipPressure >= 28 || hidey.traffic >= 55 || hidey.mess >= 45;
  }
  if (chainId === "hayPantry") {
    return life.foodPressure >= 24 || state.needs.hay <= 50;
  }
  return false;
}

function getChainIdForSourceEvent(eventId: EventId): EventChainId | null {
  if (eventId === "hideySquabble") return "hideyRecovery";
  if (eventId === "hayFrenzy") return "hayPantry";
  return null;
}

function completeEventChain(state: GameState, chain: ActiveEventChain): void {
  const completed = (state.eventChains.completed[chain.id] ?? 0) + 1;
  state.eventChains.completed[chain.id] = completed;
  const summary = applyChainCompletionEffects(state, chain);
  state.eventChains.lastResult = {
    id: chain.id,
    title: chain.title,
    summary,
    completed: true,
    token: Date.now(),
  };
  state.eventChains.active = null;
}

function applyChainCompletionEffects(state: GameState, chain: ActiveEventChain): string {
  if (chain.id === "hideyRecovery") {
    const rebonded = chain.choices.includes("hideyRebond");
    const treated = chain.choices.includes("hideyTreaty");
    const warmthDelta = rebonded ? 10 : treated ? 6 : 4;
    const tensionDelta = rebonded ? -18 : treated ? -12 : -8;
    for (const relationship of state.relationships ?? []) {
      relationship.warmth = clamp(relationship.warmth + warmthDelta, 0, 100);
      relationship.tension = clamp(relationship.tension + tensionDelta, 0, 100);
    }
    adjustPigStressInZone(state, "hideyZone", rebonded ? -16 : -10);
    const summary = rebonded ? "The herd remembered how to share the hidey space." : "The hidey zone settled into a calmer routine.";
    state.log.unshift(summary);
    return summary;
  }

  const bundled = chain.choices.includes("hayBundles");
  const emergency = chain.choices.includes("hayEmergency");
  const hayBoost = bundled ? 22 : emergency ? 16 : 10;
  state.needs.hay = clamp(state.needs.hay + hayBoost, 0, 100);
  for (const pig of state.pigs) {
    pig.hunger = clamp(pig.hunger + (bundled ? 10 : 6), 0, 100);
  }
  const summary = bundled ? "The hay pantry is packed and the herd snacks more steadily." : "The herd has a calmer hay routine for now.";
  state.log.unshift(summary);
  return summary;
}

function addChainProgressLog(state: GameState, chain: ActiveEventChain): void {
  const definition = EVENT_CHAIN_DEFINITIONS[chain.id];
  state.log.unshift(`${chain.title} started. ${definition.followUpName} will follow when the cage has a quiet event window.`);
}

function getChainDescription(id: EventChainId): string {
  if (id === "hideyRecovery") return "Relationship comfort and hidey-zone stress will shape the follow-up.";
  return "Hay pressure and pig hunger will shape the follow-up.";
}

function normalizeActiveEventChain(value: unknown): ActiveEventChain | null {
  if (!isRecord(value) || !isEventChainId(value.id)) return null;
  const definition = EVENT_CHAIN_DEFINITIONS[value.id];
  const step = isEventChainStep(value.step) ? value.step : "followUpPending";
  const choices = Array.isArray(value.choices) ? value.choices.filter(isEventChoiceId) : [];
  return {
    id: definition.id,
    title: definition.title,
    step,
    sourceEventId: definition.sourceEventId,
    followUpEventId: definition.followUpEventId,
    choices,
  };
}

function normalizeCompletedChains(value: unknown): Partial<Record<EventChainId, number>> {
  if (!isRecord(value)) return {};
  const completed: Partial<Record<EventChainId, number>> = {};
  for (const id of Object.keys(EVENT_CHAIN_DEFINITIONS) as EventChainId[]) {
    const count = value[id];
    if (typeof count === "number" && Number.isFinite(count) && count > 0) completed[id] = Math.floor(count);
  }
  return completed;
}

function normalizeEventChainResult(value: unknown): EventChainsState["lastResult"] {
  if (!isRecord(value) || !isEventChainId(value.id)) return null;
  const definition = EVENT_CHAIN_DEFINITIONS[value.id];
  return {
    id: definition.id,
    title: definition.title,
    summary: typeof value.summary === "string" ? value.summary : `${definition.title} resolved.`,
    completed: Boolean(value.completed),
    token: typeof value.token === "number" && Number.isFinite(value.token) ? value.token : 0,
  };
}

function isEventChainId(value: unknown): value is EventChainId {
  return value === "hideyRecovery" || value === "hayPantry";
}

function isEventChainStep(value: unknown): value is EventChainStep {
  return value === "base" || value === "followUpPending" || value === "followUp";
}

function isEventChoiceId(value: unknown): value is EventChoiceId {
  return (
    typeof value === "string" &&
    [
      "hayEmergency",
      "hayFeast",
      "hayBundles",
      "hideyQuiet",
      "hideyTreaty",
      "hideyRebond",
    ].includes(value)
  );
}
