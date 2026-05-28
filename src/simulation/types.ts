export type PigMood = "content" | "hungry" | "thirsty" | "messy";
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
  | "cursed";
export type RobotState = "wandering" | "sweeping";
export type FurnitureId =
  | "hideyHouse"
  | "tunnel"
  | "litterTray"
  | "chewToy"
  | "snuggleSack"
  | "cardboardCastle"
  | "royalThrone";
export type AbilityId = "wheekCall" | "treatBag" | "deepClean" | "freshBedding" | "snackTime" | "zoomieMode";
export type EventId =
  | "zoomies"
  | "hayFrenzy"
  | "napTime"
  | "bottleJam"
  | "cageInspection"
  | "compostBloom"
  | "greatWheeking";

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
    enrichment: number;
    socialization: number;
    space: number;
  };
  furniture: Record<FurnitureId, number>;
  abilities: Record<AbilityId, number>;
  event: {
    active: ActiveEvent | null;
    nextTimer: number;
    bottleJammed: boolean;
  };
  prestige: {
    ascensions: number;
    unlocked: string[];
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
    prestiges: number;
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
