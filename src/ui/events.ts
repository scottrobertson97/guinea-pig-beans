export const PLAYER_ACTION_EVENT = "guinea-pig-player-action";
export const UI_SOUND_EVENT = "guinea-pig-ui-sound";
export const DEV_LIFECYCLE_STATUS_EVENT = "guinea-pig-dev-lifecycle-status";

export type PlayerActionId =
  | "cleanBean"
  | "refillCare"
  | "openShop"
  | "buyFirstUpgrade"
  | "useAbility"
  | "purchase"
  | "eventResponse";

export type UiSoundId =
  | "button"
  | "clean"
  | "rareClean"
  | "purchase"
  | "ability"
  | "event"
  | "modalOpen"
  | "modalClose"
  | "pig";

export type SceneFeedbackCategory =
  | "care"
  | "habitat"
  | "purchase"
  | "unlock"
  | "trade"
  | "experiment"
  | "decree"
  | "event"
  | "prestige"
  | "adoption"
  | "clean"
  | "autoClean"
  | "milestone";

export type SceneFeedbackTarget =
  | "hay"
  | "water"
  | "scoop"
  | "robot"
  | "cage"
  | "furniture"
  | "herd"
  | "ability"
  | "zone"
  | "center";

export interface SceneFeedbackDetail {
  category: SceneFeedbackCategory;
  target?: SceneFeedbackTarget;
  label?: string;
  resourceText?: string;
  color?: number;
  abilityId?: import("../simulation/types").AbilityId;
  furnitureId?: import("../simulation/types").FurnitureId;
  tradeId?: import("../simulation/types").BeanExchangeTradeId;
  decreeId?: import("../simulation/types").CouncilDecreeId;
  eventChoiceId?: import("../simulation/types").EventChoiceId;
  zoneId?: import("../simulation/types").CageZoneId;
  milestoneKind?: "quest" | "achievement";
}

export interface PlayerActionDetail {
  action: PlayerActionId;
}

export interface UiSoundDetail {
  sound: UiSoundId;
}

export function emitPlayerAction(action: PlayerActionId): void {
  window.dispatchEvent(new CustomEvent<PlayerActionDetail>(PLAYER_ACTION_EVENT, { detail: { action } }));
}

export function emitUiSound(sound: UiSoundId): void {
  window.dispatchEvent(new CustomEvent<UiSoundDetail>(UI_SOUND_EVENT, { detail: { sound } }));
}

export function emitDevLifecycleStatusSeeded(): void {
  window.dispatchEvent(new Event(DEV_LIFECYCLE_STATUS_EVENT));
}
