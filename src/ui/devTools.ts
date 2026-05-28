import {
  addBeans,
  clearPoops,
  refillHay,
  refillWater,
  setBeans,
  unlockRobot,
} from "../simulation/actions";
import { spawnDebugPoop } from "../simulation/state";
import type { GameState, PoopType } from "../simulation/types";

export class DevTools {
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private open = false;

  constructor(
    private readonly state: GameState,
    private readonly onAction: () => void,
  ) {
    this.root = document.createElement("div");
    this.root.id = "dev-tools";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "dev-tools-toggle";
    toggle.textContent = "Dev";
    toggle.addEventListener("click", () => this.setOpen(!this.open));

    this.panel = document.createElement("div");
    this.panel.className = "dev-tools-panel";
    this.panel.hidden = true;
    this.panel.append(
      this.createButton("+100 Beans", () => addBeans(this.state, 100)),
      this.createButton("+1,000 Beans", () => addBeans(this.state, 1000)),
      this.createButton("Set Beans 10k", () => setBeans(this.state, 10000)),
      this.createButton("Refill Hay/Water", () => {
        refillHay(this.state);
        refillWater(this.state);
      }),
      this.createButton("Spawn Normal", () => this.spawnPoop("normal")),
      this.createButton("Spawn Golden", () => this.spawnPoop("golden")),
      this.createButton("Spawn Stinky", () => this.spawnPoop("stinky")),
      this.createButton("Buy/Unlock Roomba", () => unlockRobot(this.state)),
      this.createButton("Clear Poops", () => clearPoops(this.state)),
    );

    this.root.append(toggle, this.panel);
    document.body.append(this.root);
  }

  private setOpen(open: boolean): void {
    this.open = open;
    this.panel.hidden = !open;
  }

  private createButton(label: string, action: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      action();
      this.onAction();
    });
    return button;
  }

  private spawnPoop(type: PoopType): void {
    spawnDebugPoop(this.state, type);
  }
}
