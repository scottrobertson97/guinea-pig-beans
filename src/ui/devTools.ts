import {
  addBeans,
  clearPoops,
  refillHay,
  refillWater,
  setBeans,
  unlockRobot,
} from "../simulation/actions";
import { getZoneMetrics, refreshEcology } from "../simulation/ecology";
import { addLog, spawnDebugPoop, spawnEventPoop } from "../simulation/state";
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
      this.createButton("+25 Compost", () => this.addResource("compost", 25)),
      this.createButton("+10 Squeaks", () => this.addResource("squeaks", 10)),
      this.createButton("+3 Wisdom", () => this.addResource("cavyWisdom", 3)),
      this.createButton("Refill Hay/Water", () => {
        refillHay(this.state);
        refillWater(this.state);
      }),
      this.createButton("Spawn Normal", () => this.spawnPoop("normal")),
      this.createButton("Spawn Golden", () => this.spawnPoop("golden")),
      this.createButton("Spawn Compost", () => this.spawnPoop("compost")),
      this.createButton("Spawn Blessed", () => this.spawnPoop("blessed")),
      this.createButton("Spawn Royal", () => this.spawnPoop("royal")),
      this.createButton("Spawn Stinky", () => this.spawnPoop("stinky")),
      this.createButton("Seed Ecology Stress", () => this.seedEcologyStress()),
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

  private addResource(id: "compost" | "squeaks" | "cavyWisdom", amount: number): void {
    this.state[id] += amount;
    addLog(this.state, `Dev tools added ${amount} ${id}.`);
  }

  private seedEcologyStress(): void {
    const litter = getZoneMetrics(this.state, "litterCorner");
    const hidey = getZoneMetrics(this.state, "hideyZone");
    for (let index = 0; index < 5; index += 1) {
      spawnEventPoop(
        this.state,
        index % 2 === 0 ? "stinky" : "normal",
        litter.x + (index - 2) * 12,
        litter.y + (index % 2 === 0 ? -10 : 14),
      );
    }
    for (const [index, pig] of this.state.pigs.entries()) {
      if (index >= 4) break;
      pig.x = hidey.x + index * 8;
      pig.y = hidey.y + index * 6;
      pig.targetX = pig.x;
      pig.targetY = pig.y;
      pig.stress = Math.max(pig.stress, 62);
    }
    refreshEcology(this.state);
    addLog(this.state, "Dev tools seeded a dirty, crowded ecology state.");
  }
}
