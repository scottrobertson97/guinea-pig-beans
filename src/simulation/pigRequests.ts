import { addLog } from "./state";
import type { GameState, Pig, PigRequestId, PigRequestProgressKind } from "./types";

export interface PigRequestView {
  pigName: string;
  title: string;
  description: string;
  progress: string;
  timer: string;
  rewardText: string;
}

let nextRequestToken = 1;

export function updatePigRequests(state: GameState, deltaSeconds: number): void {
  const requestState = ensurePigRequestState(state);
  const active = requestState.active;

  if (active) {
    active.timer = Math.max(0, active.timer - deltaSeconds);
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
  if (requestState.nextTimer <= 0) spawnPigRequest(state);
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
  return {
    pigName: pig?.name ?? "A pig",
    title: active.title,
    description: active.description,
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
  applyReward(state, active.id);
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

function applyReward(state: GameState, id: PigRequestId): void {
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
  } else {
    awardBeans(state, 18);
    state.compost += 4;
  }
}

function chooseRequestId(state: GameState, pig: Pig): PigRequestId {
  const options: Array<{ id: PigRequestId; weight: number }> = [
    { id: "tidyFavor", weight: pig.trait === "Neat Freak" || state.poops.length >= 5 ? 2.4 : 1 },
    { id: "hayFavor", weight: pig.trait === "Hay Goblin" || state.needs.hay < 55 ? 2.4 : 0.9 },
    { id: "waterFavor", weight: pig.trait === "Drama Pig" || state.needs.water < 55 ? 2.1 : 0.85 },
    { id: "zoomieFavor", weight: pig.trait === "Zoomer" || state.furniture.tunnel ? 1.8 : 0.9 },
    { id: "snackFavor", weight: state.squeaks >= 1 ? 1.2 : 0.4 },
    { id: "furnitureFavor", weight: hasLockedFurniture(state) ? 1.1 : 0 },
    { id: "compostFavor", weight: pig.trait === "Compost Mystic" || state.compost >= 3 ? 1.6 : 0.5 },
  ];
  return pickWeighted(options);
}

function chooseRequestPig(state: GameState): Pig | null {
  if (state.pigs.length === 0) return null;
  const weightedPigs = state.pigs.map((pig) => ({
    id: pig,
    weight:
      1 +
      (pig.trait === "Neat Freak" && state.poops.length >= 3 ? 1 : 0) +
      (pig.trait === "Hay Goblin" && state.needs.hay < 65 ? 1 : 0) +
      (pig.trait === "Drama Pig" && state.needs.water < 65 ? 1 : 0) +
      (pig.trait === "Compost Mystic" && state.compost >= 2 ? 1 : 0),
  }));
  return pickWeighted(weightedPigs);
}

function getRequestProgressKind(id: PigRequestId): PigRequestProgressKind {
  if (id === "tidyFavor") return "clean";
  if (id === "hayFavor") return "hayRefill";
  if (id === "waterFavor") return "waterRefill";
  if (id === "zoomieFavor") return "combo";
  if (id === "snackFavor") return "ability";
  if (id === "furnitureFavor") return "furniture";
  return "compost";
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

function awardBeans(state: GameState, amount: number): void {
  state.beans += amount;
  state.stats.lifetimeBeans += amount;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
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
