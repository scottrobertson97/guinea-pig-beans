import { PLAYER_ACTION_EVENT, type PlayerActionDetail, type PlayerActionId } from "./events";

const TUTORIAL_COMPLETE_KEY = "gpb-tutorial-complete";
const TUTORIAL_DISMISSED_KEY = "gpb-tutorial-dismissed";

const TUTORIAL_STEPS: Array<{ action: PlayerActionId; text: string }> = [
  { action: "cleanBean", text: "Clean a bean to start the cage economy." },
  { action: "refillCare", text: "Top off hay or water before the herd files paperwork." },
  { action: "openShop", text: "Open Shop from the dock when you have a few Beans." },
  { action: "buyFirstUpgrade", text: "Buy Better Hay or Better Scoop for your first upgrade." },
];

export class TutorialController {
  private readonly hint: HTMLElement | null;
  private readonly text: HTMLElement | null;
  private readonly dismissButton: HTMLButtonElement | null;
  private stepIndex = 0;
  private dismissed = false;
  private complete = false;
  private readonly handlePlayerAction = (event: Event): void => {
    const action = (event as CustomEvent<PlayerActionDetail>).detail?.action;
    if (action) this.advance(action);
  };

  constructor() {
    this.hint = document.getElementById("tutorial-hint");
    this.text = document.getElementById("tutorial-hint-text");
    this.dismissButton = document.getElementById("tutorial-dismiss") as HTMLButtonElement | null;
    this.complete = readSessionFlag(TUTORIAL_COMPLETE_KEY);
    this.dismissed = readSessionFlag(TUTORIAL_DISMISSED_KEY);

    this.dismissButton?.addEventListener("click", () => this.dismiss());
    window.addEventListener(PLAYER_ACTION_EVENT, this.handlePlayerAction);

    this.render();
  }

  private advance(action: PlayerActionId): void {
    if (this.complete || this.dismissed) return;
    const step = TUTORIAL_STEPS[this.stepIndex];
    if (!step || step.action !== action) return;

    this.stepIndex += 1;
    if (this.stepIndex >= TUTORIAL_STEPS.length) {
      this.complete = true;
      writeSessionFlag(TUTORIAL_COMPLETE_KEY);
    }
    this.render();
  }

  private dismiss(): void {
    this.dismissed = true;
    writeSessionFlag(TUTORIAL_DISMISSED_KEY);
    this.render();
  }

  private render(): void {
    if (!this.hint || !this.text) return;
    const step = TUTORIAL_STEPS[this.stepIndex];
    const shouldHide = this.complete || this.dismissed || !step;
    this.hint.hidden = shouldHide;
    if (!shouldHide) this.text.textContent = step.text;
  }
}

function readSessionFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeSessionFlag(key: string): void {
  try {
    sessionStorage.setItem(key, "true");
  } catch {
    // Session storage is a convenience only; the tutorial should still run without it.
  }
}
