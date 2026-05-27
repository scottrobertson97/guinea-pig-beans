import {
  buyFeedUpgrade,
  buyPig,
  buyScoopUpgrade,
  refillHay,
  refillWater,
} from "../simulation/actions";
import { getCosts } from "../simulation/balance";
import type { GameState } from "../simulation/types";

type ButtonId = "adopt-pig" | "better-hay" | "better-scoop" | "refill-hay" | "refill-water";

export class Hud {
  private buttons: Record<ButtonId, HTMLButtonElement>;

  constructor(
    private readonly state: GameState,
    private readonly onAction: () => void,
  ) {
    this.buttons = {
      "adopt-pig": getButton("adopt-pig"),
      "better-hay": getButton("better-hay"),
      "better-scoop": getButton("better-scoop"),
      "refill-hay": getButton("refill-hay"),
      "refill-water": getButton("refill-water"),
    };

    this.buttons["adopt-pig"].addEventListener("click", () => this.runAction(() => buyPig(this.state)));
    this.buttons["better-hay"].addEventListener("click", () =>
      this.runAction(() => buyFeedUpgrade(this.state)),
    );
    this.buttons["better-scoop"].addEventListener("click", () =>
      this.runAction(() => buyScoopUpgrade(this.state)),
    );
    this.buttons["refill-hay"].addEventListener("click", () => this.runAction(() => refillHay(this.state)));
    this.buttons["refill-water"].addEventListener("click", () =>
      this.runAction(() => refillWater(this.state)),
    );
  }

  render(): void {
    const costs = getCosts(this.state);
    setText("beans", Math.floor(this.state.beans).toString());
    setText("pig-count", this.state.pigs.length.toString());
    setText("cleanliness", `${this.state.cage.cleanliness}%`);
    setText("hay-value", `${Math.ceil(this.state.needs.hay)}%`);
    setText("water-value", `${Math.ceil(this.state.needs.water)}%`);
    setText("adopt-cost", `${costs.pig} Beans`);
    setText("feed-cost", `${costs.feed} Beans`);
    setText("scoop-cost", `${costs.scoop} Beans`);
    setText("status-line", getStatusLine(this.state));

    setMeter("hay-meter", this.state.needs.hay);
    setMeter("water-meter", this.state.needs.water);

    this.buttons["adopt-pig"].disabled = this.state.beans < costs.pig;
    this.buttons["better-hay"].disabled = this.state.beans < costs.feed;
    this.buttons["better-scoop"].disabled = this.state.beans < costs.scoop;

    const log = document.querySelector<HTMLOListElement>("#event-log");
    if (log) {
      log.replaceChildren(
        ...this.state.log.map((message) => {
          const item = document.createElement("li");
          item.textContent = message;
          return item;
        }),
      );
    }
  }

  private runAction(action: () => boolean | void): void {
    action();
    this.onAction();
    this.render();
  }
}

function getButton(id: ButtonId): HTMLButtonElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Missing button #${id}`);
  }
  return element;
}

function setText(id: string, text: string): void {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function setMeter(id: string, value: number): void {
  const element = document.getElementById(id);
  if (element) element.style.width = `${Math.max(0, Math.min(100, value))}%`;
}

function getStatusLine(state: GameState): string {
  if (state.needs.hay <= 0) return "The hay rack is empty. The pigs have filed a complaint.";
  if (state.needs.water <= 0) return "The water bottle is empty, and the cage is giving you a look.";
  if (state.cage.cleanliness < 35) return "The cage is getting bold. Clean a few beans.";
  if (state.poops.length > 8) return "There are beans everywhere. This is probably fine.";
  return `${state.pigs[0]?.name ?? "A pig"} is considering a bean.`;
}
