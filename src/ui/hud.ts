import {
  buyFeedUpgrade,
  buyCageUpgrade,
  buyFurniture,
  buyPig,
  buyRarePig,
  buyRobot,
  buyScoopUpgrade,
  prestige,
  refillHay,
  refillWater,
  unlockLateGameSystem,
  useAbility,
} from "../simulation/actions";
import { getCosts } from "../simulation/balance";
import { getAchievementViews, getQuestViews, type MilestoneView } from "../simulation/milestones";
import type { AbilityId, FurnitureId, GameState } from "../simulation/types";

type ButtonId =
  | "adopt-pig"
  | "better-hay"
  | "better-scoop"
  | "poop-roomba"
  | "bigger-cage"
  | "rare-pig"
  | "refill-hay"
  | "refill-water"
  | "hidey-house"
  | "tunnel"
  | "litter-tray"
  | "chew-toy"
  | "snuggle-sack"
  | "cardboard-castle"
  | "royal-throne"
  | "wheek-call"
  | "treat-bag"
  | "deep-clean"
  | "fresh-bedding"
  | "snack-time"
  | "zoomie-mode"
  | "hay-dimension"
  | "bean-exchange"
  | "cavy-council"
  | "squeak-choir"
  | "bean-singularity"
  | "prestige";

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
      "poop-roomba": getButton("poop-roomba"),
      "bigger-cage": getButton("bigger-cage"),
      "rare-pig": getButton("rare-pig"),
      "refill-hay": getButton("refill-hay"),
      "refill-water": getButton("refill-water"),
      "hidey-house": getButton("hidey-house"),
      tunnel: getButton("tunnel"),
      "litter-tray": getButton("litter-tray"),
      "chew-toy": getButton("chew-toy"),
      "snuggle-sack": getButton("snuggle-sack"),
      "cardboard-castle": getButton("cardboard-castle"),
      "royal-throne": getButton("royal-throne"),
      "wheek-call": getButton("wheek-call"),
      "treat-bag": getButton("treat-bag"),
      "deep-clean": getButton("deep-clean"),
      "fresh-bedding": getButton("fresh-bedding"),
      "snack-time": getButton("snack-time"),
      "zoomie-mode": getButton("zoomie-mode"),
      "hay-dimension": getButton("hay-dimension"),
      "bean-exchange": getButton("bean-exchange"),
      "cavy-council": getButton("cavy-council"),
      "squeak-choir": getButton("squeak-choir"),
      "bean-singularity": getButton("bean-singularity"),
      prestige: getButton("prestige"),
    };

    this.buttons["adopt-pig"].addEventListener("click", () => this.runAction(() => buyPig(this.state)));
    this.buttons["better-hay"].addEventListener("click", () =>
      this.runAction(() => buyFeedUpgrade(this.state)),
    );
    this.buttons["better-scoop"].addEventListener("click", () =>
      this.runAction(() => buyScoopUpgrade(this.state)),
    );
    this.buttons["poop-roomba"].addEventListener("click", () =>
      this.runAction(() => buyRobot(this.state)),
    );
    this.buttons["bigger-cage"].addEventListener("click", () =>
      this.runAction(() => buyCageUpgrade(this.state)),
    );
    this.buttons["rare-pig"].addEventListener("click", () => this.runAction(() => buyRarePig(this.state)));
    this.buttons["refill-hay"].addEventListener("click", () => this.runAction(() => refillHay(this.state)));
    this.buttons["refill-water"].addEventListener("click", () =>
      this.runAction(() => refillWater(this.state)),
    );
    this.bindFurnitureButton("hidey-house", "hideyHouse");
    this.bindFurnitureButton("tunnel", "tunnel");
    this.bindFurnitureButton("litter-tray", "litterTray");
    this.bindFurnitureButton("chew-toy", "chewToy");
    this.bindFurnitureButton("snuggle-sack", "snuggleSack");
    this.bindFurnitureButton("cardboard-castle", "cardboardCastle");
    this.bindFurnitureButton("royal-throne", "royalThrone");
    this.bindAbilityButton("wheek-call", "wheekCall");
    this.bindAbilityButton("treat-bag", "treatBag");
    this.bindAbilityButton("deep-clean", "deepClean");
    this.bindAbilityButton("fresh-bedding", "freshBedding");
    this.bindAbilityButton("snack-time", "snackTime");
    this.bindAbilityButton("zoomie-mode", "zoomieMode");
    this.buttons["hay-dimension"].addEventListener("click", () =>
      this.runAction(() => unlockLateGameSystem(this.state, "hayDimension")),
    );
    this.buttons["bean-exchange"].addEventListener("click", () =>
      this.runAction(() => unlockLateGameSystem(this.state, "beanExchange")),
    );
    this.buttons["cavy-council"].addEventListener("click", () =>
      this.runAction(() => unlockLateGameSystem(this.state, "cavyCouncil")),
    );
    this.buttons["squeak-choir"].addEventListener("click", () =>
      this.runAction(() => unlockLateGameSystem(this.state, "squeakChoir")),
    );
    this.buttons["bean-singularity"].addEventListener("click", () =>
      this.runAction(() => unlockLateGameSystem(this.state, "beanSingularity")),
    );
    this.buttons.prestige.addEventListener("click", () => this.runAction(() => prestige(this.state)));
  }

  render(): void {
    const costs = getCosts(this.state);
    setText("beans", Math.floor(this.state.beans).toString());
    setText("pig-count", this.state.pigs.length.toString());
    setText("cleanliness", `${this.state.cage.cleanliness}%`);
    setText("compost", Math.floor(this.state.compost).toString());
    setText("squeaks", Math.floor(this.state.squeaks).toString());
    setText("golden-beans", this.state.goldenBeans.toString());
    setText("cavy-wisdom", this.state.cavyWisdom.toString());
    setText("hay-value", `${Math.ceil(this.state.needs.hay)}%`);
    setText("water-value", `${Math.ceil(this.state.needs.water)}%`);
    setText("combo-value", getComboText(this.state));
    setText("adopt-cost", `${costs.pig} Beans`);
    setText("feed-cost", `${costs.feed} Beans`);
    setText("scoop-cost", `${costs.scoop} Beans`);
    setText("robot-cost", this.state.robot ? "Active" : `${costs.robot} Beans`);
    setText("cage-cost", `${costs.cage} Beans`);
    setText("rare-pig-cost", `${costs.rarePig} + 1 Gold`);
    this.renderFurnitureCosts(costs.furniture);
    this.renderAbilityStatuses();
    this.renderLateGameStatuses();
    setText("prestige-cost", `${costs.prestige} Lifetime`);
    setText("status-line", getStatusLine(this.state));

    setMeter("hay-meter", this.state.needs.hay);
    setMeter("water-meter", this.state.needs.water);

    this.buttons["adopt-pig"].disabled = this.state.beans < costs.pig;
    this.buttons["better-hay"].disabled = this.state.beans < costs.feed;
    this.buttons["better-scoop"].disabled = this.state.beans < costs.scoop;
    this.buttons["poop-roomba"].disabled = Boolean(this.state.robot) || this.state.beans < costs.robot;
    this.buttons["bigger-cage"].disabled = this.state.beans < costs.cage;
    this.buttons["rare-pig"].disabled = this.state.beans < costs.rarePig || this.state.goldenBeans < 1;
    this.updateFurnitureDisabled(costs.furniture);
    this.updateAbilityDisabled();
    this.updateLateGameDisabled();
    this.buttons.prestige.disabled = this.state.stats.lifetimeBeans < costs.prestige;

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

    const roster = document.querySelector<HTMLUListElement>("#pig-roster");
    if (roster) {
      roster.replaceChildren(
        ...this.state.pigs.map((pig) => {
          const item = document.createElement("li");
          const identity = document.createElement("strong");
          const details = document.createElement("span");
          identity.textContent = pig.name;
          details.textContent = `${pig.breed} ${pig.trait} - ${pig.quirk}`;
          item.append(identity, details);
          return item;
        }),
      );
    }

    renderMilestoneList("quest-list", getQuestViews(this.state), 4);
    renderMilestoneList("achievement-list", getAchievementViews(this.state), 3);
  }

  private runAction(action: () => boolean | void): void {
    action();
    this.onAction();
    this.render();
  }

  private bindFurnitureButton(buttonId: ButtonId, furnitureId: FurnitureId): void {
    this.buttons[buttonId].addEventListener("click", () =>
      this.runAction(() => buyFurniture(this.state, furnitureId)),
    );
  }

  private bindAbilityButton(buttonId: ButtonId, abilityId: AbilityId): void {
    this.buttons[buttonId].addEventListener("click", () =>
      this.runAction(() => useAbility(this.state, abilityId)),
    );
  }

  private renderFurnitureCosts(costs: Record<FurnitureId, number>): void {
    setText("hidey-house-cost", `${costs.hideyHouse} Beans`);
    setText("tunnel-cost", `${costs.tunnel} Beans`);
    setText("litter-tray-cost", `${costs.litterTray} Beans`);
    setText("chew-toy-cost", `${costs.chewToy} Beans`);
    setText("snuggle-sack-cost", `${costs.snuggleSack} Beans`);
    setText("cardboard-castle-cost", `${costs.cardboardCastle} Beans`);
    setText("royal-throne-cost", `${costs.royalThrone} Beans`);
  }

  private renderAbilityStatuses(): void {
    setText("wheek-call-status", getCooldownText(this.state.abilities.wheekCall));
    setText("treat-bag-status", getCooldownText(this.state.abilities.treatBag));
    setText("deep-clean-status", getCooldownText(this.state.abilities.deepClean));
    setText("fresh-bedding-status", getCooldownText(this.state.abilities.freshBedding));
    setText("snack-time-status", getCooldownText(this.state.abilities.snackTime));
    setText("zoomie-mode-status", getCooldownText(this.state.abilities.zoomieMode));
  }

  private renderLateGameStatuses(): void {
    setText("hay-dimension-status", this.state.lateGame.hayDimension ? "Active" : "750 + 25C");
    setText("bean-exchange-status", this.state.lateGame.beanExchange ? "Active" : "1200 + 2G");
    setText("cavy-council-status", this.state.lateGame.cavyCouncil ? "Active" : "8 Pigs + 10S");
    setText("squeak-choir-status", this.state.lateGame.squeakChoir ? "Active" : "25 Squeaks");
    setText("bean-singularity-status", this.state.lateGame.beanSingularity ? "Active" : "100C + Rare");
  }

  private updateFurnitureDisabled(costs: Record<FurnitureId, number>): void {
    this.buttons["hidey-house"].disabled = this.state.beans < costs.hideyHouse;
    this.buttons.tunnel.disabled = this.state.beans < costs.tunnel;
    this.buttons["litter-tray"].disabled = this.state.beans < costs.litterTray;
    this.buttons["chew-toy"].disabled = this.state.beans < costs.chewToy;
    this.buttons["snuggle-sack"].disabled = this.state.beans < costs.snuggleSack;
    this.buttons["cardboard-castle"].disabled = this.state.beans < costs.cardboardCastle;
    this.buttons["royal-throne"].disabled = this.state.beans < costs.royalThrone;
  }

  private updateAbilityDisabled(): void {
    this.buttons["wheek-call"].disabled = this.state.abilities.wheekCall > 0;
    this.buttons["treat-bag"].disabled = this.state.abilities.treatBag > 0;
    this.buttons["deep-clean"].disabled = this.state.abilities.deepClean > 0;
    this.buttons["fresh-bedding"].disabled = this.state.abilities.freshBedding > 0;
    this.buttons["snack-time"].disabled = this.state.abilities.snackTime > 0;
    this.buttons["zoomie-mode"].disabled = this.state.abilities.zoomieMode > 0;
  }

  private updateLateGameDisabled(): void {
    this.buttons["hay-dimension"].disabled = this.state.lateGame.hayDimension || this.state.beans < 750 || this.state.compost < 25;
    this.buttons["bean-exchange"].disabled = this.state.lateGame.beanExchange || this.state.beans < 1200 || this.state.goldenBeans < 2;
    this.buttons["cavy-council"].disabled = this.state.lateGame.cavyCouncil || this.state.pigs.length < 8 || this.state.squeaks < 10;
    this.buttons["squeak-choir"].disabled = this.state.lateGame.squeakChoir || this.state.squeaks < 25;
    this.buttons["bean-singularity"].disabled =
      this.state.lateGame.beanSingularity || this.state.compost < 100 || this.state.stats.rarePoopsCleaned < 25;
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
  if (state.event.active) return `${state.event.active.name} is active for ${Math.ceil(state.event.active.timer)}s.`;
  if (state.needs.hay <= 0) return "The hay rack is empty. The pigs have filed a complaint.";
  if (state.needs.water <= 0) return "The water bottle is empty, and the cage is giving you a look.";
  if (state.cage.cleanliness < 35) return "The cage is getting bold. Clean a few beans.";
  if (state.poops.some((poop) => poop.type === "golden")) return "A golden bean is glinting in the bedding.";
  if (state.poops.some((poop) => poop.type === "cursed")) return "A cursed bean is making the cage structurally weird.";
  if (state.poops.some((poop) => poop.type === "blessed")) return "A blessed bean is improving the mood.";
  if (state.poops.some((poop) => poop.type === "stinky")) return "A stinky bean is escalating the cleanliness situation.";
  if (state.poops.length > 8) return "There are beans everywhere. This is probably fine.";
  const pig = state.pigs[0];
  if (pig) return `${pig.name} the ${pig.trait} is considering a bean.`;
  return "A pig is considering a bean.";
}

function getComboText(state: GameState): string {
  if (state.combo.count <= 1 || state.combo.timer <= 0) return "Ready";
  return `x${state.combo.count}`;
}

function renderMilestoneList(id: string, milestones: MilestoneView[], limit: number): void {
  const list = document.querySelector<HTMLUListElement>(`#${id}`);
  if (!list) return;

  const visible = [
    ...milestones.filter((milestone) => !milestone.complete),
    ...milestones.filter((milestone) => milestone.complete),
  ].slice(0, limit);

  list.replaceChildren(
    ...visible.map((milestone) => {
      const item = document.createElement("li");
      if (milestone.complete) item.classList.add("complete");

      const title = document.createElement("span");
      const progress = document.createElement("strong");
      title.textContent = milestone.title;
      progress.textContent = milestone.complete ? "Done" : milestone.progress;
      item.append(title, progress);
      return item;
    }),
  );
}

function getCooldownText(seconds: number): string {
  return seconds > 0 ? `${Math.ceil(seconds)}s` : "Ready";
}
