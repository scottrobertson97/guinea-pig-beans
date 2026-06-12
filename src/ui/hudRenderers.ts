import type { FurnitureCareView } from "../simulation/actions";
import type { ContractBoardView, ContractCardView } from "../simulation/contracts";
import type { CageZoneMetrics, CageZoneStewardship, CageZoneId, GameState, FurnitureId } from "../simulation/types";
import type { MilestoneRecordView } from "../simulation/milestones";
import { getCageZoneName } from "../simulation/ecology";
import { getFurnitureSynergies, hasFurnitureSynergy } from "../simulation/balance";
import { getFurnitureName } from "../simulation/furnitureDefinitions";

export function createEmptyStateItem(text: string): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "empty-state";
  item.textContent = text;
  return item;
}

export function renderLogList(list: HTMLOListElement, messages: string[]): void {
  list.replaceChildren(
    ...(messages.length > 0
      ? messages.map((message) => {
          const item = document.createElement("li");
          item.textContent = message;
          return item;
        })
      : [createEmptyStateItem("The cage log is quiet. The bedding is enjoying the suspense.")]),
  );
}

export function renderRecordList(list: HTMLUListElement, records: MilestoneRecordView[]): void {
  const items = records.map((record) => {
    const item = document.createElement("li");
    const title = document.createElement("span");
    const kind = document.createElement("strong");
    title.textContent = record.title;
    kind.textContent = record.kind;
    item.append(title, kind);
    return item;
  });

  if (items.length === 0) items.push(createEmptyStateItem("No records yet. Contracts and cage milestones will leave a trail here."));

  list.replaceChildren(...items);
}

export function renderContractList(
  list: HTMLUListElement,
  board: ContractBoardView,
  onSelect: (contractId: string, button: HTMLButtonElement) => void,
): void {
  const items: HTMLLIElement[] = [];
  if (board.active) {
    items.push(createContractItem(board.active, true, onSelect));
  } else {
    items.push(...board.offers.map((offer) => createContractItem(offer, false, onSelect)));
  }

  if (board.lastResult) {
    const result = document.createElement("li");
    result.className = board.lastResult.completed ? "contract-result complete" : "contract-result";
    const title = document.createElement("span");
    const reward = document.createElement("strong");
    title.textContent = board.lastResult.completed ? `${board.lastResult.title} complete` : `${board.lastResult.title} expired`;
    reward.textContent = board.lastResult.rewardText;
    result.append(title, reward);
    items.push(result);
  }

  if (items.length === 0) {
    items.push(createEmptyStateItem("Contracts are restocking. Keep the cage steady."));
  }
  list.replaceChildren(...items);
}

export function renderFurnitureSynergyList(list: HTMLUListElement, state: GameState): void {
  const items = getFurnitureSynergies().map((synergy) => {
    const active = hasFurnitureSynergy(state, synergy.id);
    const missing = synergy.furniture.filter((furnitureId) => !state.furniture[furnitureId]);
    const item = document.createElement("li");
    if (active) item.classList.add("complete");

    const title = document.createElement("span");
    const status = document.createElement("strong");
    const description = document.createElement("em");
    title.textContent = synergy.name;
    status.textContent = active ? "Active" : `Needs ${missing.map(getFurnitureName).join(" + ")}`;
    description.textContent = synergy.description;
    item.append(title, status, description);
    return item;
  });

  list.replaceChildren(...items);
}

export function renderFurnitureCareList(
  list: HTMLUListElement,
  views: FurnitureCareView[],
  onCare: (furnitureId: FurnitureId, label: string, zoneId: CageZoneId, button: HTMLButtonElement) => void,
): void {
  if (views.length === 0) {
    list.replaceChildren(createEmptyStateItem("Unlock furniture to start caring for well-loved cage pieces."));
    return;
  }

  const items = views.map((view) => {
    const item = document.createElement("li");
    const conditionClass = view.condition >= 88 ? "complete" : view.condition < 58 ? "attention" : "";
    if (conditionClass) item.classList.add(conditionClass);
    if (view.status.startsWith("Cooldown")) item.classList.add("cooldown");

    const title = document.createElement("span");
    const status = document.createElement("strong");
    const metrics = document.createElement("small");
    const effect = document.createElement("em");
    const controls = document.createElement("div");
    const careButton = document.createElement("button");
    const careStatus = document.createElement("small");

    title.textContent = view.label;
    status.textContent = view.conditionLabel;
    metrics.textContent = `Condition ${view.condition} - ${getCageZoneName(view.zoneId)}`;
    effect.textContent = view.effect;
    controls.className = "furniture-care-actions";
    careButton.type = "button";
    careButton.className = "furniture-care-button";
    careButton.textContent = "Care";
    careButton.disabled = !view.canCare;
    careStatus.textContent = view.status;
    careButton.addEventListener("click", () => onCare(view.id, view.label, view.zoneId, careButton));
    controls.append(careButton, careStatus);
    item.append(title, status, metrics, effect, controls);
    return item;
  });

  list.replaceChildren(...items);
}

export function renderEcologyZoneList(
  list: HTMLUListElement,
  zones: CageZoneMetrics[],
  stewardship: Partial<Record<CageZoneId, CageZoneStewardship>>,
  canTend: (zoneId: CageZoneId) => boolean,
  getTendStatus: (zoneId: CageZoneId) => string,
  onTend: (zoneId: CageZoneId, button: HTMLButtonElement) => void,
): void {
  const items = zones.map((zone) => {
    const item = document.createElement("li");
    item.dataset.zoneId = zone.id;
    if (zone.mess >= 55 || zone.traffic >= 72 || zone.comfort <= 32) item.classList.add("attention");
    if (zone.appeal >= 78 && zone.pigIds.length > 0) item.classList.add("complete");

    const title = document.createElement("span");
    const status = document.createElement("strong");
    const metrics = document.createElement("small");
    const action = document.createElement("em");
    const controls = document.createElement("div");
    const tendButton = document.createElement("button");
    const tendStatus = document.createElement("small");
    title.textContent = zone.label;
    status.textContent = zone.status;
    const stewardshipCare = stewardship[zone.id]?.care ?? 0;
    const stewardshipCooldown = stewardship[zone.id]?.cooldown ?? 0;
    if (stewardshipCooldown > 0) item.classList.add("cooldown");
    metrics.textContent = `Comfort ${zone.comfort} - Mess ${zone.mess} - Traffic ${zone.traffic} - Care ${Math.round(stewardshipCare)}`;
    action.textContent = `${zone.action}${zone.pigIds.length > 0 ? ` - ${zone.pigIds.length} pig${zone.pigIds.length === 1 ? "" : "s"}` : ""}`;
    controls.className = "ecology-actions";
    tendButton.type = "button";
    tendButton.className = "zone-tend-button";
    tendButton.textContent = "Tend";
    tendButton.disabled = !canTend(zone.id);
    tendStatus.textContent = getTendStatus(zone.id);
    tendButton.addEventListener("click", () => onTend(zone.id, tendButton));
    controls.append(tendButton, tendStatus);
    item.append(title, status, metrics, action, controls);
    return item;
  });

  list.replaceChildren(...items);
}

function createContractItem(contract: ContractCardView, active: boolean, onSelect: (contractId: string, button: HTMLButtonElement) => void): HTMLLIElement {
  const item = document.createElement("li");
  item.className = active ? "contract-card active-contract" : "contract-card";

  const title = document.createElement("span");
  const timer = document.createElement("strong");
  const description = document.createElement("em");
  const reward = document.createElement("small");
  const requirements = document.createElement("ul");
  title.textContent = contract.title;
  timer.textContent = contract.timer;
  description.textContent = contract.description;
  reward.textContent = contract.rewardText;
  requirements.className = "contract-requirements";

  for (const requirement of contract.requirements) {
    const requirementItem = document.createElement("li");
    if (requirement.complete) requirementItem.classList.add("complete");
    const label = document.createElement("span");
    const progress = document.createElement("strong");
    label.textContent = requirement.label;
    progress.textContent = requirement.progressText;
    requirementItem.append(label, progress);
    requirements.append(requirementItem);
  }

  item.append(title, timer, description, reward, requirements);
  if (!active) {
    const controls = document.createElement("div");
    const button = document.createElement("button");
    controls.className = "contract-actions";
    button.type = "button";
    button.className = "contract-select-button";
    button.textContent = "Select";
    button.addEventListener("click", () => onSelect(contract.id, button));
    controls.append(button);
    item.append(controls);
  }
  return item;
}
