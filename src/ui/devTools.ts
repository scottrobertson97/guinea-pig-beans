import {
  addBeans,
  clearPoops,
  refillHay,
  refillWater,
  setBeans,
  unlockRobot,
} from "../simulation/actions";
import { getZoneMetrics, refreshEcology } from "../simulation/ecology";
import { PIG_WELCOME_READY_SECONDS } from "../simulation/pigWelcome";
import { setRelationshipForPair, syncRelationshipWeb } from "../simulation/relationships";
import { addLog, addPig, chooseTarget, setPigGoal, spawnDebugPoop, spawnEventPoop } from "../simulation/state";
import type { GameState, PoopType } from "../simulation/types";
import { emitDevLifecycleStatusSeeded } from "./events";

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
      this.createDevNav(),
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
      this.createButton("Seed Smoke Bean", () => this.seedSmokeBean()),
      this.createButton("Spawn Normal", () => this.spawnPoop("normal")),
      this.createButton("Spawn Golden", () => this.spawnPoop("golden")),
      this.createButton("Spawn Compost", () => this.spawnPoop("compost")),
      this.createButton("Spawn Blessed", () => this.spawnPoop("blessed")),
      this.createButton("Spawn Royal", () => this.spawnPoop("royal")),
      this.createButton("Spawn Stinky", () => this.spawnPoop("stinky")),
      this.createButton("Seed Lifecycle Status", () => this.seedLifecycleStatus()),
      this.createButton("Seed Happy Popcorn", () => this.seedHappyPopcorn()),
      this.createButton("Seed Ecology Stress", () => this.seedEcologyStress()),
      this.createButton("Seed Pig Welcome Ready", () => this.seedPigWelcomeReady()),
      this.createButton("Seed Relationship Web", () => this.seedRelationshipWeb()),
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

  private createDevNav(): HTMLElement {
    const nav = document.createElement("nav");
    nav.className = "dev-tools-nav";
    nav.setAttribute("aria-label", "Developer pages");
    nav.append(
      this.createNavLink("Game", "/"),
      this.createNavLink("Constants", "/constants"),
      this.createNavLink("Tech Tree", "/tech-tree-layout"),
    );
    return nav;
  }

  private createNavLink(label: string, href: string): HTMLAnchorElement {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;

    const currentPath = normalizePath(window.location.pathname);
    const targetPath = normalizePath(href);
    if (currentPath === targetPath || (targetPath === "/" && currentPath === "/index.html")) {
      link.setAttribute("aria-current", "page");
    }

    return link;
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

  private seedSmokeBean(): void {
    clearPoops(this.state);
    spawnEventPoop(this.state, "normal", this.state.cage.width / 2, this.state.cage.height / 2);
    addLog(this.state, "Dev tools seeded a smoke-test bean.");
  }

  private seedHappyPopcorn(): void {
    while (this.state.pigs.length < 3) {
      addPig(this.state);
    }

    clearPoops(this.state);
    this.state.needs.hay = 100;
    this.state.needs.water = 100;
    this.state.cage.cleanliness = 100;
    this.state.cage.happiness = Math.max(this.state.cage.happiness, 96);
    this.state.event.active = null;
    this.state.event.bottleJammed = false;
    this.state.event.responseReady = false;

    const centerX = this.state.cage.width / 2;
    const centerY = this.state.cage.height / 2;
    for (const [index, pig] of this.state.pigs.slice(0, 3).entries()) {
      pig.x = centerX + (index - 1) * 54;
      pig.y = centerY + (index % 2 === 0 ? -18 : 20);
      pig.hunger = 92;
      pig.thirst = 92;
      pig.energy = 82;
      pig.stress = 0;
      setPigGoal(this.state, pig, "roam");
      pig.targetX = pig.x;
      pig.targetY = pig.y;
      pig.goalTimer = 8;
    }

    refreshEcology(this.state);
    addLog(this.state, "Dev tools settled a happy herd for popcorn jumps.");
    emitDevLifecycleStatusSeeded();
  }

  private seedLifecycleStatus(): void {
    while (this.state.pigs.length < 3) {
      addPig(this.state);
    }

    this.state.needs.hay = Math.max(this.state.needs.hay, 55);
    this.state.needs.water = Math.max(this.state.needs.water, 55);

    const seeds = [
      { hunger: 12, thirst: 82, energy: 74, goal: "seekFood" as const },
      { hunger: 82, thirst: 12, energy: 74, goal: "seekWater" as const },
      { hunger: 82, thirst: 82, energy: 12, goal: "seekSleep" as const },
    ];

    for (const [index, seed] of seeds.entries()) {
      const pig = this.state.pigs[index];
      if (!pig) continue;
      pig.hunger = seed.hunger;
      pig.thirst = seed.thirst;
      pig.energy = seed.energy;
      pig.stress = 0;
      setPigGoal(this.state, pig, seed.goal);
      pig.goalTimer = 0;
      chooseTarget(this.state, pig);
    }

    refreshEcology(this.state);
    emitDevLifecycleStatusSeeded();
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

  private seedPigWelcomeReady(): void {
    while (this.state.pigs.length < 2) {
      addPig(this.state);
    }

    clearPoops(this.state);
    this.state.needs.hay = Math.max(this.state.needs.hay, 70);
    this.state.needs.water = Math.max(this.state.needs.water, 70);
    this.state.cage.cleanliness = 100;

    const seededPigIds = this.state.pigs.slice(0, 2).map((pig) => pig.id);
    this.state.pigWelcome.completedPigIds = this.state.pigWelcome.completedPigIds.filter((pigId) => !seededPigIds.includes(pigId));
    for (const pig of this.state.pigs.slice(0, 2)) {
      const zone = getZoneMetrics(this.state, pig.favoriteZone);
      pig.x = zone.x;
      pig.y = zone.y;
      pig.targetX = zone.x;
      pig.targetY = zone.y;
      pig.stress = Math.min(pig.stress, 12);
      this.state.pigWelcome.progressByPigId[String(pig.id)] = PIG_WELCOME_READY_SECONDS;
    }

    refreshEcology(this.state);
    addLog(this.state, "Dev tools readied the starter pigs for Pig Welcome.");
  }

  private seedRelationshipWeb(): void {
    while (this.state.pigs.length < 10) {
      addPig(this.state);
    }

    for (const pig of this.state.pigs) {
      pig.bondedPigId = null;
      pig.stress = 18;
    }

    const [bondedA, bondedB, buddyA, buddyB, napA, napB, follower, anchor, rivalA, rivalB] = this.state.pigs;
    if (bondedA && bondedB) {
      bondedA.bondedPigId = bondedB.id;
      bondedB.bondedPigId = bondedA.id;
    }

    syncRelationshipWeb(this.state);
    if (bondedA && bondedB) setRelationshipForPair(this.state, bondedA.id, bondedB.id, "bonded", 78, 0);
    if (buddyA && buddyB) setRelationshipForPair(this.state, buddyA.id, buddyB.id, "buddy", 66, 5);
    if (napA && napB) setRelationshipForPair(this.state, napA.id, napB.id, "napPartner", 62, 4);
    if (follower && anchor) setRelationshipForPair(this.state, follower.id, anchor.id, "shyFollower", 54, 10);
    if (rivalA && rivalB) setRelationshipForPair(this.state, rivalA.id, rivalB.id, "rival", 28, 68);

    const hidey = getZoneMetrics(this.state, "hideyZone");
    for (const [index, pig] of this.state.pigs.entries()) {
      if (index >= 10) break;
      pig.x = hidey.x + (index - 4.5) * 10;
      pig.y = hidey.y + (index % 2 === 0 ? -14 : 14);
      pig.targetX = pig.x;
      pig.targetY = pig.y;
    }

    refreshEcology(this.state);
    addLog(this.state, "Dev tools seeded bonded, buddy, nap partner, shy follower, and rival relationships.");
  }
}

function normalizePath(path: string): string {
  const normalized = path.replace(/\/+$/, "");
  return normalized.length === 0 ? "/" : normalized;
}
