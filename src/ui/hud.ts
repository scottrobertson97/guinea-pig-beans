import {
  buyFeedUpgrade,
  buyCageUpgrade,
  buyFurniture,
  buyWisdomPerk,
  careForFurniture,
  canSetAutomationDirective,
  canTendHabitatZone,
  canUnlockBeanRecipe,
  buyPig,
  buyRarePig,
  buyRobot,
  buyScoopUpgrade,
  exchangeBeanResource,
  fuelAutomation,
  getBeanExchangeTradeStatus,
  getBeanExchangeTrades,
  getCouncilDecreeStatus,
  getCouncilDecrees,
  canUseEventChoice,
  getEventChoiceStatus,
  getEventChoices,
  getAutomationDirectiveName,
  getAutomationDirectiveStatus,
  getAutomationDirectives,
  getFurnitureCareViews,
  getHabitatTendStatus,
  prestige,
  refillHay,
  refillWater,
  respondToEventChoice,
  setAutomationDirective,
  tendHabitatZone,
  unlockBeanRecipe,
  unlockLateGameSystem,
  useCouncilDecree,
  useAbility,
  type EventChoiceView,
} from "../simulation/actions";
import { assetPath } from "../assetPaths";
import {
  getAbilityCost,
  getAutomationFuelCost,
  canBuyWisdomPerk,
  getCageDimensions,
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
import { getCageZoneName, getEcologyConcernCount, getEcologyStatusLine } from "../simulation/ecology";
import { getAchievementViews, getQuestViews, type MilestoneView } from "../simulation/milestones";
import { SAVE_STATUS_EVENT, type SaveStatusDetail } from "../simulation/persistence";
import { getActivePigRequestView } from "../simulation/pigRequests";
import type {
  AbilityId,
  AutomationDirectiveId,
  BeanExchangeTradeId,
  BeanRecipeId,
  CouncilDecreeId,
  EventChoiceId,
  FurnitureId,
  GameState,
  Pig,
  CageZoneId,
  WisdomPerkId,
} from "../simulation/types";
import { emitPlayerAction, emitUiSound, type PlayerActionId, type SceneFeedbackDetail, type UiSoundId } from "./events";

type ButtonId =
  | "adopt-pig"
  | "better-hay"
  | "better-scoop"
  | "poop-roomba"
  | "fuel-automation"
  | "automation-balanced"
  | "automation-cleanliness"
  | "automation-litter-focus"
  | "automation-rare-guard"
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
  | "exchange-beans-to-compost"
  | "exchange-compost-to-squeaks"
  | "exchange-gold-to-beans"
  | "exchange-squeaks-to-gold"
  | "cavy-council"
  | "council-care-mandate"
  | "council-cleanup-ordinance"
  | "council-herd-charter"
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
type HudActionEffect = PurchaseEffectId | SceneFeedbackDetail;
type HudPlayerAction = PlayerActionId | PlayerActionId[];
type StatId = "beans" | "pigs" | "clean" | "streak" | "compost" | "squeaks" | "gold" | "wisdom" | "furniture";
type DockBadgeKind = "available" | "urgent" | "notice";
type ActionVisualState = "available" | "locked" | "completed" | "attention";
type ObjectivePulseState = {
  id: GameState["objective"]["id"];
  progress: number;
  target: number;
  completed: number;
};

const HUD_ACTION_EFFECT_EVENT = "guinea-pig-action-effect";

const SECTION_META: Record<SectionId, SectionMeta> = {
  care: { title: "Care", icon: assetPath("assets/sprites/decor/hay_rack_full.png") },
  shop: { title: "Shop", icon: assetPath("assets/sprites/upgrades/roaming_dustpan.png") },
  furniture: { title: "Furniture", icon: assetPath("assets/sprites/decor/toy_pile.png") },
  abilities: { title: "Abilities", icon: assetPath("assets/sprites/beans/bean_golden.png") },
  recipes: { title: "Bean Recipes", icon: assetPath("assets/sprites/beans/bean_rainbow.png") },
  mythos: { title: "Mythos", icon: assetPath("assets/sprites/upgrades/compost_bin.png") },
  wisdom: { title: "Wisdom", icon: assetPath("assets/sprites/upgrades/cavybot_3000.png") },
  herd: { title: "Herd", icon: assetPath("assets/sprites/pigs/pig_cream_brown_idle.png") },
  goals: { title: "Goals", icon: assetPath("assets/sprites/decor/litter_tray_clean.png") },
  log: { title: "Cage Log", icon: assetPath("assets/sprites/beans/bean_normal.png") },
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

const BEAN_EXCHANGE_BUTTONS: Record<BeanExchangeTradeId, ButtonId> = {
  beansToCompost: "exchange-beans-to-compost",
  compostToSqueaks: "exchange-compost-to-squeaks",
  goldToBeans: "exchange-gold-to-beans",
  squeaksToGold: "exchange-squeaks-to-gold",
};

const COUNCIL_DECREE_BUTTONS: Record<CouncilDecreeId, ButtonId> = {
  careMandate: "council-care-mandate",
  cleanupOrdinance: "council-cleanup-ordinance",
  herdCharter: "council-herd-charter",
};

const AUTOMATION_DIRECTIVE_BUTTONS: Record<AutomationDirectiveId, ButtonId> = {
  balanced: "automation-balanced",
  cleanliness: "automation-cleanliness",
  litterFocus: "automation-litter-focus",
  rareGuard: "automation-rare-guard",
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
  private statCards: Record<StatId, HTMLElement>;
  private modal: HTMLDialogElement;
  private modalTitle: HTMLElement;
  private modalIcon: HTMLImageElement;
  private modalCloseButton: HTMLButtonElement;
  private resetRunButton: HTMLButtonElement;
  private saveStatus: HTMLElement;
  private beanExchangePanel: HTMLElement;
  private cavyCouncilPanel: HTMLElement;
  private panels: Record<SectionId, HTMLElement>;
  private activeSection: SectionId | null = null;
  private activeLauncher: HTMLButtonElement | null = null;
  private previousComboCount = 0;
  private previousObjectivePulseState: ObjectivePulseState | null = null;
  private previousGoalSignature: string | null = null;
  private previousLogSignature: string | null = null;
  private previousFurnitureCareSignature: string | null = null;
  private previousEcologySignature: string | null = null;
  private previousCompletedQuestIds: Set<string> | null = null;
  private previousCompletedAchievementIds: Set<string> | null = null;
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
      "automation-balanced": getButton("automation-balanced"),
      "automation-cleanliness": getButton("automation-cleanliness"),
      "automation-litter-focus": getButton("automation-litter-focus"),
      "automation-rare-guard": getButton("automation-rare-guard"),
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
      "exchange-beans-to-compost": getButton("exchange-beans-to-compost"),
      "exchange-compost-to-squeaks": getButton("exchange-compost-to-squeaks"),
      "exchange-gold-to-beans": getButton("exchange-gold-to-beans"),
      "exchange-squeaks-to-gold": getButton("exchange-squeaks-to-gold"),
      "cavy-council": getButton("cavy-council"),
      "council-care-mandate": getButton("council-care-mandate"),
      "council-cleanup-ordinance": getButton("council-cleanup-ordinance"),
      "council-herd-charter": getButton("council-herd-charter"),
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
    this.statCards = {
      beans: getStatCard("beans"),
      pigs: getStatCard("pigs"),
      clean: getStatCard("clean"),
      streak: getStatCard("streak"),
      compost: getStatCard("compost"),
      squeaks: getStatCard("squeaks"),
      gold: getStatCard("gold"),
      wisdom: getStatCard("wisdom"),
      furniture: getStatCard("furniture"),
    };
    this.modal = getDialog("section-modal");
    this.modalTitle = getElement("section-modal-title");
    this.modalIcon = getImage("section-modal-icon");
    this.modalCloseButton = getButton("close-section-modal");
    this.resetRunButton = getButton("reset-run");
    this.saveStatus = getElement("save-status");
    this.beanExchangePanel = getElement("bean-exchange-panel");
    this.cavyCouncilPanel = getElement("cavy-council-panel");
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
      this.runAction(
        () => buyPig(this.state),
        this.buttons["adopt-pig"],
        { category: "adoption", target: "herd", label: "New Pig", color: 0xf0d56b },
        "purchase",
        "purchase",
      ),
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
    for (const directive of getAutomationDirectives()) {
      const button = this.buttons[AUTOMATION_DIRECTIVE_BUTTONS[directive.id]];
      button.addEventListener("click", () =>
        this.runAction(
          () => setAutomationDirective(this.state, directive.id),
          button,
          { category: "purchase", target: "robot", label: directive.label, resourceText: "Directive", color: getAutomationDirectiveColor(directive.id) },
          "purchase",
          "button",
        ),
      );
    }
    this.buttons["bigger-cage"].addEventListener("click", () =>
      this.runAction(() => buyCageUpgrade(this.state), this.buttons["bigger-cage"], "cage", "purchase", "purchase"),
    );
    this.buttons["rare-pig"].addEventListener("click", () =>
      this.runAction(
        () => buyRarePig(this.state),
        this.buttons["rare-pig"],
        { category: "adoption", target: "herd", label: "Legendary Pig", color: 0xb965d2 },
        "purchase",
        "purchase",
      ),
    );
    this.buttons["refill-hay"].addEventListener("click", () =>
      this.runAction(
        () => refillHay(this.state),
        this.buttons["refill-hay"],
        { category: "care", target: "hay", label: "Hay Full", resourceText: "+Hay", color: 0xd7c74b },
        "refillCare",
      ),
    );
    this.quickButtons["quick-refill-hay"].addEventListener("click", () =>
      this.runAction(
        () => refillHay(this.state),
        this.quickButtons["quick-refill-hay"],
        { category: "care", target: "hay", label: "Hay Full", resourceText: "+Hay", color: 0xd7c74b },
        "refillCare",
      ),
    );
    this.buttons["refill-water"].addEventListener("click", () =>
      this.runAction(
        () => refillWater(this.state),
        this.buttons["refill-water"],
        { category: "care", target: "water", label: "Water Full", resourceText: "+Water", color: 0x86d9f0 },
        "refillCare",
      ),
    );
    this.quickButtons["quick-refill-water"].addEventListener("click", () =>
      this.runAction(
        () => refillWater(this.state),
        this.quickButtons["quick-refill-water"],
        { category: "care", target: "water", label: "Water Full", resourceText: "+Water", color: 0x86d9f0 },
        "refillCare",
      ),
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
        { category: "unlock", target: "cage", label: "Hay Dimension", resourceText: "Hay Slowed", color: 0xd7c74b },
        "purchase",
        "purchase",
      ),
    );
    this.buttons["bean-exchange"].addEventListener("click", () =>
      this.runAction(
        () => unlockLateGameSystem(this.state, "beanExchange"),
        this.buttons["bean-exchange"],
        { category: "unlock", target: "center", label: "Bean Exchange", resourceText: "Trades Open", color: 0xe4b83b },
        "purchase",
        "purchase",
      ),
    );
    for (const trade of getBeanExchangeTrades()) {
      const buttonId = BEAN_EXCHANGE_BUTTONS[trade.id];
      this.buttons[buttonId].addEventListener("click", () =>
        this.runAction(
          () => exchangeBeanResource(this.state, trade.id),
          this.buttons[buttonId],
          {
            category: "trade",
            target: "center",
            tradeId: trade.id,
            label: trade.label,
            resourceText: getBeanExchangeFeedbackText(trade.id),
            color: getBeanExchangeFeedbackColor(trade.id),
          },
          "purchase",
          "purchase",
        ),
      );
    }
    this.buttons["cavy-council"].addEventListener("click", () =>
      this.runAction(
        () => unlockLateGameSystem(this.state, "cavyCouncil"),
        this.buttons["cavy-council"],
        { category: "unlock", target: "herd", label: "Cavy Council", resourceText: "Council Active", color: 0xb965d2 },
        "purchase",
        "purchase",
      ),
    );
    for (const decree of getCouncilDecrees()) {
      const buttonId = COUNCIL_DECREE_BUTTONS[decree.id];
      this.buttons[buttonId].addEventListener("click", () =>
        this.runAction(
          () => useCouncilDecree(this.state, decree.id),
          this.buttons[buttonId],
          {
            category: "decree",
            target: "cage",
            decreeId: decree.id,
            label: decree.label,
            resourceText: getCouncilDecreeFeedbackText(decree.id),
            color: getCouncilDecreeFeedbackColor(decree.id),
          },
          "purchase",
          "purchase",
        ),
      );
    }
    this.buttons["squeak-choir"].addEventListener("click", () =>
      this.runAction(
        () => unlockLateGameSystem(this.state, "squeakChoir"),
        this.buttons["squeak-choir"],
        { category: "unlock", target: "herd", label: "Squeak Choir", resourceText: "+Squeaks over time", color: 0xf0d56b },
        "purchase",
        "purchase",
      ),
    );
    this.buttons["bean-singularity"].addEventListener("click", () =>
      this.runAction(
        () => unlockLateGameSystem(this.state, "beanSingularity"),
        this.buttons["bean-singularity"],
        { category: "unlock", target: "cage", label: "Bean Singularity", resourceText: "Gravity Shift", color: 0x75608f },
        "purchase",
        "purchase",
      ),
    );
    for (const [wisdomId, buttonId] of Object.entries(WISDOM_BUTTONS) as [WisdomPerkId, ButtonId][]) {
      this.bindWisdomButton(buttonId, wisdomId);
    }
    this.buttons.prestige.addEventListener("click", () =>
      this.runAction(
        () => prestige(this.state),
        this.buttons.prestige,
        { category: "prestige", target: "cage", label: "Great Composting", resourceText: "+Wisdom", color: 0xf0d56b },
        "purchase",
        "purchase",
      ),
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
    this.updateStatEmphasis(furnitureUnlocked);
    this.updateObjectivePulse();
    this.updateComboPulse();
    setText("adopt-cost", getAdoptPigStatusText(this.state, costs.pig, pigCapacity));
    setText("feed-cost", getBeanCostStatusText(this.state, costs.feed, `${costs.feed} Beans`));
    setText("scoop-cost", getBeanCostStatusText(this.state, costs.scoop, `${costs.scoop} Beans`));
    setText("robot-cost", getRobotStatusText(this.state, costs.robot));
    setText("fuel-automation-status", getAutomationFuelText(this.state));
    this.renderAutomationDirectiveStatuses();
    setText("cage-cost", getBiggerCageStatusText(this.state, costs.cage, pigCapacity));
    setText("rare-pig-cost", getRarePigStatusText(this.state, costs.rarePig, pigCapacity));
    this.renderFurnitureCosts(costs.furniture);
    this.renderFurnitureSynergies();
    this.renderFurnitureCare();
    this.renderEcologyZones();
    this.renderAbilityStatuses();
    this.renderRecipeStatuses();
    this.renderLateGameStatuses();
    this.renderWisdomStatuses();
    this.renderEventChoices();
    this.renderPigRequest();
    this.updateEventButtonLabels();
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
    this.updateAutomationDirectiveDisabled();
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
    this.updateSectionIndicators();
    this.updateActionVisualStates();

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
        details.textContent = `${pig.breed} ${pig.trait} - ${getPigGoalLabel(pig)} - ${getPigWeakestNeedLabel(pig)} - ${getPigEcologyLabel(pig)} - ${pig.quirk}`;
        item.append(identity, details);
        return item;
      });
      if (this.state.pigs.length <= 2 && this.state.stats.pigsAdopted <= 2) {
        rosterItems.push(createEmptyStateItem("Bonded pair settled in. More room means more wheeks later."));
      }
      roster.replaceChildren(...rosterItems);
    }

    const questViews = getQuestViews(this.state);
    const achievementViews = getAchievementViews(this.state);
    renderMilestoneList(
      "quest-list",
      questViews,
      4,
      "No open quests right now. Keep the cage cozy and clean.",
      "Visible quests are handled. New cage ambitions unlock as the herd grows.",
    );
    renderMilestoneList(
      "achievement-list",
      achievementViews,
      3,
      "No achievements yet. The first bean usually starts it.",
      "Visible achievements are handled. The cage is quietly impressed.",
    );
    this.updateMilestoneFeedback(questViews, achievementViews);
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
    const choice = getEventChoices(this.state).find((candidate) => candidate.id === choiceId);
    this.runAction(
      () => respondToEventChoice(this.state, choiceId),
      source,
      {
        category: "event",
        target: "cage",
        eventChoiceId: choiceId,
        label: choice?.label ?? "Event Choice",
        resourceText: getEventChoiceFeedbackText(choiceId),
        color: getEventChoiceFeedbackColor(choiceId),
      },
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
    const confirmed = window.confirm("Reset the game? This clears your local save and starts a fresh cage.");
    if (!confirmed) return;
    emitUiSound("button");
    this.onResetRun();
  }

  private renderSaveStatus(detail: SaveStatusDetail): void {
    this.saveStatus.classList.remove("saving", "saved", "warning");
    this.saveStatus.hidden = false;
    if (detail.status === "saving") {
      this.saveStatus.textContent = "Saving...";
      this.saveStatus.classList.add("saving");
      return;
    }
    if (detail.status === "saved") {
      this.saveStatus.textContent = "Saved";
      this.saveStatus.classList.add("saved");
      return;
    }
    if (detail.status === "unavailable") {
      this.saveStatus.textContent = "Save unavailable";
      this.saveStatus.classList.add("warning");
      return;
    }
    this.saveStatus.hidden = true;
  }

  private updateMilestoneFeedback(questViews: MilestoneView[], achievementViews: MilestoneView[]): void {
    const completedQuests = new Set(questViews.filter((milestone) => milestone.complete).map((milestone) => milestone.id));
    const completedAchievements = new Set(achievementViews.filter((milestone) => milestone.complete).map((milestone) => milestone.id));

    this.dispatchNewMilestoneFeedback(
      "quest",
      questViews,
      completedQuests,
      this.previousCompletedQuestIds,
      0x7db46a,
    );
    this.dispatchNewMilestoneFeedback(
      "achievement",
      achievementViews,
      completedAchievements,
      this.previousCompletedAchievementIds,
      0xf0d56b,
    );

    this.previousCompletedQuestIds = completedQuests;
    this.previousCompletedAchievementIds = completedAchievements;
  }

  private dispatchNewMilestoneFeedback(
    kind: "quest" | "achievement",
    views: MilestoneView[],
    completedIds: Set<string>,
    previousIds: Set<string> | null,
    color: number,
  ): void {
    if (!previousIds) return;
    const completed = views.find((milestone) => milestone.complete && completedIds.has(milestone.id) && !previousIds.has(milestone.id));
    if (!completed) return;
    this.dispatchSceneFeedback({
      category: "milestone",
      target: "center",
      milestoneKind: kind,
      label: kind === "quest" ? "Quest Complete" : "Achievement",
      resourceText: completed.title,
      color,
    });
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

    if (effect) this.dispatchSceneFeedback(toSceneFeedbackDetail(effect));
  }

  private dispatchSceneFeedback(detail: SceneFeedbackDetail): void {
    window.dispatchEvent(new CustomEvent(HUD_ACTION_EFFECT_EVENT, { detail }));
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

  private updateObjectivePulse(): void {
    const current = getObjectivePulseState(this.state);
    const previous = this.previousObjectivePulseState;
    this.previousObjectivePulseState = current;
    if (!previous) return;

    const objectiveChanged = current.id !== previous.id || current.target !== previous.target;
    const objectiveCompleted = current.completed > previous.completed;
    const progressIncreased = current.id === previous.id && current.progress > previous.progress;

    if (objectiveChanged || objectiveCompleted) {
      pulseElement("quick-objective-title", "objective-pulse");
      pulseElement("quick-objective-progress", "objective-pulse");
    } else if (progressIncreased) {
      pulseElement("quick-objective-progress", "objective-pulse");
    }
  }

  private updateSectionIndicators(): void {
    this.updateGoalAndLogMarkers();

    const eventReady = Boolean(this.state.event.active && this.state.event.responseReady);
    const eventActive = Boolean(this.state.event.active);
    const requestReady = Boolean(this.state.pigRequest?.active);
    const careLowCount = Number(this.state.needs.hay < 25) + Number(this.state.needs.water < 25);
    this.setAttention(this.buttons["event-response"], eventReady);
    this.setAttention(this.quickButtons["quick-event-response"], eventReady);
    this.setDockIndicator(
      "care",
      eventReady || requestReady ? "!" : eventActive ? "..." : careLowCount > 0 ? careLowCount.toString() : "",
      eventReady || requestReady ? "urgent" : "notice",
    );
    this.setDockIndicator("shop", countEnabled(this.buttons, [
      "adopt-pig",
      "better-hay",
      "better-scoop",
      "poop-roomba",
      "fuel-automation",
      "automation-balanced",
      "automation-cleanliness",
      "automation-litter-focus",
      "automation-rare-guard",
      "bigger-cage",
      "rare-pig",
    ]), "available");
    const ecologyConcerns = getEcologyConcernCount(this.state);
    this.setDockIndicator("furniture", ecologyConcerns > 0 ? "!" : countEnabled(this.buttons, [
      "hidey-house",
      "tunnel",
      "litter-tray",
      "chew-toy",
      "snuggle-sack",
      "cardboard-castle",
      "royal-throne",
    ]), ecologyConcerns > 0 ? "urgent" : "available");
    this.setDockIndicator("abilities", countEnabled(this.buttons, [
      "wheek-call",
      "treat-bag",
      "deep-clean",
      "fresh-bedding",
      "snack-time",
      "zoomie-mode",
    ]), "available");
    this.setDockIndicator("recipes", countEnabled(this.buttons, [
      "recipe-bean-blessing",
      "recipe-compost-catalyst",
      "recipe-royal-accord",
    ]), "available");
    this.setDockIndicator("mythos", countEnabled(this.buttons, [
      "hay-dimension",
      "bean-exchange",
      "exchange-beans-to-compost",
      "exchange-compost-to-squeaks",
      "exchange-gold-to-beans",
      "exchange-squeaks-to-gold",
      "cavy-council",
      "council-care-mandate",
      "council-cleanup-ordinance",
      "council-herd-charter",
      "squeak-choir",
      "bean-singularity",
      "prestige",
    ]), "available");
    this.setDockIndicator("wisdom", countEnabled(this.buttons, [
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
    ]), "available");
    this.setDockIndicator("herd", "", "notice");
    this.setDockIndicator("goals", this.hasGoalUpdate ? "!" : "", "notice");
    this.setDockIndicator("log", this.hasUnreadLog ? "!" : "", "notice");
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

  private setDockIndicator(section: SectionId, value: number | string, kind: DockBadgeKind): void {
    const badge = this.badges[section];
    const launcher = this.launchers[section];
    const text = typeof value === "number" ? (value > 0 ? value.toString() : "") : value;
    badge.textContent = text;
    badge.hidden = text.length === 0;
    badge.dataset.badgeKind = kind;
    launcher.classList.toggle("dock-urgent", text.length > 0 && kind === "urgent");
    launcher.classList.toggle("dock-available", text.length > 0 && kind === "available");
    launcher.classList.toggle("dock-notice", text.length > 0 && kind === "notice");
  }

  private setAttention(button: HTMLButtonElement, active: boolean): void {
    button.classList.toggle("attention", active);
  }

  private updateStatEmphasis(furnitureUnlocked: number): void {
    this.setStatClasses("beans", "stat-primary", true);
    this.setStatClasses("pigs", "stat-primary", true);
    this.setStatClasses("clean", "stat-primary", true);
    this.setStatClasses("streak", "stat-primary", true);

    this.setStatClasses("compost", "stat-secondary", true);
    this.setStatClasses("squeaks", "stat-secondary", true);
    this.setStatClasses("gold", "stat-secondary", true);
    this.setStatClasses("wisdom", "stat-secondary", true);
    this.setStatClasses("furniture", "stat-secondary", true);

    this.setStatClasses("clean", "stat-danger", this.state.cage.cleanliness < 45);
    this.setStatClasses("streak", "stat-active", this.state.combo.timer > 0 && this.state.combo.count > 1);
    this.setResourceStatState("compost", this.state.compost > 0);
    this.setResourceStatState("squeaks", this.state.squeaks > 0);
    this.setResourceStatState("gold", this.state.goldenBeans > 0);
    this.setResourceStatState("wisdom", this.state.cavyWisdom > 0);
    this.setResourceStatState("furniture", furnitureUnlocked > 0);
  }

  private setStatClasses(id: StatId, className: string, active: boolean): void {
    this.statCards[id].classList.toggle(className, active);
  }

  private setResourceStatState(id: StatId, unlocked: boolean): void {
    this.setStatClasses(id, "stat-unlocked", unlocked);
    this.setStatClasses(id, "stat-dormant", !unlocked);
  }

  private updateActionVisualStates(): void {
    for (const button of Object.values(this.buttons)) {
      this.setActionVisualState(button, getActionVisualState(button));
    }
    for (const button of Object.values(this.quickButtons)) {
      this.setActionVisualState(button, getActionVisualState(button));
    }
    for (const button of Object.values(this.eventChoiceButtons)) {
      this.setActionVisualState(button, button.hidden ? "locked" : getActionVisualState(button));
    }
    for (const button of document.querySelectorAll<HTMLButtonElement>(".zone-tend-button")) {
      this.setActionVisualState(button, getActionVisualState(button));
    }
    for (const button of document.querySelectorAll<HTMLButtonElement>(".furniture-care-button")) {
      this.setActionVisualState(button, getActionVisualState(button));
    }
    this.updateModalScanStates();
  }

  private setActionVisualState(button: HTMLButtonElement, state: ActionVisualState): void {
    button.classList.toggle("available-now", state === "available");
    button.classList.toggle("locked-now", state === "locked");
    button.classList.toggle("completed-now", state === "completed");
    button.classList.toggle("attention-now", state === "attention");
  }

  private updateModalScanStates(): void {
    for (const panel of Object.values(this.panels)) {
      const buttons = [...panel.querySelectorAll<HTMLButtonElement>("button")].filter((button) => !button.hidden);
      const available = buttons.filter((button) => getActionVisualState(button) === "available").length;
      const completed = buttons.filter((button) => getActionVisualState(button) === "completed").length;
      const locked = buttons.filter((button) => getActionVisualState(button) === "locked").length;
      panel.classList.toggle("has-available-actions", available > 0);
      panel.classList.toggle("has-completed-actions", completed > 0);
      panel.classList.toggle("has-locked-actions", locked > 0);
      panel.dataset.availableActions = String(available);
      panel.dataset.completedActions = String(completed);
      panel.dataset.lockedActions = String(locked);
    }
  }

  private bindFurnitureButton(buttonId: ButtonId, furnitureId: FurnitureId): void {
    this.buttons[buttonId].addEventListener("click", () =>
      this.runAction(
        () => buyFurniture(this.state, furnitureId),
        this.buttons[buttonId],
        { category: "unlock", target: "furniture", furnitureId, label: "Unlocked", color: 0x7db46a },
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
        { category: "purchase", target: "ability", abilityId },
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
        {
          category: "unlock",
          target: "center",
          label: getBeanRecipeName(recipeId),
          resourceText: "Recipe Active",
          color: 0x8c75d8,
        },
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
        {
          category: "unlock",
          target: "center",
          label: getWisdomPerk(wisdomId).label,
          resourceText: "Wisdom Learned",
          color: 0xf0d56b,
        },
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

  private renderAutomationDirectiveStatuses(): void {
    setText("automation-directive-current", getAutomationDirectiveName(this.state.automation.directive));
    for (const directive of getAutomationDirectives()) {
      const buttonId = AUTOMATION_DIRECTIVE_BUTTONS[directive.id];
      setText(`${buttonId}-status`, getAutomationDirectiveStatus(this.state, directive.id));
    }
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

  private renderFurnitureCare(): void {
    const list = document.querySelector<HTMLUListElement>("#furniture-care-list");
    if (!list) return;

    const signature = getFurnitureCareRenderSignature(this.state);
    if (signature === this.previousFurnitureCareSignature) return;
    this.previousFurnitureCareSignature = signature;

    const views = getFurnitureCareViews(this.state);
    if (views.length === 0) {
      list.replaceChildren(createEmptyStateItem("Unlock furniture to start caring for well-loved cage pieces."));
      return;
    }

    const items = views.map((view) => {
      const item = document.createElement("li");
      const conditionClass = view.condition >= 88 ? "complete" : view.condition < 58 ? "attention" : "";
      if (conditionClass) item.classList.add(conditionClass);
      if (view.status.startsWith("Cooldown")) item.classList.add("cooldown");

      const title = document.createElement("span");
      const status = document.createElement("strong");
      const metrics = document.createElement("small");
      const effect = document.createElement("em");
      const controls = document.createElement("div");
      const careButton = document.createElement("button");
      const careStatus = document.createElement("small");

      title.textContent = view.label;
      status.textContent = view.conditionLabel;
      metrics.textContent = `Condition ${view.condition} - ${getCageZoneName(view.zoneId)}`;
      effect.textContent = view.effect;
      controls.className = "furniture-care-actions";
      careButton.type = "button";
      careButton.className = "furniture-care-button";
      careButton.textContent = "Care";
      careButton.disabled = !view.canCare;
      careStatus.textContent = view.status;
      careButton.addEventListener("click", () => this.runFurnitureCare(view.id, view.label, view.zoneId, careButton));
      controls.append(careButton, careStatus);
      item.append(title, status, metrics, effect, controls);
      return item;
    });

    list.replaceChildren(...items);
  }

  private renderEcologyZones(): void {
    const list = document.querySelector<HTMLUListElement>("#ecology-zone-list");
    if (!list) return;
    const signature = getEcologyRenderSignature(this.state);
    if (signature === this.previousEcologySignature) return;
    this.previousEcologySignature = signature;

    const items = this.state.ecology.zones.map((zone) => {
      const item = document.createElement("li");
      item.dataset.zoneId = zone.id;
      if (zone.mess >= 55 || zone.traffic >= 72 || zone.comfort <= 32) item.classList.add("attention");
      if (zone.appeal >= 78 && zone.pigIds.length > 0) item.classList.add("complete");

      const title = document.createElement("span");
      const status = document.createElement("strong");
      const metrics = document.createElement("small");
      const action = document.createElement("em");
      const controls = document.createElement("div");
      const tendButton = document.createElement("button");
      const tendStatus = document.createElement("small");
      title.textContent = zone.label;
      status.textContent = zone.status;
      const stewardshipCare = this.state.ecology.stewardship[zone.id]?.care ?? 0;
      const stewardshipCooldown = this.state.ecology.stewardship[zone.id]?.cooldown ?? 0;
      if (stewardshipCooldown > 0) item.classList.add("cooldown");
      metrics.textContent = `Comfort ${zone.comfort} - Mess ${zone.mess} - Traffic ${zone.traffic} - Care ${Math.round(stewardshipCare)}`;
      action.textContent = `${zone.action}${zone.pigIds.length > 0 ? ` - ${zone.pigIds.length} pig${zone.pigIds.length === 1 ? "" : "s"}` : ""}`;
      controls.className = "ecology-actions";
      tendButton.type = "button";
      tendButton.className = "zone-tend-button";
      tendButton.textContent = "Tend";
      tendButton.disabled = !canTendHabitatZone(this.state, zone.id);
      tendStatus.textContent = getHabitatTendStatus(this.state, zone.id);
      tendButton.addEventListener("click", () => this.runHabitatTend(zone.id, tendButton));
      controls.append(tendButton, tendStatus);
      item.append(title, status, metrics, action, controls);
      return item;
    });

    list.replaceChildren(...items);
  }

  private runHabitatTend(zoneId: CageZoneId, button: HTMLButtonElement): void {
    const zone = this.state.ecology.zones.find((candidate) => candidate.id === zoneId);
    this.runAction(
      () => tendHabitatZone(this.state, zoneId),
      button,
      {
        category: "habitat",
        target: "zone",
        zoneId,
        label: `${zone?.label ?? getCageZoneName(zoneId)} Tended`,
        resourceText: "+Care",
        color: getHabitatFeedbackColor(zoneId),
      },
      "purchase",
      "event",
    );
  }

  private runFurnitureCare(furnitureId: FurnitureId, label: string, zoneId: CageZoneId, button: HTMLButtonElement): void {
    this.runAction(
      () => careForFurniture(this.state, furnitureId),
      button,
      {
        category: "habitat",
        target: "furniture",
        furnitureId,
        zoneId,
        label: `${label} Cared`,
        resourceText: "+Condition",
        color: getHabitatFeedbackColor(zoneId),
      },
      "purchase",
      "event",
    );
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
    this.renderBeanExchangeStatuses();
    setText("cavy-council-status", getLateGameStatusText(this.state, "cavyCouncil"));
    this.renderCouncilDecreeStatuses();
    setText("squeak-choir-status", getLateGameStatusText(this.state, "squeakChoir"));
    setText("bean-singularity-status", getLateGameStatusText(this.state, "beanSingularity"));
  }

  private renderBeanExchangeStatuses(): void {
    this.beanExchangePanel.hidden = !this.state.lateGame.beanExchange;
    for (const trade of getBeanExchangeTrades()) {
      const buttonId = BEAN_EXCHANGE_BUTTONS[trade.id];
      setText(`${buttonId}-status`, getBeanExchangeTradeStatus(this.state, trade.id));
    }
  }

  private renderCouncilDecreeStatuses(): void {
    this.cavyCouncilPanel.hidden = !this.state.lateGame.cavyCouncil;
    for (const decree of getCouncilDecrees()) {
      const buttonId = COUNCIL_DECREE_BUTTONS[decree.id];
      setText(`${buttonId}-status`, getCouncilDecreeStatus(this.state, decree.id));
    }
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

  private updateEventButtonLabels(): void {
    const label = this.state.event.active
      ? this.state.event.responseReady
        ? "Respond"
        : "Event active"
      : "Event";
    this.buttons["event-response"].textContent = label;
    this.quickButtons["quick-event-response"].textContent = label;
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

  private updateAutomationDirectiveDisabled(): void {
    for (const directive of getAutomationDirectives()) {
      this.buttons[AUTOMATION_DIRECTIVE_BUTTONS[directive.id]].disabled = !canSetAutomationDirective(this.state, directive.id);
    }
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
    for (const trade of getBeanExchangeTrades()) {
      const buttonId = BEAN_EXCHANGE_BUTTONS[trade.id];
      this.buttons[buttonId].disabled = getBeanExchangeTradeStatus(this.state, trade.id) !== "Trade";
      this.buttons[buttonId].hidden = !this.state.lateGame.beanExchange;
    }
    this.buttons["cavy-council"].disabled = this.state.lateGame.cavyCouncil || this.state.pigs.length < 8 || this.state.squeaks < 10;
    for (const decree of getCouncilDecrees()) {
      const buttonId = COUNCIL_DECREE_BUTTONS[decree.id];
      this.buttons[buttonId].disabled = getCouncilDecreeStatus(this.state, decree.id) !== "Pass";
      this.buttons[buttonId].hidden = !this.state.lateGame.cavyCouncil;
    }
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

function getStatCard(id: StatId): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-stat="${id}"]`);
  if (!element) {
    throw new Error(`Missing stat card for ${id}`);
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

function getObjectivePulseState(state: GameState): ObjectivePulseState {
  return {
    id: state.objective.id,
    progress: Math.floor(state.objective.progress),
    target: state.objective.target,
    completed: state.stats.objectivesCompleted,
  };
}

function getActionVisualState(button: HTMLButtonElement): ActionVisualState {
  if (button.classList.contains("attention")) return "attention";
  if (isCompletedButton(button)) return "completed";
  return button.disabled ? "locked" : "available";
}

function toSceneFeedbackDetail(effect: HudActionEffect): SceneFeedbackDetail {
  if (typeof effect !== "string") return effect;
  if (effect === "hay") return { category: "purchase", target: "hay", label: "Better Hay", color: 0xd7c74b };
  if (effect === "scoop") return { category: "purchase", target: "scoop", label: "Better Scoop", color: 0xf0d56b };
  if (effect === "robot") return { category: "purchase", target: "robot", label: "Roomba", color: 0x86d9f0 };
  if (effect === "cage") return { category: "purchase", target: "cage", label: "Bigger Cage", color: 0xf0d56b };
  if (effect === "herd") return { category: "adoption", target: "herd", label: "New Pig", color: 0xf0d56b };
  if (effect === "ability") return { category: "purchase", target: "ability", label: "Ability", color: 0xf0d56b };
  return { category: "unlock", target: "furniture", label: "Unlocked", color: 0x7db46a };
}

function getBeanExchangeFeedbackText(tradeId: BeanExchangeTradeId): string {
  if (tradeId === "beansToCompost") return "-250 Beans / +20 Compost";
  if (tradeId === "compostToSqueaks") return "-30 Compost / +5 Squeaks";
  if (tradeId === "goldToBeans") return "-1 Gold / +300 Beans";
  return "-20 Squeaks / +1 Gold";
}

function getBeanExchangeFeedbackColor(tradeId: BeanExchangeTradeId): number {
  if (tradeId === "beansToCompost") return 0x6fa55d;
  if (tradeId === "compostToSqueaks") return 0xf0d56b;
  if (tradeId === "goldToBeans" || tradeId === "squeaksToGold") return 0xe4b83b;
  return 0x7db46a;
}

function getCouncilDecreeFeedbackText(decreeId: CouncilDecreeId): string {
  if (decreeId === "careMandate") return "+Hay / +Water / +Happy";
  if (decreeId === "cleanupOrdinance") return "Center Cleaned";
  return "+75 Beans / +1 Gold";
}

function getCouncilDecreeFeedbackColor(decreeId: CouncilDecreeId): number {
  if (decreeId === "careMandate") return 0x7db46a;
  if (decreeId === "cleanupOrdinance") return 0x86d9f0;
  return 0xb965d2;
}

function getEventChoiceFeedbackText(choiceId: EventChoiceId): string {
  if (choiceId.includes("litter")) return "Litter Shift";
  if (choiceId.includes("hidey")) return "Hidey Calm";
  if (choiceId.includes("traffic")) return "Traffic Shift";
  if (choiceId.includes("Hay") || choiceId.includes("hay")) return "Hay Shift";
  if (choiceId.includes("bottle") || choiceId.includes("Bottle")) return "Water Shift";
  if (choiceId.includes("Squeak") || choiceId.includes("squeak") || choiceId.includes("wheek")) return "Squeaks";
  if (choiceId.includes("Clean") || choiceId.includes("Tidy") || choiceId.includes("inspection")) return "Cage Shift";
  if (choiceId.includes("compost") || choiceId.includes("Compost")) return "Compost";
  if (choiceId.includes("zoomies") || choiceId.includes("Zoomies")) return "Zoomies";
  return "Event Resolved";
}

function getEventChoiceFeedbackColor(choiceId: EventChoiceId): number {
  if (choiceId.includes("litter")) return 0x8a6e4d;
  if (choiceId.includes("hidey")) return 0x7db46a;
  if (choiceId.includes("traffic")) return 0xb965d2;
  if (choiceId.includes("bottle") || choiceId.includes("Bottle")) return 0x86d9f0;
  if (choiceId.includes("compost") || choiceId.includes("Compost")) return 0x6fa55d;
  if (choiceId.includes("Squeak") || choiceId.includes("squeak") || choiceId.includes("wheek")) return 0xf0d56b;
  if (choiceId.includes("zoomies") || choiceId.includes("Zoomies")) return 0xb965d2;
  return 0x7db46a;
}

function getHabitatFeedbackColor(zoneId: CageZoneId): number {
  if (zoneId === "hayCorner") return 0xd7c74b;
  if (zoneId === "waterBottle") return 0x86d9f0;
  if (zoneId === "litterCorner") return 0x8a6e4d;
  if (zoneId === "royalCourt") return 0xb965d2;
  if (zoneId === "playRun") return 0xf0d56b;
  return 0x7db46a;
}

function getAutomationDirectiveColor(id: AutomationDirectiveId): number {
  if (id === "cleanliness") return 0x86d9f0;
  if (id === "litterFocus") return 0x8a6e4d;
  if (id === "rareGuard") return 0xb965d2;
  return 0x7db46a;
}

function isCompletedButton(button: HTMLButtonElement): boolean {
  const status = button.querySelector("strong")?.textContent?.trim().toLowerCase() ?? "";
  return status === "active" || status === "unlocked" || status === "learned";
}

function getBeanRecipeName(id: BeanRecipeId): string {
  if (id === "beanBlessing") return "Bean Blessing";
  if (id === "compostCatalyst") return "Compost Catalyst";
  return "Royal Accord";
}

function getLogSignature(state: GameState): string {
  return state.log.join("|");
}

function getFurnitureCareRenderSignature(state: GameState): string {
  return getFurnitureCareViews(state)
    .map((view) =>
      [
        view.id,
        view.condition,
        view.conditionLabel,
        view.status,
        view.effect,
        Number(view.canCare),
      ].join(":"),
    )
    .join("|");
}

function getEcologyRenderSignature(state: GameState): string {
  return state.ecology.zones
    .map((zone) => {
      const stewardship = state.ecology.stewardship[zone.id];
      return [
        zone.id,
        zone.status,
        zone.action,
        zone.comfort,
        zone.mess,
        zone.traffic,
        zone.appeal,
        zone.pigIds.length,
        Math.round(stewardship?.care ?? 0),
        Math.ceil(stewardship?.cooldown ?? 0),
        getHabitatTendStatus(state, zone.id),
        Number(canTendHabitatZone(state, zone.id)),
      ].join(":");
    })
    .join("|");
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
  const ecologyLine = getEcologyStatusLine(state);
  if (ecologyLine) return ecologyLine;
  const careNeed = getFurnitureCareViews(state).find((view) => view.condition < 58);
  if (careNeed) return `${careNeed.label} is ${careNeed.conditionLabel.toLowerCase()}. Open Furniture Care to tend it.`;
  if (state.automation.overdrive > 0) return `Automation overdrive is sweeping faster for ${Math.ceil(state.automation.overdrive)}s.`;
  if (state.robot || state.furniture.litterTray) return `Automation directive: ${getAutomationDirectiveName(state.automation.directive)}.`;
  if (state.event.active && state.event.responseReady)
    return `${state.event.active.name} is active. Use Event to choose a response.`;
  if (state.event.active) return `${state.event.active.name} is active for ${Math.ceil(state.event.active.timer)}s.`;
  const request = getActivePigRequestView(state);
  if (request) return `${request.pigName} has a request: ${request.title}.`;
  if (state.pigs.length === 0) return "The cage is empty. Adopt Pig is free so the herd can restart.";
  if (state.pigs.length === 1) return "The last pig needs a companion. Adopt Pig is free until the pair is restored.";
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

function getPigGoalLabel(pig: Pig): string {
  if (pig.goal === "eat") return "Eating";
  if (pig.goal === "drink") return "Drinking";
  if (pig.goal === "sleep") return "Sleeping";
  return "Roaming";
}

function getPigWeakestNeedLabel(pig: Pig): string {
  const needs = [
    { label: "Hunger", value: pig.hunger },
    { label: "Thirst", value: pig.thirst },
    { label: "Energy", value: pig.energy },
  ];
  const weakest = needs.reduce((lowest, need) => (need.value < lowest.value ? need : lowest));
  return `${weakest.label} ${Math.round(weakest.value)}%`;
}

function getPigEcologyLabel(pig: Pig): string {
  const stress = Math.round(pig.stress);
  const stressLabel = stress >= 70 ? "stressed" : stress >= 40 ? "uneasy" : "settled";
  return `${getCageZoneName(pig.favoriteZone)} ${stress}% ${stressLabel}`;
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
  if (state.pigs.length < 2) return "Free - rebuild herd";
  return getBeanCostStatusText(state, cost, `${cost} Beans`);
}

function getBiggerCageStatusText(state: GameState, cost: number, capacity: number): string {
  const currentSize = getCageDimensions(state.upgrades.cageLevel);
  const nextSize = getCageDimensions(state.upgrades.cageLevel + 1);
  const widthIncrease = nextSize.width - currentSize.width;
  const heightIncrease = nextSize.height - currentSize.height;
  const expansionText = widthIncrease > 0 || heightIncrease > 0 ? `+${widthIncrease}x${heightIncrease}` : "Max size";
  return getBeanCostStatusText(state, cost, `${cost} Beans - ${expansionText} - Cap ${capacity + 2}`);
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
