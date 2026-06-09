export type PigMood = "content" | "hungry" | "thirsty" | "messy";
export type PigGoal = "roam" | "eat" | "drink" | "sleep";
export type PigBreed =
  | "American"
  | "Abyssinian"
  | "Peruvian"
  | "Skinny Pig"
  | "Teddy"
  | "Silkie"
  | "Crested"
  | "Rex";
export type PigTrait =
  | "Chonker"
  | "Zoomer"
  | "Neat Freak"
  | "Gremlin"
  | "Royal Pig"
  | "Shy Beaner"
  | "Hay Goblin"
  | "Drama Pig"
  | "Compost Mystic";
export type PoopType =
  | "normal"
  | "golden"
  | "compost"
  | "stinky"
  | "blessed"
  | "mega"
  | "mystery"
  | "hay"
  | "royal"
  | "cursed"
  | "messPile";
export type RobotState = "wandering" | "sweeping";
export type AutomationDirectiveId = "balanced" | "cleanliness" | "litterFocus" | "rareGuard";
export type CageZoneId =
  | "hayCorner"
  | "waterBottle"
  | "hideyZone"
  | "playRun"
  | "litterCorner"
  | "openFleece"
  | "royalCourt";
export type CageZoneRole = "care" | "rest" | "play" | "cleanup" | "open" | "prestige";
export type FurnitureId =
  | "hideyHouse"
  | "tunnel"
  | "litterTray"
  | "chewToy"
  | "snuggleSack"
  | "cardboardCastle"
  | "royalThrone";
export type AbilityId = "wheekCall" | "treatBag" | "deepClean" | "freshBedding" | "snackTime" | "zoomieMode";
export type BeanRecipeId = "beanBlessing" | "compostCatalyst" | "royalAccord";
export type BeanExchangeTradeId = "beansToCompost" | "compostToSqueaks" | "goldToBeans" | "squeaksToGold";
export type CouncilDecreeId = "careMandate" | "cleanupOrdinance" | "herdCharter";
export type WisdomPerkId =
  | "roomyStart"
  | "steadySupplies"
  | "freshStart"
  | "bondedBeginnings"
  | "socialMemory"
  | "chorusTraining"
  | "gentleAutomation"
  | "compostEngine"
  | "trayAffinity"
  | "rareInstinct"
  | "goldenNose"
  | "royalMemory";
export type EventId =
  | "zoomies"
  | "hayFrenzy"
  | "napTime"
  | "bottleJam"
  | "cageInspection"
  | "compostBloom"
  | "greatWheeking"
  | "litterRevolt"
  | "hideySquabble"
  | "zoomieTraffic";
export type EventChoiceId =
  | "zoomiesGuide"
  | "zoomiesChaos"
  | "zoomiesMomentum"
  | "hayEmergency"
  | "hayFeast"
  | "hayBundles"
  | "napProtect"
  | "napQuietClean"
  | "napDreamSqueaks"
  | "bottleFix"
  | "bottleTap"
  | "bottleSpare"
  | "inspectionTidy"
  | "inspectionPresent"
  | "inspectionSqueaks"
  | "compostHarvest"
  | "compostRipen"
  | "compostFuel"
  | "wheekingAnswer"
  | "wheekingConduct"
  | "wheekingEcho"
  | "litterScrub"
  | "litterCompost"
  | "litterCircuit"
  | "hideyQuiet"
  | "hideyTreaty"
  | "hideyRebond"
  | "trafficLanes"
  | "trafficSprint"
  | "trafficTunnel";
export type ObjectiveId =
  | "cleanBurst"
  | "keepClean"
  | "collectRare"
  | "useAbility"
  | "unlockFurniture"
  | "earnBeans"
  | "herdHarmony"
  | "fuelAutomation"
  | "unlockRecipe";
export type PigRequestId =
  | "tidyFavor"
  | "hayFavor"
  | "waterFavor"
  | "zoomieFavor"
  | "snackFavor"
  | "furnitureFavor"
  | "compostFavor"
  | "favoriteCornerFavor"
  | "quietZoneFavor"
  | "bondSupportFavor";
export type PigRequestProgressKind =
  | "clean"
  | "hayRefill"
  | "waterRefill"
  | "combo"
  | "ability"
  | "furniture"
  | "compost"
  | "ecologyClean"
  | "bondedZone";

export interface CageZoneMetrics {
  id: CageZoneId;
  label: string;
  role: CageZoneRole;
  x: number;
  y: number;
  radius: number;
  mess: number;
  comfort: number;
  traffic: number;
  appeal: number;
  pigIds: number[];
  status: string;
  action: string;
}

export interface CageZoneStewardship {
  care: number;
  cooldown: number;
  lastAction: string | null;
}

export interface CageEcologyState {
  zones: CageZoneMetrics[];
  averageStress: number;
  dominantStressZone: CageZoneId | null;
  stewardship: Partial<Record<CageZoneId, CageZoneStewardship>>;
}

export interface FurnitureCareState {
  condition: number;
  cooldown: number;
  lastCare: string | null;
}

export interface Pig {
  id: number;
  name: string;
  breed: PigBreed;
  trait: PigTrait;
  favoriteFood: string;
  quirk: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  poopTimer: number;
  bodyTint: number;
  spotTint: number;
  mood: PigMood;
  hunger: number;
  thirst: number;
  energy: number;
  goal: PigGoal;
  goalTimer: number;
  favoriteZone: CageZoneId;
  stress: number;
  legendary: boolean;
  bondedPigId: number | null;
}

export interface Poop {
  id: number;
  type: PoopType;
  x: number;
  y: number;
  baseValue: number;
  value: number;
  age: number;
  hitsRemaining: number;
}

export interface Robot {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  sensorRadius: number;
  sweepRadius: number;
  state: RobotState;
  cleanLogCooldown: number;
}

export interface ActiveEvent {
  id: EventId;
  name: string;
  timer: number;
}

export interface ActiveObjective {
  id: ObjectiveId;
  title: string;
  progress: number;
  target: number;
  timer: number;
}

export interface ActivePigRequest {
  id: PigRequestId;
  pigId: number;
  title: string;
  description: string;
  progress: number;
  target: number;
  timer: number;
  rewardText: string;
  thought: string;
  token: number;
}

export interface PigRequestResult {
  pigId: number;
  title: string;
  rewardText: string;
  completed: boolean;
  token: number;
}

export interface GameState {
  beans: number;
  compost: number;
  squeaks: number;
  goldenBeans: number;
  cavyWisdom: number;
  pigs: Pig[];
  poops: Poop[];
  robot: Robot | null;
  upgrades: {
    feedLevel: number;
    scoopLevel: number;
    cageLevel: number;
  };
  needs: {
    hay: number;
    water: number;
  };
  cage: {
    width: number;
    height: number;
    cleanliness: number;
    happiness: number;
    enrichment: number;
    socialization: number;
    space: number;
  };
  ecology: CageEcologyState;
  furniture: Record<FurnitureId, boolean>;
  furnitureCare: Partial<Record<FurnitureId, FurnitureCareState>>;
  abilities: Record<AbilityId, number>;
  automation: {
    overdrive: number;
    directive: AutomationDirectiveId;
  };
  recipes: Record<BeanRecipeId, boolean>;
  wisdom: Record<WisdomPerkId, boolean>;
  event: {
    active: ActiveEvent | null;
    nextTimer: number;
    bottleJammed: boolean;
    responseReady: boolean;
  };
  objective: ActiveObjective;
  pigRequest: {
    active: ActivePigRequest | null;
    nextTimer: number;
    completed: number;
    expired: number;
    lastResult: PigRequestResult | null;
  };
  survival: {
    deathCheckTimer: number;
  };
  prestige: {
    ascensions: number;
    unlocked: string[];
    lifetimeBeansClaimed: number;
  };
  lateGame: {
    hayDimension: boolean;
    beanExchange: boolean;
    cavyCouncil: boolean;
    squeakChoir: boolean;
    beanSingularity: boolean;
  };
  combo: {
    count: number;
    timer: number;
    best: number;
  };
  stats: {
    lifetimeBeans: number;
    cleanedPoops: number;
    goldenCleaned: number;
    stinkyCleaned: number;
    pigsAdopted: number;
    feedUpgrades: number;
    scoopUpgrades: number;
    roombaPurchased: boolean;
    rarePoopsCleaned: number;
    eventsSurvived: number;
    abilitiesUsed: number;
    furnitureBought: number;
    legendaryPigsAdopted: number;
    pigsLost: number;
    prestiges: number;
    eventResponses: number;
    objectivesCompleted: number;
    compostCleaned: number;
    blessedCleaned: number;
    royalCleaned: number;
    cursedCleaned: number;
    recipesUnlocked: number;
    wisdomPerks: number;
  };
  milestones: {
    quests: string[];
    achievements: string[];
  };
  log: string[];
}

export interface Costs {
  pig: number;
  feed: number;
  scoop: number;
  robot: number;
  cage: number;
  furniture: Record<FurnitureId, number>;
  rarePig: number;
  prestige: number;
}
