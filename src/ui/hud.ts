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
  canUseEventChoice,
  getEventChoiceStatus,
  getEventChoices,
  prestige,
  refillHay,
  refillWater,
  respondToEventChoice,
  unlockBeanRecipe,
  unlockLateGameSystem,
  useAbility,
  type EventChoiceView,
} from "../simulation/actions";
import {
  getAbilityCost,
  getAutomationFuelCost,
  canBuyWisdomPerk,
  getCosts,
  getFurnitureSynergies,
  getPigCapacity,
  getPrestigeCost,
  getPrestigeProgress,
  getPrestigeWisdomGain,
  getUnlockedFurnitureCount,
  getWisdomCost,
  getWisdomPerk,
  getWisdomPerks,
  hasFurnitureSynergy,
} from "../simulation/balance";
import { getAchievementViews, getQuestViews, type MilestoneView } from "../simulation/milestones";
import { SAVE_STATUS_EVENT, type SaveStatusDetail } from "../simulation/persistence";
import { getActivePigRequestView } from "../simulation/pigRequests";
import type { AbilityId, BeanRecipeId, EventChoiceId, FurnitureId, GameState, WisdomPerkId } from "../simulation/types";
import { emitPlayerAction, emitUiSound, type PlayerActionId, type UiSoundId } from "./events";

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
  | "event-choice-a"
  | "event-choice-b"
  | "event-choice-c"
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
  | "wisdom-steady-supplies"
  | "wisdom-fresh-start"
  | "wisdom-bonded-beginnings"
  | "wisdom-social-memory"
  | "wisdom-chorus-training"
  | "wisdom-gentle-automation"
  | "wisdom-compost-engine"
  | "wisdom-tray-affinity"
  | "wisdom-rare-instinct"
  | "wisdom-golden-nose"
  | "wisdom-royal-memory"
  | "prestige";

type QuickCareButtonId = "quick-refill-hay" | "quick-refill-water" | "quick-event-response";
type EventChoiceSlotId = "event-choice-a" | "event-choice-b" | "event-choice-c";

type SectionId =
  | "care"
  | "shop"
  | "furniture"
  | "abilities"
  | "recipes"
  | "mythos"
  | "wisdom"
  | "herd"
  | "goals"
  | "log";

type SectionMeta = {
  title: string;
  icon: string;
};

type PurchaseEffectId = "hay" | "scoop" | "robot" | "cage" | "furniture-ready" | "herd" | "ability";
type HudActionEffect = PurchaseEffectId | { effect: PurchaseEffectId; abilityId?: AbilityId; furnitureId?: FurnitureId };
type HudPlayerAction = PlayerActionId | PlayerActionId[];

const HUD_ACTION_EFFECT_EVENT = "guinea-pig-action-effect";

const SECTION_META: Record<SectionId, SectionMeta> = {
  care: { title: "Care", icon: "/assets/sprites/decor/hay_rack_full.png" },
  shop: { title: "Shop", icon: "/assets/sprites/upgrades/roaming_dustpan.png" },
  furniture: { title: "Furniture", icon: "/assets/sprites/decor/toy_pile.png" },
  abilities: { title: "Abilities", icon: "/assets/sprites/beans/bean_golden.png" },
  recipes: { title: "Bean Recipes", icon: "/assets/sprites/beans/bean_rainbow.png" },
  mythos: { title: "Mythos", icon: "/assets/sprites/upgrades/compost_bin.png" },
  wisdom: { title: "Wisdom", icon: "/assets/sprites/upgrades/cavybot_3000.png" },
  herd: { title: "Herd", icon: "/assets/sprites/pigs/pig_cream_brown_idle.png" },
  goals: { title: "Goals", icon: "/assets/sprites/decor/litter_tray_clean.png" },
  log: { title: "Cage Log", icon: "/assets/sprites/beans/bean_normal.png" },
};

const SECTION_SHORTCUTS: Record<string, SectionId> = {
  "1": "care",
  "2": "shop",
  "3": "furniture",
  "4": "abilities",
  "5": "recipes",
  "6": "mythos",
  "7": "wisdom",
  "8": "herd",
  "9": "goals",
  "0": "log",
};

const WISDOM_BUTTONS: Record<WisdomPerkId, ButtonId> = {
  roomyStart: "wisdom-roomy-start",
  steadySupplies: "wisdom-steady-supplies",
  freshStart: "wisdom-fresh-start",
  bondedBeginnings: "wisdom-bonded-beginnings",
  socialMemory: "wisdom-social-memory",
  chorusTraining: "wisdom-chorus-training",
  gentleAutomation: "wisdom-gentle-automation",
  compostEngine: "wisdom-compost-engine",
  trayAffinity: "wisdom-tray-affinity",
  rareInstinct: "wisdom-rare-instinct",
  goldenNose: "wisdom-golden-nose",
  royalMemory: "wisdom-royal-memory",
};

export class Hud {
  private buttons: Record<ButtonId, HTMLButtonElement>;
  private quickButtons: Record<QuickCareButtonId, HTMLButtonElement>;
  private eventChoiceButtons: Record<EventChoiceSlotId, HTMLButtonElement>;
  private eventChoicePanel: HTMLElement;
  private eventChoiceTitle: HTMLElement;
  private eventChoiceSummary: HTMLElement;
  private launchers: Record<SectionId, HTMLButtonElement>;
  private badges: Record<SectionId, HTMLElement>;
  private modal: HTMLDialogElement;
  private modalTitle: HTMLElement;
  private modalIcon: HTMLImageElement;
  private modalCloseButton: HTMLButtonElement;
  private resetRunButton: HTMLButtonElement;
  private saveStatus: HTMLElement;
  private panels: Record<SectionId, HTMLElement>;
  private activeSection: SectionId | null = null;
  private activeLauncher: HTMLButtonElement | null = null;
  private previousComboCount = 0;
  private previousGoalSignature: string | null = null;
  private previousLogSignature: string | null = null;
  private hasGoalUpdate = false;
  private hasUnreadLog = false;
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (isEditableTarget(event.target)) return;

    const section = SECTION_SHORTCUTS[event.key];
    if (!section) return;

    event.preventDefault();
    this.openSection(section, this.launchers[section]);
  };
  private readonly handleSaveStatus = (event: Event): void => {
    const detail = (event as CustomEvent<SaveStatusDetail>).detail;
    if (detail) this.renderSaveStatus(detail);
  };

  constructor(
    private readonly state: GameState,
    private readonly onAction: () => void,
    private readonly onResetRun: () => void,
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
      "event-choice-a": getButton("event-choice-a"),
      "event-choice-b": getButton("event-choice-b"),
      "event-choice-c": getButton("event-choice-c"),
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
      "wisdom-steady-supplies": getButton("wisdom-steady-supplies"),
      "wisdom-fresh-start": getButton("wisdom-fresh-start"),
      "wisdom-bonded-beginnings": getButton("wisdom-bonded-beginnings"),
      "wisdom-social-memory": getButton("wisdom-social-memory"),
      "wisdom-chorus-training": getButton("wisdom-chorus-training"),
      "wisdom-gentle-automation": getButton("wisdom-gentle-automation"),
      "wisdom-compost-engine": getButton("wisdom-compost-engine"),
      "wisdom-tray-affinity": getButton("wisdom-tray-affinity"),
      "wisdom-rare-instinct": getButton("wisdom-rare-instinct"),
      "wisdom-golden-nose": getButton("wisdom-golden-nose"),
      "wisdom-royal-memory": getButton("wisdom-royal-memory"),
      prestige: getButton("prestige"),
    };

    this.quickButtons = {
      "quick-refill-hay": getButton("quick-refill-hay"),
      "quick-refill-water": getButton("quick-refill-water"),
      "quick-event-response": getButton("quick-event-response"),
    };
    this.eventChoiceButtons = {
      "event-choice-a": this.buttons["event-choice-a"],
      "event-choice-b": this.buttons["event-choice-b"],
      "event-choice-c": this.buttons["event-choice-c"],
    };
    this.eventChoicePanel = getElement("event-choice-panel");
    this.eventChoiceTitle = getElement("event-choice-title");
    this.eventChoiceSummary = getElement("event-choice-summary");

    this.launchers = {
      care: getButton("open-care"),
      shop: getButton("open-shop"),
      furniture: getButton("open-furniture"),
      abilities: getButton("open-abilities"),
      recipes: getButton("open-recipes"),
      mythos: getButton("open-mythos"),
      wisdom: getButton("open-wisdom"),
      herd: getButton("open-herd"),
      goals: getButton("open-goals"),
      log: getButton("open-log"),
    };
    this.badges = {
      care: getBadge("care"),
      shop: getBadge("shop"),
      furniture: getBadge("furniture"),
      abilities: getBadge("abilities"),
      recipes: getBadge("recipes"),
      mythos: getBadge("mythos"),
      wisdom: getBadge("wisdom"),
      herd: getBadge("herd"),
      goals: getBadge("goals"),
      log: getBadge("log"),
    };
    this.modal = getDialog("section-modal");
    this.modalTitle = getElement("section-modal-title");
    this.modalIcon = getImage("section-modal-icon");
    this.modalCloseButton = getButton("close-section-modal");
    this.resetRunButton = getButton("reset-run");
    this.saveStatus = getElement("save-status");
    this.panels = {
      care: getPanel("care"),
      shop: getPanel("shop"),
      furniture: getPanel("furniture"),
      abilities: getPanel("abilities"),
      recipes: getPanel("recipes"),
      mythos: getPanel("mythos"),
      wisdom: getPanel("wisdom"),
      herd: getPanel("herd"),
      goals: getPanel("goals"),
      log: getPanel("log"),
    };
    for (const launcher of Object.values(this.launchers)) {
      launcher.setAttribute("aria-pressed", "false");
    }

    this.buttons["adopt-pig"].addEventListener("click", () =>
      this.runAction(() => buyPig(this.state), this.buttons["adopt-pig"], "herd", "purchase", "purchase"),
    );
    this.buttons["better-hay"].addEventListener("click", () =>
      this.runAction(
        () => buyFeedUpgrade(this.state),
        this.buttons["better-hay"],
        "hay",
        ["purchase", "buyFirstUpgrade"],
        "purchase",
      ),
    );
    this.buttons["better-scoop"].addEventListener("click", () =>
      this.runAction(
        () => buyScoopUpgrade(this.state),
        this.buttons["better-scoop"],
        "scoop",
        ["purchase", "buyFirstUpgrade"],
        "purchase",
      ),
    );
    this.buttons["poop-roomba"].addEventListener("click", () =>
      this.runAction(() => buyRobot(this.state), this.buttons["poop-roomba"], "robot", "purchase", "purchase"),
    );
    this.buttons["fuel-automation"].addEventListener("click", () =>
      this.runAction(() => fuelAutomation(this.state), this.buttons["fuel-automation"], "robot", "purchase", "purchase"),
    );
    this.buttons["bigger-cage"].addEventListener("click", () =>
      this.runAction(() => buyCageUpgrade(this.state), this.buttons["bigger-cage"], "cage", "purchase", "purchase"),
    );
    this.buttons["rare-pig"].addEventListener("click", () =>
      this.runAction(() => buyRarePig(this.state), this.buttons["rare-pig"], "herd", "purchase", "purchase"),
    );
    this.buttons["refill-hay"].addEventListener("click", () =>
      this.runAction(() => refillHay(this.state), this.buttons["refill-hay"], undefined, "refillCare"),
    );
    this.quickButtons["quick-refill-hay"].addEventListener("click", () =>
      this.runAction(() => refillHay(this.state), this.quickButtons["quick-refill-hay"], undefined, "refillCare"),
    );
    this.buttons["refill-water"].addEventListener("click", () =>
      this.runAction(() => refillWater(this.state), this.buttons["refill-water"], undefined, "refillCare"),
    );
    this.quickButtons["quick-refill-water"].addEventListener("click", () =>
      this.runAction(() => refillWater(this.state), this.quickButtons["quick-refill-water"], undefined, "refillCare"),
    );
    this.buttons["event-response"].addEventListener("click", () =>
      this.focusFirstEventChoice(),
    );
    this.quickButtons["quick-event-response"].addEventListener("click", () =>
      this.openSection("care", this.launchers.care),
    );
    for (const button of Object.values(this.eventChoiceButtons)) {
      button.addEventListener("click", () => this.runEventChoice(button));
    }
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
      this.runAction(
        () => unlockLateGameSystem(this.state, "hayDimension"),
        this.buttons["hay-dimension"],
        undefined,
        "purchase",
        "purchase",
      ),
    );
    this.buttons["bean-exchange"].addEventListener("click", () =>
      this.runAction(
        () => unlockLateGameSystem(this.state, "beanExchange"),
        this.buttons["bean-exchange"],
        undefined,
        "purchase",
        "purchase",
      ),
    );
    this.buttons["cavy-council"].addEventListener("click", () =>
      this.runAction(
        () => unlockLateGameSystem(this.state, "cavyCouncil"),
        this.buttons["cavy-council"],
        undefined,
        "purchase",
        "purchase",
      ),
    );
    this.buttons["squeak-choir"].addEventListener("click", () =>
      this.runAction(
        () => unlockLateGameSystem(this.state, "squeakChoir"),
        this.buttons["squeak-choir"],
        undefined,
        "purchase",
        "purchase",
      ),
    );
    this.buttons["bean-singularity"].addEventListener("click", () =>
      this.runAction(
        () => unlockLateGameSystem(this.state, "beanSingularity"),
        this.buttons["bean-singularity"],
        undefined,
        "purchase",
        "purchase",
      ),
    );
    for (const [wisdomId, buttonId] of Object.entries(WISDOM_BUTTONS) as [WisdomPerkId, ButtonId][]) {
      this.bindWisdomButton(buttonId, wisdomId);
    }
    this.buttons.prestige.addEventListener("click", () =>
      this.runAction(() => prestige(this.state), this.buttons.prestige, undefined, "purchase", "purchase"),
    );
    this.resetRunButton.addEventListener("click", () => this.resetRun());

    for (const [section, launcher] of Object.entries(this.launchers) as [SectionId, HTMLButtonElement][]) {
      launcher.addEventListener("click", () => this.openSection(section, launcher));
    }
    this.modalCloseButton.addEventListener("click", () => this.closeModal());
    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) this.closeModal();
    });
    this.modal.addEventListener("close", () => this.onModalClosed());
    document.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener(SAVE_STATUS_EVENT, this.handleSaveStatus);
  }

  render(): void {
    const costs = getCosts(this.state);
    const pigCapacity = getPigCapacity(this.state);
    const isAtPigCapacity = this.state.pigs.length >= pigCapacity;
    const furnitureUnlocked = getUnlockedFurnitureCount(this.state);
    setText("beans", Math.floor(this.state.beans).toString());
    setText("pig-count", `${this.state.pigs.length}/${pigCapacity}`);
    setText("cleanliness", `${this.state.cage.cleanliness}%`);
    setText("compost", Math.floor(this.state.compost).toString());
    setText("squeaks", Math.floor(this.state.squeaks).toString());
    setText("golden-beans", this.state.goldenBeans.toString());
    setText("cavy-wisdom", this.state.cavyWisdom.toString());
    setText("habitat-space", `${furnitureUnlocked}/7`);
    setText("hay-value", `${Math.ceil(this.state.needs.hay)}%`);
    setText("quick-hay-value", `${Math.ceil(this.state.needs.hay)}%`);
    setText("water-value", `${Math.ceil(this.state.needs.water)}%`);
    setText("quick-water-value", `${Math.ceil(this.state.needs.water)}%`);
    setText("happiness-value", `${Math.ceil(this.state.cage.happiness)}%`);
    setText("quick-happiness-value", `${Math.ceil(this.state.cage.happiness)}%`);
    setText("objective-title", this.state.objective.title);
    setText("quick-objective-title", this.state.objective.title);
    setText(
      "objective-progress",
      `${Math.floor(this.state.objective.progress)}/${this.state.objective.target} - ${Math.ceil(this.state.objective.timer)}s`,
    );
    setText(
      "quick-objective-progress",
      `${Math.floor(this.state.objective.progress)}/${this.state.objective.target} - ${Math.ceil(this.state.objective.timer)}s`,
    );
    setText("combo-value", getComboText(this.state));
    this.updateComboPulse();
    setText("adopt-cost", getAdoptPigStatusText(this.state, costs.pig, pigCapacity));
    setText("feed-cost", getBeanCostStatusText(this.state, costs.feed, `${costs.feed} Beans`));
    setText("scoop-cost", getBeanCostStatusText(this.state, costs.scoop, `${costs.scoop} Beans`));
    setText("robot-cost", getRobotStatusText(this.state, costs.robot));
    setText("fuel-automation-status", getAutomationFuelText(this.state));
    setText("cage-cost", getBiggerCageStatusText(this.state, costs.cage, pigCapacity));
    setText("rare-pig-cost", getRarePigStatusText(this.state, costs.rarePig, pigCapacity));
    this.renderFurnitureCosts(costs.furniture);
    this.renderFurnitureSynergies();
    this.renderAbilityStatuses();
    this.renderRecipeStatuses();
    this.renderLateGameStatuses();
    this.renderWisdomStatuses();
    this.renderEventChoices();
    this.renderPigRequest();
    setText("prestige-cost", getPrestigeStatusText(this.state));
    setText("status-line", getStatusLine(this.state));

    setMeter("hay-meter", this.state.needs.hay);
    setMeter("quick-hay-meter", this.state.needs.hay);
    setMeter("water-meter", this.state.needs.water);
    setMeter("quick-water-meter", this.state.needs.water);
    setMeter("happiness-meter", this.state.cage.happiness);
    setMeter("quick-happiness-meter", this.state.cage.happiness);

    this.buttons["adopt-pig"].disabled = isAtPigCapacity || this.state.beans < costs.pig;
    this.buttons["better-hay"].disabled = this.state.beans < costs.feed;
    this.buttons["better-scoop"].disabled = this.state.beans < costs.scoop;
    this.buttons["poop-roomba"].disabled = Boolean(this.state.robot) || this.state.beans < costs.robot;
    this.buttons["fuel-automation"].disabled =
      !this.state.robot || this.state.compost < getAutomationFuelCost(this.state);
    this.buttons["bigger-cage"].disabled = this.state.beans < costs.cage;
    this.buttons["rare-pig"].disabled = isAtPigCapacity || this.state.beans < costs.rarePig || this.state.goldenBeans < 1;
    this.buttons["event-response"].disabled = !this.state.event.active || !this.state.event.responseReady;
    this.quickButtons["quick-event-response"].disabled = this.buttons["event-response"].disabled;
    this.updateEventChoiceDisabled();
    this.updateFurnitureDisabled(costs.furniture);
    this.updateAbilityDisabled();
    this.updateRecipeDisabled();
    this.updateLateGameDisabled();
    this.updateWisdomDisabled();
    this.buttons.prestige.disabled = getPrestigeProgress(this.state) < costs.prestige;
    this.updateAvailableNowStyles();
    this.updateSectionIndicators();

    const log = document.querySelector<HTMLOListElement>("#event-log");
    if (log) {
      log.replaceChildren(
        ...(this.state.log.length > 0
          ? this.state.log.map((message) => {
              const item = document.createElement("li");
              item.textContent = message;
              return item;
            })
          : [createEmptyStateItem("The cage log is quiet. The bedding is enjoying the suspense.")]),
      );
    }

    const roster = document.querySelector<HTMLUListElement>("#pig-roster");
    if (roster) {
      const rosterItems = this.state.pigs.map((pig) => {
        const item = document.createElement("li");
        const identity = document.createElement("strong");
        const details = document.createElement("span");
        identity.textContent = pig.name;
        details.textContent = `${pig.breed} ${pig.trait} - ${pig.quirk}`;
        item.append(identity, details);
        return item;
      });
      if (this.state.pigs.length <= 2 && this.state.stats.pigsAdopted <= 2) {
        rosterItems.push(createEmptyStateItem("Bonded pair settled in. More room means more wheeks later."));
      }
      roster.replaceChildren(...rosterItems);
    }

    renderMilestoneList(
      "quest-list",
      getQuestViews(this.state),
      4,
      "No open quests right now. Keep the cage cozy and clean.",
      "Visible quests are handled. New cage ambitions unlock as the herd grows.",
    );
    renderMilestoneList(
      "achievement-list",
      getAchievementViews(this.state),
      3,
      "No achievements yet. The first bean usually starts it.",
      "Visible achievements are handled. The cage is quietly impressed.",
    );
  }

  private runAction(
    action: () => boolean | void,
    source?: HTMLButtonElement,
    effect?: HudActionEffect,
    playerAction?: HudPlayerAction,
    sound?: UiSoundId,
  ): void {
    const result = action();
    this.onAction();
    this.render();
    if (result === false) return;

    if (playerAction) {
      const actions = Array.isArray(playerAction) ? playerAction : [playerAction];
      for (const actionId of actions) {
        emitPlayerAction(actionId);
      }
    }
    if (sound) emitUiSound(sound);
    if (!source) return;

    this.playActionSuccess(source, effect);
  }

  private runEventChoice(source: HTMLButtonElement): void {
    const choiceId = source.dataset.eventChoiceId as EventChoiceId | undefined;
    if (!choiceId) return;
    this.runAction(
      () => respondToEventChoice(this.state, choiceId),
      source,
      undefined,
      "eventResponse",
      "event",
    );
  }

  private focusFirstEventChoice(): void {
    if (!this.state.event.active || !this.state.event.responseReady) return;
    this.openSection("care", this.launchers.care);
    const choice = Object.values(this.eventChoiceButtons).find((button) => !button.hidden && !button.disabled);
    choice?.focus();
  }

  private resetRun(): void {
    const confirmed = window.confirm("Reset this run and clear saved progress?");
    if (!confirmed) return;
    emitUiSound("button");
    this.onResetRun();
  }

  private renderSaveStatus(detail: SaveStatusDetail): void {
    this.saveStatus.hidden = false;
    if (detail.status === "saving") {
      this.saveStatus.textContent = "Saving...";
      return;
    }
    if (detail.status === "saved") {
      this.saveStatus.textContent = "Saved";
      return;
    }
    if (detail.status === "unavailable") {
      this.saveStatus.textContent = "Save unavailable";
      return;
    }
    this.saveStatus.hidden = true;
  }

  private playActionSuccess(source: HTMLButtonElement, effect?: HudActionEffect): void {
    const token = performance.now().toString();
    const clearSuccess = (): void => {
      if (source.dataset.actionSuccessToken !== token) return;
      source.classList.remove("action-success");
      delete source.dataset.actionSuccessToken;
    };

    source.dataset.actionSuccessToken = token;
    source.classList.remove("action-success");
    void source.offsetWidth;
    source.classList.add("action-success");
    source.addEventListener("animationend", clearSuccess, { once: true });
    window.setTimeout(clearSuccess, 680);

    if (effect) {
      const detail = typeof effect === "string" ? { effect } : effect;
      window.dispatchEvent(new CustomEvent(HUD_ACTION_EFFECT_EVENT, { detail }));
    }
  }

  private openSection(section: SectionId, launcher: HTMLButtonElement): void {
    const wasOpen = this.modal.open;
    this.activeSection = section;
    this.activeLauncher = launcher;
    const meta = SECTION_META[section];
    this.modalTitle.textContent = meta.title;
    this.modalIcon.src = meta.icon;
    this.modalIcon.alt = "";

    for (const [panelSection, panel] of Object.entries(this.panels) as [SectionId, HTMLElement][]) {
      panel.hidden = panelSection !== section;
    }

    for (const [launcherSection, sectionLauncher] of Object.entries(this.launchers) as [SectionId, HTMLButtonElement][]) {
      sectionLauncher.setAttribute("aria-pressed", String(launcherSection === section));
    }

    if (!this.modal.open) {
      this.modal.showModal();
    }
    emitUiSound(wasOpen ? "button" : "modalOpen");
    if (section === "shop") emitPlayerAction("openShop");

    if (section === "goals") {
      this.hasGoalUpdate = false;
      this.previousGoalSignature = getGoalSignature(this.state);
    }
    if (section === "log") {
      this.hasUnreadLog = false;
      this.previousLogSignature = getLogSignature(this.state);
    }
    this.updateSectionIndicators();
    this.modalCloseButton.focus();
  }

  private closeModal(): void {
    if (this.modal.open) {
      this.modal.close();
    }
  }

  private onModalClosed(): void {
    if (this.activeSection) emitUiSound("modalClose");
    this.activeSection = null;
    for (const launcher of Object.values(this.launchers)) {
      launcher.setAttribute("aria-pressed", "false");
    }

    const launcher = this.activeLauncher;
    this.activeLauncher = null;
    launcher?.focus();
  }

  private updateComboPulse(): void {
    const comboCount = this.state.combo.timer > 0 ? this.state.combo.count : 0;
    if (comboCount > this.previousComboCount && comboCount > 1) {
      pulseElement("combo-value", "stat-pulse");
    }
    this.previousComboCount = comboCount;
  }

  private updateSectionIndicators(): void {
    this.updateGoalAndLogMarkers();

    const eventReady = Boolean(this.state.event.active && this.state.event.responseReady);
    const requestReady = Boolean(this.state.pigRequest?.active);
    const careNeedsAttention = eventReady || requestReady || this.state.needs.hay < 25 || this.state.needs.water < 25;
    const careLowCount = Number(this.state.needs.hay < 25) + Number(this.state.needs.water < 25);
    this.setAttention(this.buttons["event-response"], eventReady);
    this.setAttention(this.quickButtons["quick-event-response"], eventReady);
    this.launchers.care.classList.toggle("dock-alert", careNeedsAttention);

    this.setBadge("care", eventReady || requestReady ? "!" : careLowCount > 0 ? careLowCount.toString() : "");
    this.setBadge("shop", countEnabled(this.buttons, [
      "adopt-pig",
      "better-hay",
      "better-scoop",
      "poop-roomba",
      "fuel-automation",
      "bigger-cage",
      "rare-pig",
    ]));
    this.setBadge("furniture", countEnabled(this.buttons, [
      "hidey-house",
      "tunnel",
      "litter-tray",
      "chew-toy",
      "snuggle-sack",
      "cardboard-castle",
      "royal-throne",
    ]));
    this.setBadge("abilities", countEnabled(this.buttons, [
      "wheek-call",
      "treat-bag",
      "deep-clean",
      "fresh-bedding",
      "snack-time",
      "zoomie-mode",
    ]));
    this.setBadge("recipes", countEnabled(this.buttons, [
      "recipe-bean-blessing",
      "recipe-compost-catalyst",
      "recipe-royal-accord",
    ]));
    this.setBadge("mythos", countEnabled(this.buttons, [
      "hay-dimension",
      "bean-exchange",
      "cavy-council",
      "squeak-choir",
      "bean-singularity",
      "prestige",
    ]));
    this.setBadge("wisdom", countEnabled(this.buttons, [
      "wisdom-roomy-start",
      "wisdom-steady-supplies",
      "wisdom-fresh-start",
      "wisdom-bonded-beginnings",
      "wisdom-social-memory",
      "wisdom-chorus-training",
      "wisdom-gentle-automation",
      "wisdom-compost-engine",
      "wisdom-tray-affinity",
      "wisdom-rare-instinct",
      "wisdom-golden-nose",
      "wisdom-royal-memory",
    ]));
    this.setBadge("herd", "");
    this.setBadge("goals", this.hasGoalUpdate ? "!" : "");
    this.setBadge("log", this.hasUnreadLog ? "!" : "");
  }

  private updateGoalAndLogMarkers(): void {
    const goalSignature = getGoalSignature(this.state);
    if (this.previousGoalSignature === null) {
      this.previousGoalSignature = goalSignature;
    } else if (goalSignature !== this.previousGoalSignature) {
      this.hasGoalUpdate = this.activeSection !== "goals";
      this.previousGoalSignature = goalSignature;
    }
    if (this.activeSection === "goals") this.hasGoalUpdate = false;

    const logSignature = getLogSignature(this.state);
    if (this.previousLogSignature === null) {
      this.previousLogSignature = logSignature;
    } else if (logSignature !== this.previousLogSignature) {
      this.hasUnreadLog = this.activeSection !== "log";
      this.previousLogSignature = logSignature;
    }
    if (this.activeSection === "log") this.hasUnreadLog = false;
  }

  private setBadge(section: SectionId, value: number | string): void {
    const badge = this.badges[section];
    const text = typeof value === "number" ? (value > 0 ? value.toString() : "") : value;
    badge.textContent = text;
    badge.hidden = text.length === 0;
  }

  private setAttention(button: HTMLButtonElement, active: boolean): void {
    button.classList.toggle("attention", active);
  }

  private updateAvailableNowStyles(): void {
    for (const button of Object.values(this.buttons)) {
      button.classList.toggle("available-now", !button.disabled);
    }
  }

  private bindFurnitureButton(buttonId: ButtonId, furnitureId: FurnitureId): void {
    this.buttons[buttonId].addEventListener("click", () =>
      this.runAction(
        () => buyFurniture(this.state, furnitureId),
        this.buttons[buttonId],
        { effect: "furniture-ready", furnitureId },
        "purchase",
        "purchase",
      ),
    );
  }

  private bindAbilityButton(buttonId: ButtonId, abilityId: AbilityId): void {
    this.buttons[buttonId].addEventListener("click", () =>
      this.runAction(
        () => useAbility(this.state, abilityId),
        this.buttons[buttonId],
        { effect: "ability", abilityId },
        "useAbility",
        "ability",
      ),
    );
  }

  private bindRecipeButton(buttonId: ButtonId, recipeId: BeanRecipeId): void {
    this.buttons[buttonId].addEventListener("click", () =>
      this.runAction(
        () => unlockBeanRecipe(this.state, recipeId),
        this.buttons[buttonId],
        undefined,
        "purchase",
        "purchase",
      ),
    );
  }

  private bindWisdomButton(buttonId: ButtonId, wisdomId: WisdomPerkId): void {
    this.buttons[buttonId].addEventListener("click", () =>
      this.runAction(
        () => buyWisdomPerk(this.state, wisdomId),
        this.buttons[buttonId],
        undefined,
        "purchase",
        "purchase",
      ),
    );
  }

  private renderFurnitureCosts(costs: Record<FurnitureId, number>): void {
    setText("hidey-house-cost", getFurnitureStatusText(this.state, costs, "hideyHouse"));
    setText("tunnel-cost", getFurnitureStatusText(this.state, costs, "tunnel"));
    setText("litter-tray-cost", getFurnitureStatusText(this.state, costs, "litterTray"));
    setText("chew-toy-cost", getFurnitureStatusText(this.state, costs, "chewToy"));
    setText("snuggle-sack-cost", getFurnitureStatusText(this.state, costs, "snuggleSack"));
    setText("cardboard-castle-cost", getFurnitureStatusText(this.state, costs, "cardboardCastle"));
    setText("royal-throne-cost", getFurnitureStatusText(this.state, costs, "royalThrone"));
  }

  private renderFurnitureSynergies(): void {
    const list = document.querySelector<HTMLUListElement>("#furniture-synergy-list");
    if (!list) return;

    const items = getFurnitureSynergies().map((synergy) => {
      const active = hasFurnitureSynergy(this.state, synergy.id);
      const missing = synergy.furniture.filter((furnitureId) => !this.state.furniture[furnitureId]);
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

  private renderAbilityStatuses(): void {
    setText("wheek-call-status", getAbilityStatusText(this.state, "wheekCall"));
    setText("treat-bag-status", getAbilityStatusText(this.state, "treatBag"));
    setText("deep-clean-status", getAbilityStatusText(this.state, "deepClean"));
    setText("fresh-bedding-status", getAbilityStatusText(this.state, "freshBedding"));
    setText("snack-time-status", getAbilityStatusText(this.state, "snackTime"));
    setText("zoomie-mode-status", getAbilityStatusText(this.state, "zoomieMode"));
  }

  private renderRecipeStatuses(): void {
    setText("recipe-bean-blessing-status", getRecipeStatusText(this.state, "beanBlessing"));
    setText("recipe-compost-catalyst-status", getRecipeStatusText(this.state, "compostCatalyst"));
    setText("recipe-royal-accord-status", getRecipeStatusText(this.state, "royalAccord"));
  }

  private renderLateGameStatuses(): void {
    setText("hay-dimension-status", getLateGameStatusText(this.state, "hayDimension"));
    setText("bean-exchange-status", getLateGameStatusText(this.state, "beanExchange"));
    setText("cavy-council-status", getLateGameStatusText(this.state, "cavyCouncil"));
    setText("squeak-choir-status", getLateGameStatusText(this.state, "squeakChoir"));
    setText("bean-singularity-status", getLateGameStatusText(this.state, "beanSingularity"));
  }

  private renderWisdomStatuses(): void {
    for (const perk of getWisdomPerks()) {
      setText(`${WISDOM_BUTTONS[perk.id]}-status`, getWisdomStatusText(this.state, perk.id));
    }
  }

  private renderEventChoices(): void {
    const choices = getEventChoices(this.state);
    const event = this.state.event.active;
    const visible = Boolean(event && this.state.event.responseReady && choices.length > 0);
    this.eventChoicePanel.hidden = !visible;
    if (!visible || !event) {
      for (const button of Object.values(this.eventChoiceButtons)) {
        button.hidden = true;
        button.disabled = true;
        delete button.dataset.eventChoiceId;
      }
      return;
    }

    this.eventChoiceTitle.textContent = event.name;
    this.eventChoiceSummary.textContent = `${Math.ceil(event.timer)}s remaining. Pick one response.`;

    const slots = Object.entries(this.eventChoiceButtons) as [EventChoiceSlotId, HTMLButtonElement][];
    for (let index = 0; index < slots.length; index += 1) {
      const [, button] = slots[index];
      const choice = choices[index];
      if (!choice) {
        button.hidden = true;
        button.disabled = true;
        delete button.dataset.eventChoiceId;
        continue;
      }
      this.renderEventChoiceButton(button, choice);
    }
  }

  private renderEventChoiceButton(button: HTMLButtonElement, choice: EventChoiceView): void {
    const title = button.querySelector("span");
    const status = button.querySelector("strong");
    const description = button.querySelector("em");
    const reason = getEventChoiceStatus(this.state, choice.id);
    button.hidden = false;
    button.dataset.eventChoiceId = choice.id;
    if (title) title.textContent = choice.label;
    if (status) status.textContent = reason || "Choose";
    if (description) description.textContent = choice.description;
  }

  private renderPigRequest(): void {
    const panel = document.getElementById("pig-request-panel");
    if (!panel) return;

    const request = getActivePigRequestView(this.state);
    panel.hidden = !request;
    if (!request) return;

    setText("pig-request-title", `${request.pigName}: ${request.title}`);
    setText("pig-request-description", request.description);
    setText("pig-request-progress", `${request.progress} - ${request.timer}`);
    setText("pig-request-reward", request.rewardText);
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

  private updateEventChoiceDisabled(): void {
    for (const button of Object.values(this.eventChoiceButtons)) {
      const choiceId = button.dataset.eventChoiceId as EventChoiceId | undefined;
      button.disabled = !choiceId || !canUseEventChoice(this.state, choiceId);
    }
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
    for (const perk of getWisdomPerks()) {
      this.buttons[WISDOM_BUTTONS[perk.id]].disabled = !canBuyWisdomPerk(this.state, perk.id);
    }
  }

  private canBuyFurniture(costs: Record<FurnitureId, number>, id: FurnitureId): boolean {
    return !this.state.furniture[id] && this.state.beans >= costs[id];
  }

  private canUseAbility(id: AbilityId): boolean {
    return this.state.abilities[id] <= 0 && this.state.squeaks >= getAbilityCost(this.state, id);
  }
}

function getButton(id: string): HTMLButtonElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Missing button #${id}`);
  }
  return element;
}

function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element;
}

function getDialog(id: string): HTMLDialogElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLDialogElement)) {
    throw new Error(`Missing dialog #${id}`);
  }
  return element;
}

function getImage(id: string): HTMLImageElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLImageElement)) {
    throw new Error(`Missing image #${id}`);
  }
  return element;
}

function getPanel(section: SectionId): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-section-panel="${section}"]`);
  if (!element) {
    throw new Error(`Missing modal panel for ${section}`);
  }
  return element;
}

function getBadge(section: SectionId): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-dock-badge="${section}"]`);
  if (!element) {
    throw new Error(`Missing dock badge for ${section}`);
  }
  return element;
}

function countEnabled(buttons: Record<ButtonId, HTMLButtonElement>, ids: ButtonId[]): number {
  return ids.reduce((total, id) => total + Number(!buttons[id].disabled), 0);
}

function pulseElement(id: string, className: string): void {
  const element = document.getElementById(id);
  if (!element) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    target.isContentEditable ||
    Boolean(target.closest("[contenteditable='true']"))
  );
}

function getGoalSignature(state: GameState): string {
  return [
    state.objective.id,
    Math.floor(state.objective.progress),
    state.objective.target,
    state.stats.objectivesCompleted,
    state.milestones.quests.join(","),
    state.milestones.achievements.join(","),
  ].join("|");
}

function getLogSignature(state: GameState): string {
  return state.log.join("|");
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
  if (state.automation.overdrive > 0) return `Automation overdrive is sweeping faster for ${Math.ceil(state.automation.overdrive)}s.`;
  if (state.event.active && state.event.responseReady)
    return `${state.event.active.name} is active. Use Event to choose a response.`;
  if (state.event.active) return `${state.event.active.name} is active for ${Math.ceil(state.event.active.timer)}s.`;
  const request = getActivePigRequestView(state);
  if (request) return `${request.pigName} has a request: ${request.title}.`;
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
  if (state.automation.overdrive > 0) return `${Math.ceil(state.automation.overdrive)}s active`;
  const cost = getAutomationFuelCost(state);
  if (state.compost < cost) return formatNeed(state.compost, cost, "Compost", "Compost");
  return `Fuel ${cost} Compost`;
}

function getAbilityStatusText(state: GameState, id: AbilityId): string {
  if (state.abilities[id] > 0) return `Cooldown ${getCooldownText(state.abilities[id])}`;
  const cost = getAbilityCost(state, id);
  if (state.squeaks < cost) return formatNeed(state.squeaks, cost, "Squeak");
  return cost > 0 ? `Use ${cost} Squeaks` : "Ready";
}

function getAdoptPigStatusText(state: GameState, cost: number, capacity: number): string {
  if (state.pigs.length >= capacity) return "Full - buy cage";
  return getBeanCostStatusText(state, cost, `${cost} Beans`);
}

function getBiggerCageStatusText(state: GameState, cost: number, capacity: number): string {
  return getBeanCostStatusText(state, cost, `${cost} Beans - Cap ${capacity + 2}`);
}

function getRarePigStatusText(state: GameState, cost: number, capacity: number): string {
  if (state.pigs.length >= capacity) return "Full - buy cage";
  if (state.beans < cost) return formatNeed(state.beans, cost, "Bean");
  if (state.goldenBeans < 1) return formatNeed(state.goldenBeans, 1, "Golden Bean");
  return `${cost} Beans + 1 Gold`;
}

function getRobotStatusText(state: GameState, cost: number): string {
  if (state.robot) return "Active";
  return getBeanCostStatusText(state, cost, `${cost} Beans`);
}

function getBeanCostStatusText(state: GameState, cost: number, readyText: string): string {
  if (state.beans < cost) return formatNeed(state.beans, cost, "Bean");
  return readyText;
}

function getFurnitureStatusText(state: GameState, costs: Record<FurnitureId, number>, id: FurnitureId): string {
  if (state.furniture[id]) return "Unlocked";
  if (state.beans < costs[id]) return formatNeed(state.beans, costs[id], "Bean");
  return `${costs[id]} Beans`;
}

function getRecipeStatusText(state: GameState, id: BeanRecipeId): string {
  if (state.recipes[id]) return "Active";
  if (id === "beanBlessing") {
    if (state.goldenBeans < 2) return formatNeed(state.goldenBeans, 2, "Golden Bean");
    if (state.squeaks < 8) return formatNeed(state.squeaks, 8, "Squeak");
    if (state.stats.blessedCleaned < 1) return "Clean Blessed";
    return "Unlock";
  }
  if (id === "compostCatalyst") {
    if (state.compost < 40) return formatNeed(state.compost, 40, "Compost", "Compost");
    if (state.stats.compostCleaned < 3) return `Clean ${3 - state.stats.compostCleaned} Compost`;
    if (state.stats.stinkyCleaned < 2) return `Clean ${2 - state.stats.stinkyCleaned} Stinky`;
    return "Unlock";
  }
  if (state.goldenBeans < 1) return formatNeed(state.goldenBeans, 1, "Golden Bean");
  if (state.squeaks < 16) return formatNeed(state.squeaks, 16, "Squeak");
  if (state.stats.royalCleaned < 1 && state.stats.legendaryPigsAdopted < 1) return "Clean Royal";
  return "Unlock";
}

function getLateGameStatusText(state: GameState, id: keyof GameState["lateGame"]): string {
  if (state.lateGame[id]) return "Active";
  if (id === "hayDimension") {
    if (state.beans < 750) return formatNeed(state.beans, 750, "Bean");
    if (state.compost < 25) return formatNeed(state.compost, 25, "Compost", "Compost");
    return "Unlock";
  }
  if (id === "beanExchange") {
    if (state.beans < 1200) return formatNeed(state.beans, 1200, "Bean");
    if (state.goldenBeans < 2) return formatNeed(state.goldenBeans, 2, "Golden Bean");
    return "Unlock";
  }
  if (id === "cavyCouncil") {
    if (state.pigs.length < 8) return formatNeed(state.pigs.length, 8, "Pig");
    if (state.squeaks < 10) return formatNeed(state.squeaks, 10, "Squeak");
    return "Unlock";
  }
  if (id === "squeakChoir") {
    if (state.squeaks < 25) return formatNeed(state.squeaks, 25, "Squeak");
    return "Unlock";
  }
  if (state.compost < 100) return formatNeed(state.compost, 100, "Compost", "Compost");
  if (state.stats.rarePoopsCleaned < 25) return `Clean ${25 - state.stats.rarePoopsCleaned} rare`;
  return "Unlock";
}

function getPrestigeStatusText(state: GameState): string {
  const cost = getPrestigeCost();
  const progress = getPrestigeProgress(state);
  const wisdomGain = getPrestigeWisdomGain(state);
  if (wisdomGain > 0) return `Gain ${wisdomGain} Wisdom`;
  return formatNeed(progress, cost, "Lifetime Bean");
}

function getWisdomStatusText(state: GameState, id: WisdomPerkId): string {
  if (state.wisdom[id]) return "Learned";
  const perk = getWisdomPerk(id);
  if (perk.prerequisite && !state.wisdom[perk.prerequisite]) return `Requires ${getWisdomPerk(perk.prerequisite).label}`;
  const cost = getWisdomCost(id);
  if (state.cavyWisdom < cost) return formatNeed(state.cavyWisdom, cost, "Wisdom", "Wisdom");
  return `Learn ${cost} Wisdom`;
}

function formatNeed(current: number, required: number, singular: string, plural = `${singular}s`): string {
  const missing = Math.max(1, Math.ceil(required - current));
  return `Need ${missing} ${missing === 1 ? singular : plural}`;
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

function createEmptyStateItem(text: string): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "empty-state";
  item.textContent = text;
  return item;
}

function renderMilestoneList(
  id: string,
  milestones: MilestoneView[],
  limit: number,
  emptyText: string,
  completeText: string,
): void {
  const list = document.querySelector<HTMLUListElement>(`#${id}`);
  if (!list) return;

  const visible = [
    ...milestones.filter((milestone) => !milestone.complete),
    ...milestones.filter((milestone) => milestone.complete),
  ].slice(0, limit);

  const items = visible.map((milestone) => {
    const item = document.createElement("li");
    if (milestone.complete) item.classList.add("complete");

    const title = document.createElement("span");
    const progress = document.createElement("strong");
    title.textContent = milestone.title;
    progress.textContent = milestone.complete ? "Done" : milestone.progress;
    item.append(title, progress);
    return item;
  });

  if (visible.length === 0) {
    items.push(createEmptyStateItem(emptyText));
  } else if (visible.every((milestone) => milestone.complete)) {
    items.push(createEmptyStateItem(completeText));
  }

  list.replaceChildren(...items);
}

function getCooldownText(seconds: number): string {
  return seconds > 0 ? `${Math.ceil(seconds)}s` : "Ready";
}
