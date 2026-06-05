import type { AbilityId, Costs, FurnitureId, GameState, Pig, WisdomPerkId } from "./types";

export const CAGE_PADDING = 34;
export const MAX_CAGE_LEVEL_FOR_SIZE = 7;
export const BASE_POOP_INTERVAL = 5;
export const MAX_LOG_ITEMS = 8;
export const ROBOT_COST = 75;
const FURNITURE_SPACE_COSTS: Record<FurnitureId, number> = {
  hideyHouse: 2,
  tunnel: 2,
  litterTray: 2,
  chewToy: 1,
  snuggleSack: 2,
  cardboardCastle: 3,
  royalThrone: 3,
};
const ABILITY_SQUEAK_COSTS: Record<AbilityId, number> = {
  wheekCall: 0,
  treatBag: 2,
  deepClean: 5,
  freshBedding: 3,
  snackTime: 4,
  zoomieMode: 3,
};
export type WisdomBranch = "Care" | "Herd" | "Automation" | "Rare Beans";
export type FurnitureSynergyId = "cozyCorner" | "zoomiePlayground" | "cleanupCircuit" | "royalCompostCourt";

export interface WisdomPerkDefinition {
  id: WisdomPerkId;
  branch: WisdomBranch;
  tier: number;
  label: string;
  description: string;
  cost: number;
  prerequisite?: WisdomPerkId;
}

export interface FurnitureSynergyDefinition {
  id: FurnitureSynergyId;
  name: string;
  furniture: [FurnitureId, FurnitureId];
  description: string;
}

export const FURNITURE_SYNERGIES: FurnitureSynergyDefinition[] = [
  {
    id: "cozyCorner",
    name: "Cozy Corner",
    furniture: ["hideyHouse", "snuggleSack"],
    description: "+8 socialization and +4 happiness from a dedicated quiet nest.",
  },
  {
    id: "zoomiePlayground",
    name: "Zoomie Playground",
    furniture: ["tunnel", "chewToy"],
    description: "Zoomies last longer, move pigs faster, and add extra enrichment.",
  },
  {
    id: "cleanupCircuit",
    name: "Cleanup Circuit",
    furniture: ["litterTray", "chewToy"],
    description: "The tray cleans more often and the Roomba senses and sweeps farther.",
  },
  {
    id: "royalCompostCourt",
    name: "Royal Compost Court",
    furniture: ["cardboardCastle", "royalThrone"],
    description: "Improves royal and compost bean odds and discounts legendary pigs.",
  },
];

const FURNITURE_SYNERGY_MAP = Object.fromEntries(
  FURNITURE_SYNERGIES.map((synergy) => [synergy.id, synergy]),
) as Record<FurnitureSynergyId, FurnitureSynergyDefinition>;

export const WISDOM_PERKS: WisdomPerkDefinition[] = [
  {
    id: "roomyStart",
    branch: "Care",
    tier: 1,
    label: "Roomy Start",
    description: "+2 pig capacity and more cage space.",
    cost: 1,
  },
  {
    id: "steadySupplies",
    branch: "Care",
    tier: 2,
    label: "Steady Supplies",
    description: "Hay and water drain 10% slower.",
    cost: 2,
    prerequisite: "roomyStart",
  },
  {
    id: "freshStart",
    branch: "Care",
    tier: 3,
    label: "Fresh Start",
    description: "Cleanliness gets a permanent +3 cushion.",
    cost: 3,
    prerequisite: "steadySupplies",
  },
  {
    id: "bondedBeginnings",
    branch: "Herd",
    tier: 1,
    label: "Bonded Beginnings",
    description: "Bonded pigs add more socialization.",
    cost: 1,
  },
  {
    id: "socialMemory",
    branch: "Herd",
    tier: 2,
    label: "Social Memory",
    description: "Every bonded pig adds extra socialization.",
    cost: 2,
    prerequisite: "bondedBeginnings",
  },
  {
    id: "chorusTraining",
    branch: "Herd",
    tier: 3,
    label: "Chorus Training",
    description: "Ability Squeak costs drop and Wheek Call gives more Squeaks.",
    cost: 3,
    prerequisite: "socialMemory",
  },
  {
    id: "gentleAutomation",
    branch: "Automation",
    tier: 1,
    label: "Gentle Automation",
    description: "Roomba and Compost fuel are cheaper.",
    cost: 1,
  },
  {
    id: "compostEngine",
    branch: "Automation",
    tier: 2,
    label: "Compost Engine",
    description: "Compost fuel is cheaper and compost beans age better.",
    cost: 2,
    prerequisite: "gentleAutomation",
  },
  {
    id: "trayAffinity",
    branch: "Automation",
    tier: 3,
    label: "Tray Affinity",
    description: "Litter Tray cleans farther and more often.",
    cost: 3,
    prerequisite: "compostEngine",
  },
  {
    id: "rareInstinct",
    branch: "Rare Beans",
    tier: 1,
    label: "Rare Instinct",
    description: "Rare bean odds and enrichment improve.",
    cost: 1,
  },
  {
    id: "goldenNose",
    branch: "Rare Beans",
    tier: 2,
    label: "Golden Nose",
    description: "Golden beans are more likely and worth more.",
    cost: 2,
    prerequisite: "rareInstinct",
  },
  {
    id: "royalMemory",
    branch: "Rare Beans",
    tier: 3,
    label: "Royal Memory",
    description: "Legendary pigs cost less and royal bean odds improve.",
    cost: 3,
    prerequisite: "goldenNose",
  },
];

const WISDOM_PERK_MAP = Object.fromEntries(WISDOM_PERKS.map((perk) => [perk.id, perk])) as Record<
  WisdomPerkId,
  WisdomPerkDefinition
>;

export function getCosts(state: GameState): Costs {
  const furniture = Object.fromEntries(
    (["hideyHouse", "tunnel", "litterTray", "chewToy", "snuggleSack", "cardboardCastle", "royalThrone"] as FurnitureId[]).map(
      (id) => [id, getFurnitureCost(state, id)],
    ),
  ) as Record<FurnitureId, number>;

  return {
    pig: state.pigs.length < 2 ? 0 : Math.ceil(10 * 1.35 ** Math.max(0, state.pigs.length - 1)),
    feed: Math.ceil(18 * 1.6 ** state.upgrades.feedLevel),
    scoop: Math.ceil(14 * 1.7 ** state.upgrades.scoopLevel),
    robot: Math.max(45, ROBOT_COST - state.upgrades.scoopLevel * 5 - (state.wisdom.gentleAutomation ? 10 : 0)),
    cage: Math.ceil(60 * 2.1 ** state.upgrades.cageLevel),
    furniture,
    rarePig: Math.ceil(
      220 *
        1.8 ** state.stats.legendaryPigsAdopted *
        (state.recipes.beanBlessing ? 0.84 : 1) *
        (state.recipes.royalAccord ? 0.92 : 1) *
        (state.wisdom.royalMemory ? 0.9 : 1) *
        (hasFurnitureSynergy(state, "royalCompostCourt") ? 0.94 : 1),
    ),
    prestige: getPrestigeCost(),
  };
}

export function getPrestigeCost(): number {
  return 5000;
}

export function getPrestigeProgress(state: GameState): number {
  return Math.max(0, state.stats.lifetimeBeans - state.prestige.lifetimeBeansClaimed);
}

export function getPrestigeWisdomGain(state: GameState): number {
  const progress = getPrestigeProgress(state);
  if (progress < getPrestigeCost()) return 0;
  return Math.max(1, Math.floor(Math.sqrt(progress / getPrestigeCost())));
}

export function getPigCapacity(state: GameState): number {
  return 2 + state.upgrades.cageLevel * 2 + (state.wisdom.roomyStart ? 2 : 0) + (state.recipes.royalAccord ? 1 : 0);
}

export function getCageDimensions(cageLevel: number): { width: number; height: number } {
  const level = Math.max(0, Math.min(MAX_CAGE_LEVEL_FOR_SIZE, Math.floor(cageLevel)));
  let width = 440;
  let height = 320;

  for (let step = 1; step <= level; step += 1) {
    width += 110 + step * 20;
    height += 85 + step * 15;
  }

  return { width, height };
}

export function getScoopRadius(state: GameState): number {
  return 24 + state.upgrades.scoopLevel * 9;
}

export function getFurnitureSpaceCost(id: FurnitureId): number {
  return FURNITURE_SPACE_COSTS[id];
}

export function getHabitatCapacity(state: GameState): number {
  return 5 + state.upgrades.cageLevel * 3 + (state.wisdom.roomyStart ? 4 : 0) + (state.lateGame.hayDimension ? 2 : 0);
}

export function getFurnitureSpaceUsed(state: GameState): number {
  return (Object.keys(FURNITURE_SPACE_COSTS) as FurnitureId[]).reduce(
    (total, id) => total + (state.furniture[id] ? FURNITURE_SPACE_COSTS[id] : 0),
    0,
  );
}

export function getUnlockedFurnitureCount(state: GameState): number {
  return (Object.keys(FURNITURE_SPACE_COSTS) as FurnitureId[]).reduce(
    (total, id) => total + Number(state.furniture[id]),
    0,
  );
}

export function getAbilityCost(state: GameState, id: AbilityId): number {
  const discount = state.wisdom.chorusTraining ? 1 : 0;
  return Math.max(0, ABILITY_SQUEAK_COSTS[id] - discount - (state.lateGame.squeakChoir ? 1 : 0));
}

export function getAutomationFuelCost(state: GameState): number {
  return Math.max(
    3,
    12 -
      state.upgrades.scoopLevel -
      (state.wisdom.gentleAutomation ? 3 : 0) -
      (state.wisdom.compostEngine ? 2 : 0) -
      (state.recipes.compostCatalyst ? 2 : 0),
  );
}

export function getWisdomCost(id: WisdomPerkId): number {
  return getWisdomPerk(id).cost;
}

export function getWisdomPerk(id: WisdomPerkId): WisdomPerkDefinition {
  return WISDOM_PERK_MAP[id];
}

export function getWisdomPerks(): WisdomPerkDefinition[] {
  return WISDOM_PERKS;
}

export function getFurnitureSynergies(): FurnitureSynergyDefinition[] {
  return FURNITURE_SYNERGIES;
}

export function getFurnitureSynergy(id: FurnitureSynergyId): FurnitureSynergyDefinition {
  return FURNITURE_SYNERGY_MAP[id];
}

export function hasFurnitureSynergy(state: GameState, id: FurnitureSynergyId): boolean {
  const synergy = getFurnitureSynergy(id);
  return synergy.furniture.every((furnitureId) => state.furniture[furnitureId]);
}

export function getActiveFurnitureSynergies(state: GameState): FurnitureSynergyDefinition[] {
  return FURNITURE_SYNERGIES.filter((synergy) => hasFurnitureSynergy(state, synergy.id));
}

export function canBuyWisdomPerk(state: GameState, id: WisdomPerkId): boolean {
  const perk = getWisdomPerk(id);
  return (
    !state.wisdom[id] &&
    state.cavyWisdom >= perk.cost &&
    (!perk.prerequisite || state.wisdom[perk.prerequisite])
  );
}

export function getTotalWisdom(state: GameState): number {
  return (
    state.cavyWisdom +
    getWisdomPerks().reduce((total, perk) => total + (state.wisdom[perk.id] ? perk.cost : 0), 0)
  );
}

export function getPigPoopInterval(state: GameState, pig: Pig): number {
  const feedMultiplier = 0.9 ** state.upgrades.feedLevel * (state.lateGame.hayDimension ? 0.88 : 1);
  const hayPenalty = state.needs.hay <= 0 ? 1.3 : state.needs.hay < 25 ? 1.15 : 1;
  const waterPenalty = state.needs.water <= 0 ? 1.2 : state.needs.water < 25 ? 1.1 : 1;
  const enrichmentMultiplier = 1 - Math.min(0.22, state.cage.enrichment / 500);
  const socialMultiplier = 1 - Math.min(0.18, state.cage.socialization / 600);
  const happinessMultiplier = state.cage.happiness >= 85 ? 0.88 : state.cage.happiness < 45 ? 1.22 : 1;
  const favoriteZoneMultiplier =
    state.ecology.zones.some((zone) => zone.id === pig.favoriteZone && zone.pigIds.includes(pig.id) && zone.comfort >= 62)
      ? 0.92
      : 1;
  const stressMultiplier = 1 + Math.min(0.28, Math.max(0, pig.stress) / 260);
  const eventMultiplier =
    state.event.active?.id === "hayFrenzy" || state.event.active?.id === "greatWheeking"
      ? 0.68
      : state.event.active?.id === "napTime"
        ? 1.8
        : 1;
  const abilityMultiplier =
    state.abilities.treatBag > 0 || state.abilities.zoomieMode > 0 ? 0.72 : 1;
  const messPenalty =
    pig.trait === "Gremlin" && state.cage.cleanliness < 60
      ? 0.82
      : state.cage.cleanliness < 35
        ? 1.2
        : 1;
  const traitMultiplier = getTraitPoopMultiplier(pig);
  const breedMultiplier = getBreedPoopMultiplier(pig);
  const wisdomMultiplier = 0.98 ** getTotalWisdom(state);
  const earlyMultiplier = state.stats.cleanedPoops < 5 ? 0.64 : state.stats.cleanedPoops < 15 ? 0.82 : 1;
  return (
    BASE_POOP_INTERVAL *
    feedMultiplier *
    hayPenalty *
    waterPenalty *
    messPenalty *
    traitMultiplier *
    breedMultiplier *
    enrichmentMultiplier *
    socialMultiplier *
    happinessMultiplier *
    favoriteZoneMultiplier *
    stressMultiplier *
    eventMultiplier *
    abilityMultiplier *
    wisdomMultiplier *
    earlyMultiplier
  );
}

function getFurnitureCost(state: GameState, id: FurnitureId): number {
  const baseCosts: Record<FurnitureId, number> = {
    hideyHouse: 35,
    tunnel: 45,
    litterTray: 60,
    chewToy: 70,
    snuggleSack: 95,
    cardboardCastle: 130,
    royalThrone: 300,
  };
  return baseCosts[id];
}

function getTraitPoopMultiplier(pig: Pig): number {
  if (pig.trait === "Chonker") return 1.25;
  if (pig.trait === "Zoomer") return 0.9;
  if (pig.trait === "Neat Freak") return 1.05;
  if (pig.trait === "Hay Goblin") return 0.82;
  if (pig.trait === "Compost Mystic") return 1.08;
  return 1;
}

function getBreedPoopMultiplier(pig: Pig): number {
  if (pig.breed === "Rex") return 0.92;
  if (pig.breed === "Abyssinian") return 0.96;
  if (pig.breed === "Skinny Pig") return 1.08;
  if (pig.breed === "Silkie") return 1.12;
  return 1;
}
