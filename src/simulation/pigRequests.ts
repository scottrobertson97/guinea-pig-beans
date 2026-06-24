import { addLog } from "./state";
import { advanceContractProgress } from "./contracts";
import { getCageZoneName, getPigZoneId, getZoneMetrics } from "./ecology";
import { getPigLifeSnapshot, getPigLifeSummaryText } from "./lifecycle";
import {
  adjustRelationshipConnection,
  getPigRelationships,
  getRelationshipKindLabel,
  getRelationshipPartnerId,
  getRelationshipRequestTitle,
  getRelationshipThought,
  getRequestRelationshipForPig,
} from "./relationships";
import type { GameState, Pig, PigRequestId, PigRequestProgressKind } from "./types";
import { awardBeans, pickWeighted, randomBetween } from "./utils";

export interface PigRequestView {
  pigName: string;
  title: string;
  description: string;
  progress: string;
  timer: string;
  rewardText: string;
}

let nextRequestToken = 1;

export function updatePigRequests(state: GameState, deltaSeconds: number, options: { spawnDue?: boolean } = {}): void {
  const requestState = ensurePigRequestState(state);
  const active = requestState.active;

  if (active) {
    active.timer = Math.max(0, active.timer - deltaSeconds);
    updatePassiveRequestProgress(state, active, deltaSeconds);
    if (requestState.active !== active) return;
    if (active.timer <= 0) {
      const pig = state.pigs.find((candidate) => candidate.id === active.pigId);
      requestState.expired += 1;
      requestState.lastResult = {
        pigId: active.pigId,
        title: active.title,
        rewardText: "Maybe next time",
        completed: false,
        token: nextRequestToken++,
      };
      requestState.active = null;
      requestState.nextTimer = randomBetween(55, 85);
      addLog(state, `${pig?.name ?? "A pig"} let ${active.title} go. No harm done.`);
    }
    return;
  }

  requestState.nextTimer = Math.max(0, requestState.nextTimer - deltaSeconds);
  if ((options.spawnDue ?? true) && requestState.nextTimer <= 0) spawnPigRequest(state);
}

export function spawnDuePigRequest(state: GameState): void {
  const requestState = ensurePigRequestState(state);
  if (requestState.active || requestState.nextTimer > 0) return;
  spawnPigRequest(state);
}

export function advancePigRequest(
  state: GameState,
  kind: PigRequestProgressKind,
  amount = 1,
): void {
  const requestState = ensurePigRequestState(state);
  const active = requestState.active;
  if (!active || getRequestProgressKind(active.id) !== kind) return;

  active.progress =
    active.id === "zoomieFavor"
      ? Math.min(active.target, Math.max(active.progress, amount))
      : Math.min(active.target, active.progress + amount);
  if (active.progress >= active.target) completePigRequest(state);
}

export function updateHeldPigRequestProgress(state: GameState): void {
  const requestState = ensurePigRequestState(state);
  const active = requestState.active;
  if (!active || active.id !== "compostFavor") return;
  active.progress = Math.min(active.target, Math.max(active.progress, Math.floor(state.compost)));
  if (active.progress >= active.target) completePigRequest(state);
}

export function getActivePigRequestView(state: GameState): PigRequestView | null {
  const active = ensurePigRequestState(state).active;
  if (!active) return null;
  const pig = state.pigs.find((candidate) => candidate.id === active.pigId);
  const lifeCue = pig ? getPigLifeSummaryText(state, pig).replace("Life: ", "") : null;
  return {
    pigName: pig?.name ?? "A pig",
    title: active.title,
    description: lifeCue ? `${active.description} Current cue: ${lifeCue}.` : active.description,
    progress: `${Math.floor(active.progress)}/${active.target}`,
    timer: `${Math.ceil(active.timer)}s`,
    rewardText: active.rewardText,
  };
}

function spawnPigRequest(state: GameState): void {
  const requestState = ensurePigRequestState(state);
  const pig = chooseRequestPig(state);
  if (!pig) {
    requestState.nextTimer = randomBetween(55, 85);
    return;
  }

  const id = chooseRequestId(state, pig);
  const request = createRequest(state, pig, id);
  requestState.active = request;
  requestState.lastResult = null;
  addLog(state, `${pig.name} has a request: ${request.title}.`);
}

function completePigRequest(state: GameState): void {
  const requestState = ensurePigRequestState(state);
  const active = requestState.active;
  if (!active) return;

  const pig = state.pigs.find((candidate) => candidate.id === active.pigId);
  applyReward(state, active);
  advanceContractProgress(state, "pigRequest", 1);
  requestState.completed += 1;
  requestState.lastResult = {
    pigId: active.pigId,
    title: active.title,
    rewardText: active.rewardText,
    completed: true,
    token: nextRequestToken++,
  };
  requestState.active = null;
  requestState.nextTimer = randomBetween(55, 85);
  addLog(state, `${pig?.name ?? "A pig"} request complete: ${active.title}. ${active.rewardText}.`);
}

function createRequest(state: GameState, pig: Pig, id: PigRequestId): NonNullable<GameState["pigRequest"]["active"]> {
  const token = nextRequestToken++;
  if (id === "tidyFavor") {
    return {
      id,
      pigId: pig.id,
      title: "Tidy Favor",
      description: `${pig.name} wants three beans cleaned before the bedding gets ideas.`,
      progress: 0,
      target: 3,
      timer: 75,
      rewardText: "+18 Beans, +1 Squeak",
      thought: "Tidy?",
      token,
    };
  }
  if (id === "hayFavor") {
    return {
      id,
      pigId: pig.id,
      title: "Hay Favor",
      description: `${pig.name} wants the hay rack topped up.`,
      progress: state.needs.hay >= 90 ? 1 : 0,
      target: 1,
      timer: 65,
      rewardText: "+14 Beans, +5 Happiness",
      thought: "Hay?",
      token,
    };
  }
  if (id === "waterFavor") {
    return {
      id,
      pigId: pig.id,
      title: "Water Favor",
      description: `${pig.name} wants the bottle back near full.`,
      progress: state.needs.water >= 90 ? 1 : 0,
      target: 1,
      timer: 65,
      rewardText: "+14 Beans, +5 Happiness",
      thought: "Water?",
      token,
    };
  }
  if (id === "zoomieFavor") {
    return {
      id,
      pigId: pig.id,
      title: "Zoomie Favor",
      description: `${pig.name} wants to see a clean streak reach x3.`,
      progress: Math.min(3, state.combo.timer > 0 ? state.combo.count : 0),
      target: 3,
      timer: 70,
      rewardText: "+22 Beans, longer streak timer",
      thought: "x3?",
      token,
    };
  }
  if (id === "snackFavor") {
    return {
      id,
      pigId: pig.id,
      title: "Snack Favor",
      description: `${pig.name} wants any active ability used.`,
      progress: 0,
      target: 1,
      timer: 90,
      rewardText: "+1 Squeak, +6 Happiness",
      thought: "Trick?",
      token,
    };
  }
  if (id === "furnitureFavor") {
    return {
      id,
      pigId: pig.id,
      title: "Furniture Favor",
      description: `${pig.name} wants one new static furniture unlock.`,
      progress: 0,
      target: 1,
      timer: 110,
      rewardText: "+26 Beans",
      thought: "Decor?",
      token,
    };
  }
  if (id === "favoriteCornerFavor") {
    return {
      id,
      pigId: pig.id,
      title: "Favorite Corner",
      description: `${pig.name} wants two beans cleaned from ${getCageZoneName(pig.favoriteZone)}.`,
      progress: 0,
      target: 2,
      timer: 90,
      rewardText: "+22 Beans, calmer favorite zone",
      thought: "Corner?",
      token,
    };
  }
  if (id === "quietZoneFavor") {
    return {
      id,
      pigId: pig.id,
      title: "Quiet Zone",
      description: `${pig.name} wants an ability used to calm the habitat pressure.`,
      progress: 0,
      target: 1,
      timer: 90,
      rewardText: "+18 Beans, -stress",
      thought: "Cozy?",
      token,
    };
  }
  if (id === "bondSupportFavor") {
    const relationship = getRequestRelationshipForPig(state, pig.id);
    const partnerId = relationship ? getRelationshipPartnerId(relationship, pig.id) : pig.bondedPigId;
    const partner = partnerId === null ? null : state.pigs.find((candidate) => candidate.id === partnerId);
    const relationshipKind = relationship?.kind ?? "bonded";
    const title = getRelationshipRequestTitle(relationshipKind);
    const relationshipLabel = getRelationshipKindLabel(relationshipKind).toLowerCase();
    return {
      id,
      pigId: pig.id,
      relationshipId: relationship?.id,
      relationshipTargetPigId: partner?.id,
      relationshipKind,
      title,
      description: `${pig.name}${partner ? ` and ${partner.name}` : ""} want 10s together in a comfortable zone to steady their ${relationshipLabel} rhythm.`,
      progress: 0,
      target: 10,
      timer: 105,
      rewardText: "+24 Beans, +1 Squeak",
      thought: getRelationshipThought(relationshipKind),
      token,
    };
  }
  return {
    id,
    pigId: pig.id,
    title: "Compost Favor",
    description: `${pig.name} wants the compost stash to reach 8.`,
    progress: Math.min(8, Math.floor(state.compost)),
    target: 8,
    timer: 95,
    rewardText: "+18 Beans, +4 Compost",
    thought: "Compost?",
    token,
  };
}

function applyReward(state: GameState, active: NonNullable<GameState["pigRequest"]["active"]>): void {
  const id = active.id;
  if (id === "tidyFavor") {
    awardBeans(state, 18);
    state.squeaks += 1;
  } else if (id === "hayFavor" || id === "waterFavor") {
    awardBeans(state, 14);
    state.cage.happiness = Math.min(100, state.cage.happiness + 5);
  } else if (id === "zoomieFavor") {
    awardBeans(state, 22);
    state.combo.timer = Math.max(state.combo.timer, 4);
  } else if (id === "snackFavor") {
    state.squeaks += 1;
    state.cage.happiness = Math.min(100, state.cage.happiness + 6);
  } else if (id === "furnitureFavor") {
    awardBeans(state, 26);
  } else if (id === "favoriteCornerFavor") {
    awardBeans(state, 22);
    const pig = state.pigs.find((candidate) => candidate.id === active.pigId);
    if (pig) pig.stress = Math.max(0, pig.stress - 16);
  } else if (id === "quietZoneFavor") {
    awardBeans(state, 18);
    for (const pig of state.pigs) pig.stress = Math.max(0, pig.stress - 6);
  } else if (id === "bondSupportFavor") {
    awardBeans(state, 24);
    state.squeaks += 1;
    const pig = state.pigs.find((candidate) => candidate.id === active.pigId);
    const partnerId = active.relationshipTargetPigId ?? pig?.bondedPigId ?? null;
    const partner = partnerId === null ? null : state.pigs.find((candidate) => candidate.id === partnerId);
    if (pig) pig.stress = Math.max(0, pig.stress - 12);
    if (partner) partner.stress = Math.max(0, partner.stress - 12);
    if (active.relationshipId) {
      adjustRelationshipConnection(state, active.relationshipId, active.relationshipKind === "rival" ? 8 : 10, active.relationshipKind === "rival" ? -18 : -7);
    }
  } else {
    awardBeans(state, 18);
    state.compost += 4;
  }
}

function chooseRequestId(state: GameState, pig: Pig): PigRequestId {
  const life = getPigLifeSnapshot(state, pig);
  const relationshipCount = getPigRelationships(state, pig.id).length;
  const urgencyBonus = life.urgency === "urgent" || life.urgency === "blocked" ? 1.25 : life.urgency === "desire" ? 0.45 : 0;
  const options: Array<{ id: PigRequestId; weight: number }> = [
    { id: "tidyFavor", weight: 0.75 + life.pressures.cleanup / 36 + (pig.trait === "Neat Freak" ? 0.85 : 0) },
    { id: "hayFavor", weight: 0.45 + life.pressures.food / 30 + (pig.trait === "Hay Goblin" ? 0.85 : 0) + (life.motive === "food" ? urgencyBonus : 0) },
    { id: "waterFavor", weight: 0.45 + life.pressures.water / 30 + (pig.trait === "Drama Pig" ? 0.8 : 0) + (life.motive === "water" ? urgencyBonus : 0) },
    { id: "zoomieFavor", weight: 0.55 + life.pressures.play / 42 + (pig.trait === "Zoomer" || state.furniture.tunnel ? 0.75 : 0) },
    { id: "snackFavor", weight: (state.squeaks >= 1 ? 0.85 : 0.25) + life.pressures.comfort / 55 + life.pressures.rest / 90 },
    { id: "furnitureFavor", weight: hasLockedFurniture(state) ? 0.35 + Math.max(life.pressures.comfort, life.pressures.play) / 58 : 0 },
    { id: "compostFavor", weight: 0.35 + (pig.trait === "Compost Mystic" ? 0.85 : 0) + (state.compost >= 3 ? 0.55 : 0) },
    { id: "favoriteCornerFavor", weight: 0.5 + life.favoriteZoneMess / 28 + (life.motive === "cleanup" ? urgencyBonus : 0) },
    { id: "quietZoneFavor", weight: 0.25 + life.pressures.comfort / 34 + life.pressures.recovery / 80 },
    { id: "bondSupportFavor", weight: relationshipCount > 0 ? 0.4 + life.pressures.social / 36 + life.relationshipPressure / 42 : 0 },
  ];
  return pickWeighted(options);
}

function chooseRequestPig(state: GameState): Pig | null {
  if (state.pigs.length === 0) return null;
  const weightedPigs = state.pigs.map((pig) => {
    const life = getPigLifeSnapshot(state, pig);
    const strongestPressure = Math.max(
      life.pressures.food,
      life.pressures.water,
      life.pressures.rest,
      life.pressures.social,
      life.pressures.comfort,
      life.pressures.cleanup,
    );
    return {
      id: pig,
      weight:
        1 +
        strongestPressure / 38 +
        life.relationshipPressure / 55 +
        (life.urgency === "urgent" || life.urgency === "blocked" ? 1.4 : life.urgency === "desire" ? 0.6 : 0),
    };
  });
  return pickWeighted(weightedPigs);
}

function getRequestProgressKind(id: PigRequestId): PigRequestProgressKind {
  if (id === "tidyFavor") return "clean";
  if (id === "hayFavor") return "hayRefill";
  if (id === "waterFavor") return "waterRefill";
  if (id === "zoomieFavor") return "combo";
  if (id === "snackFavor") return "ability";
  if (id === "furnitureFavor") return "furniture";
  if (id === "favoriteCornerFavor") return "ecologyClean";
  if (id === "quietZoneFavor") return "ability";
  if (id === "bondSupportFavor") return "bondedZone";
  return "compost";
}

function updatePassiveRequestProgress(
  state: GameState,
  active: NonNullable<GameState["pigRequest"]["active"]>,
  deltaSeconds: number,
): void {
  if (active.id !== "bondSupportFavor") return;
  const pig = state.pigs.find((candidate) => candidate.id === active.pigId);
  const partnerId = active.relationshipTargetPigId ?? pig?.bondedPigId ?? null;
  const partner = partnerId === null ? null : state.pigs.find((candidate) => candidate.id === partnerId);
  if (!pig || !partner) return;

  const zoneId = getPigZoneId(state, pig);
  const zone = getZoneMetrics(state, zoneId);
  const partnerTogether = getPigZoneId(state, partner) === zoneId;
  if (!partnerTogether || zone.comfort < 45 || zone.mess > 55) return;

  active.progress = Math.min(active.target, active.progress + deltaSeconds);
  if (active.progress >= active.target) completePigRequest(state);
}

function ensurePigRequestState(state: GameState): GameState["pigRequest"] {
  if (!state.pigRequest) {
    state.pigRequest = {
      active: null,
      nextTimer: randomBetween(35, 45),
      completed: 0,
      expired: 0,
      lastResult: null,
    };
  }
  return state.pigRequest;
}

function hasLockedFurniture(state: GameState): boolean {
  return Object.values(state.furniture).some((unlocked) => !unlocked);
}
