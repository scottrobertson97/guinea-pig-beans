export const PLAYER_ACTION_EVENT = "guinea-pig-player-action";
export const UI_SOUND_EVENT = "guinea-pig-ui-sound";

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
