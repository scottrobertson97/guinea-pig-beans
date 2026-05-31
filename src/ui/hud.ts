import {
  buyFeedUpgrade,
  buyCageUpgrade,
  buyFurniture,
  buyWisdomPerk,
  canUnlockBeanRecipe,
  buyPig,
  buyRarePig,
  buyRobot,
  buyScoopUpgrade,
  fuelAutomation,
  getBeanRecipeStatus,
  prestige,
  refillHay,
  refillWater,
  respondToEvent,
  unlockBeanRecipe,
  unlockLateGameSystem,
  useAbility,
} from "../simulation/actions";
import {
  getAbilityCost,
  getAutomationFuelCost,
  getCosts,
  getFurnitureSpaceCost,
  getFurnitureSpaceUsed,
  getHabitatCapacity,
  getPigCapacity,
  getWisdomCost,
} from "../simulation/balance";
import { getAchievementViews, getQuestViews, type MilestoneView } from "../simulation/milestones";
import type { AbilityId, BeanRecipeId, FurnitureId, GameState, WisdomPerkId } from "../simulation/types";

type ButtonId =
  | "adopt-pig"
  | "better-hay"
  | "better-scoop"
  | "poop-roomba"
  | "fuel-automation"
  | "bigger-cage"
  | "rare-pig"
  | "refill-hay"
  | "refill-water"
  | "event-response"
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
  | "recipe-bean-blessing"
  | "recipe-compost-catalyst"
  | "recipe-royal-accord"
  | "hay-dimension"
  | "bean-exchange"
  | "cavy-council"
  | "squeak-choir"
  | "bean-singularity"
  | "wisdom-roomy-start"
  | "wisdom-gentle-automation"
  | "wisdom-rare-instinct"
  | "wisdom-chorus-training"
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
      "fuel-automation": getButton("fuel-automation"),
      "bigger-cage": getButton("bigger-cage"),
      "rare-pig": getButton("rare-pig"),
      "refill-hay": getButton("refill-hay"),
      "refill-water": getButton("refill-water"),
      "event-response": getButton("event-response"),
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
      "recipe-bean-blessing": getButton("recipe-bean-blessing"),
      "recipe-compost-catalyst": getButton("recipe-compost-catalyst"),
      "recipe-royal-accord": getButton("recipe-royal-accord"),
      "hay-dimension": getButton("hay-dimension"),
      "bean-exchange": getButton("bean-exchange"),
      "cavy-council": getButton("cavy-council"),
      "squeak-choir": getButton("squeak-choir"),
      "bean-singularity": getButton("bean-singularity"),
      "wisdom-roomy-start": getButton("wisdom-roomy-start"),
      "wisdom-gentle-automation": getButton("wisdom-gentle-automation"),
      "wisdom-rare-instinct": getButton("wisdom-rare-instinct"),
      "wisdom-chorus-training": getButton("wisdom-chorus-training"),
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
    this.buttons["fuel-automation"].addEventListener("click", () =>
      this.runAction(() => fuelAutomation(this.state)),
    );
    this.buttons["bigger-cage"].addEventListener("click", () =>
      this.runAction(() => buyCageUpgrade(this.state)),
    );
    this.buttons["rare-pig"].addEventListener("click", () => this.runAction(() => buyRarePig(this.state)));
    this.buttons["refill-hay"].addEventListener("click", () => this.runAction(() => refillHay(this.state)));
    this.buttons["refill-water"].addEventListener("click", () =>
      this.runAction(() => refillWater(this.state)),
    );
    this.buttons["event-response"].addEventListener("click", () =>
      this.runAction(() => respondToEvent(this.state)),
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
    this.bindRecipeButton("recipe-bean-blessing", "beanBlessing");
    this.bindRecipeButton("recipe-compost-catalyst", "compostCatalyst");
    this.bindRecipeButton("recipe-royal-accord", "royalAccord");
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
    this.bindWisdomButton("wisdom-roomy-start", "roomyStart");
    this.bindWisdomButton("wisdom-gentle-automation", "gentleAutomation");
    this.bindWisdomButton("wisdom-rare-instinct", "rareInstinct");
    this.bindWisdomButton("wisdom-chorus-training", "chorusTraining");
    this.buttons.prestige.addEventListener("click", () => this.runAction(() => prestige(this.state)));
  }

  render(): void {
    const costs = getCosts(this.state);
    const pigCapacity = getPigCapacity(this.state);
    const isAtPigCapacity = this.state.pigs.length >= pigCapacity;
    const habitatUsed = getFurnitureSpaceUsed(this.state);
    const habitatCapacity = getHabitatCapacity(this.state);
    setText("beans", Math.floor(this.state.beans).toString());
    setText("pig-count", `${this.state.pigs.length}/${pigCapacity}`);
    setText("cleanliness", `${this.state.cage.cleanliness}%`);
    setText("compost", Math.floor(this.state.compost).toString());
    setText("squeaks", Math.floor(this.state.squeaks).toString());
    setText("golden-beans", this.state.goldenBeans.toString());
    setText("cavy-wisdom", this.state.cavyWisdom.toString());
    setText("habitat-space", `${habitatUsed}/${habitatCapacity}`);
    setText("hay-value", `${Math.ceil(this.state.needs.hay)}%`);
    setText("water-value", `${Math.ceil(this.state.needs.water)}%`);
    setText("happiness-value", `${Math.ceil(this.state.cage.happiness)}%`);
    setText("objective-title", this.state.objective.title);
    setText(
      "objective-progress",
      `${Math.floor(this.state.objective.progress)}/${this.state.objective.target} - ${Math.ceil(this.state.objective.timer)}s`,
    );
    setText("combo-value", getComboText(this.state));
    setText("adopt-cost", isAtPigCapacity ? "Full - Bigger Cage" : `${costs.pig} Beans`);
    setText("feed-cost", `${costs.feed} Beans`);
    setText("scoop-cost", `${costs.scoop} Beans`);
    setText("robot-cost", this.state.robot ? "Active" : `${costs.robot} Beans`);
    setText("fuel-automation-status", getAutomationFuelText(this.state));
    setText("cage-cost", `${costs.cage} Beans - Cap ${pigCapacity + 2}`);
    setText("rare-pig-cost", isAtPigCapacity ? "Full - Bigger Cage" : `${costs.rarePig} + 1 Gold`);
    this.renderFurnitureCosts(costs.furniture);
    this.renderAbilityStatuses();
    this.renderRecipeStatuses();
    this.renderLateGameStatuses();
    this.renderWisdomStatuses();
    setText("prestige-cost", `${costs.prestige} Lifetime`);
    setText("status-line", getStatusLine(this.state));

    setMeter("hay-meter", this.state.needs.hay);
    setMeter("water-meter", this.state.needs.water);
    setMeter("happiness-meter", this.state.cage.happiness);

    this.buttons["adopt-pig"].disabled = isAtPigCapacity || this.state.beans < costs.pig;
    this.buttons["better-hay"].disabled = this.state.beans < costs.feed;
    this.buttons["better-scoop"].disabled = this.state.beans < costs.scoop;
    this.buttons["poop-roomba"].disabled = Boolean(this.state.robot) || this.state.beans < costs.robot;
    this.buttons["fuel-automation"].disabled =
      !this.state.robot || this.state.compost < getAutomationFuelCost(this.state);
    this.buttons["bigger-cage"].disabled = this.state.beans < costs.cage;
    this.buttons["rare-pig"].disabled = isAtPigCapacity || this.state.beans < costs.rarePig || this.state.goldenBeans < 1;
    this.buttons["event-response"].disabled = !this.state.event.active || !this.state.event.responseReady;
    this.updateFurnitureDisabled(costs.furniture);
    this.updateAbilityDisabled();
    this.updateRecipeDisabled();
    this.updateLateGameDisabled();
    this.updateWisdomDisabled();
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

  private bindRecipeButton(buttonId: ButtonId, recipeId: BeanRecipeId): void {
    this.buttons[buttonId].addEventListener("click", () =>
      this.runAction(() => unlockBeanRecipe(this.state, recipeId)),
    );
  }

  private bindWisdomButton(buttonId: ButtonId, wisdomId: WisdomPerkId): void {
    this.buttons[buttonId].addEventListener("click", () =>
      this.runAction(() => buyWisdomPerk(this.state, wisdomId)),
    );
  }

  private renderFurnitureCosts(costs: Record<FurnitureId, number>): void {
    setText("hidey-house-cost", `${costs.hideyHouse} Beans - ${getFurnitureSpaceCost("hideyHouse")}H`);
    setText("tunnel-cost", `${costs.tunnel} Beans - ${getFurnitureSpaceCost("tunnel")}H`);
    setText("litter-tray-cost", `${costs.litterTray} Beans - ${getFurnitureSpaceCost("litterTray")}H`);
    setText("chew-toy-cost", `${costs.chewToy} Beans - ${getFurnitureSpaceCost("chewToy")}H`);
    setText("snuggle-sack-cost", `${costs.snuggleSack} Beans - ${getFurnitureSpaceCost("snuggleSack")}H`);
    setText("cardboard-castle-cost", `${costs.cardboardCastle} Beans - ${getFurnitureSpaceCost("cardboardCastle")}H`);
    setText("royal-throne-cost", `${costs.royalThrone} Beans - ${getFurnitureSpaceCost("royalThrone")}H`);
  }

  private renderAbilityStatuses(): void {
    setText("wheek-call-status", getAbilityStatusText(this.state, "wheekCall"));
    setText("treat-bag-status", getAbilityStatusText(this.state, "treatBag"));
    setText("deep-clean-status", getAbilityStatusText(this.state, "deepClean"));
    setText("fresh-bedding-status", getAbilityStatusText(this.state, "freshBedding"));
    setText("snack-time-status", getAbilityStatusText(this.state, "snackTime"));
    setText("zoomie-mode-status", getAbilityStatusText(this.state, "zoomieMode"));
  }

  private renderRecipeStatuses(): void {
    setText("recipe-bean-blessing-status", getBeanRecipeStatus(this.state, "beanBlessing"));
    setText("recipe-compost-catalyst-status", getBeanRecipeStatus(this.state, "compostCatalyst"));
    setText("recipe-royal-accord-status", getBeanRecipeStatus(this.state, "royalAccord"));
  }

  private renderLateGameStatuses(): void {
    setText("hay-dimension-status", this.state.lateGame.hayDimension ? "Active" : "750 + 25C");
    setText("bean-exchange-status", this.state.lateGame.beanExchange ? "Active" : "1200 + 2G");
    setText("cavy-council-status", this.state.lateGame.cavyCouncil ? "Active" : "8 Pigs + 10S");
    setText("squeak-choir-status", this.state.lateGame.squeakChoir ? "Active" : "25 Squeaks");
    setText("bean-singularity-status", this.state.lateGame.beanSingularity ? "Active" : "100C + Rare");
  }

  private renderWisdomStatuses(): void {
    setText("wisdom-roomy-start-status", this.state.wisdom.roomyStart ? "Learned" : `${getWisdomCost("roomyStart")} Wisdom`);
    setText(
      "wisdom-gentle-automation-status",
      this.state.wisdom.gentleAutomation ? "Learned" : `${getWisdomCost("gentleAutomation")} Wisdom`,
    );
    setText("wisdom-rare-instinct-status", this.state.wisdom.rareInstinct ? "Learned" : `${getWisdomCost("rareInstinct")} Wisdom`);
    setText(
      "wisdom-chorus-training-status",
      this.state.wisdom.chorusTraining ? "Learned" : `${getWisdomCost("chorusTraining")} Wisdom`,
    );
  }

  private updateFurnitureDisabled(costs: Record<FurnitureId, number>): void {
    this.buttons["hidey-house"].disabled = !this.canBuyFurniture(costs, "hideyHouse");
    this.buttons.tunnel.disabled = !this.canBuyFurniture(costs, "tunnel");
    this.buttons["litter-tray"].disabled = !this.canBuyFurniture(costs, "litterTray");
    this.buttons["chew-toy"].disabled = !this.canBuyFurniture(costs, "chewToy");
    this.buttons["snuggle-sack"].disabled = !this.canBuyFurniture(costs, "snuggleSack");
    this.buttons["cardboard-castle"].disabled = !this.canBuyFurniture(costs, "cardboardCastle");
    this.buttons["royal-throne"].disabled = !this.canBuyFurniture(costs, "royalThrone");
  }

  private updateAbilityDisabled(): void {
    this.buttons["wheek-call"].disabled = !this.canUseAbility("wheekCall");
    this.buttons["treat-bag"].disabled = !this.canUseAbility("treatBag");
    this.buttons["deep-clean"].disabled = !this.canUseAbility("deepClean");
    this.buttons["fresh-bedding"].disabled = !this.canUseAbility("freshBedding");
    this.buttons["snack-time"].disabled = !this.canUseAbility("snackTime");
    this.buttons["zoomie-mode"].disabled = !this.canUseAbility("zoomieMode");
  }

  private updateRecipeDisabled(): void {
    this.buttons["recipe-bean-blessing"].disabled = !canUnlockBeanRecipe(this.state, "beanBlessing");
    this.buttons["recipe-compost-catalyst"].disabled = !canUnlockBeanRecipe(this.state, "compostCatalyst");
    this.buttons["recipe-royal-accord"].disabled = !canUnlockBeanRecipe(this.state, "royalAccord");
  }

  private updateLateGameDisabled(): void {
    this.buttons["hay-dimension"].disabled = this.state.lateGame.hayDimension || this.state.beans < 750 || this.state.compost < 25;
    this.buttons["bean-exchange"].disabled = this.state.lateGame.beanExchange || this.state.beans < 1200 || this.state.goldenBeans < 2;
    this.buttons["cavy-council"].disabled = this.state.lateGame.cavyCouncil || this.state.pigs.length < 8 || this.state.squeaks < 10;
    this.buttons["squeak-choir"].disabled = this.state.lateGame.squeakChoir || this.state.squeaks < 25;
    this.buttons["bean-singularity"].disabled =
      this.state.lateGame.beanSingularity || this.state.compost < 100 || this.state.stats.rarePoopsCleaned < 25;
  }

  private updateWisdomDisabled(): void {
    this.buttons["wisdom-roomy-start"].disabled =
      this.state.wisdom.roomyStart || this.state.cavyWisdom < getWisdomCost("roomyStart");
    this.buttons["wisdom-gentle-automation"].disabled =
      this.state.wisdom.gentleAutomation || this.state.cavyWisdom < getWisdomCost("gentleAutomation");
    this.buttons["wisdom-rare-instinct"].disabled =
      this.state.wisdom.rareInstinct || this.state.cavyWisdom < getWisdomCost("rareInstinct");
    this.buttons["wisdom-chorus-training"].disabled =
      this.state.wisdom.chorusTraining || this.state.cavyWisdom < getWisdomCost("chorusTraining");
  }

  private canBuyFurniture(costs: Record<FurnitureId, number>, id: FurnitureId): boolean {
    return (
      this.state.beans >= costs[id] &&
      getFurnitureSpaceUsed(this.state) + getFurnitureSpaceCost(id) <= getHabitatCapacity(this.state)
    );
  }

  private canUseAbility(id: AbilityId): boolean {
    return this.state.abilities[id] <= 0 && this.state.squeaks >= getAbilityCost(this.state, id);
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
  if (state.placement.pendingFurniture) return `Place ${getFurnitureName(state.placement.pendingFurniture)} in the cage.`;
  if (state.automation.overdrive > 0) return `Automation overdrive is sweeping faster for ${Math.ceil(state.automation.overdrive)}s.`;
  if (state.event.active && state.event.responseReady)
    return `${state.event.active.name} is active. Use Event to respond.`;
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

function getAutomationFuelText(state: GameState): string {
  if (!state.robot) return "Needs Roomba";
  if (state.automation.overdrive > 0) return `${Math.ceil(state.automation.overdrive)}s`;
  return `${getAutomationFuelCost(state)} Compost`;
}

function getAbilityStatusText(state: GameState, id: AbilityId): string {
  if (state.abilities[id] > 0) return getCooldownText(state.abilities[id]);
  const cost = getAbilityCost(state, id);
  return cost > 0 ? `${cost} Squeaks` : "Free";
}

function getFurnitureName(id: FurnitureId): string {
  const names: Record<FurnitureId, string> = {
    hideyHouse: "Hidey House",
    tunnel: "Tunnel",
    litterTray: "Litter Tray",
    chewToy: "Chew Toy",
    snuggleSack: "Snuggle Sack",
    cardboardCastle: "Cardboard Castle",
    royalThrone: "Royal Throne",
  };
  return names[id];
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
