import type { AbilityId, Costs, FurnitureId, GameState, Pig, WisdomPerkId } from "./types";

export const CAGE_PADDING = 34;
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
const WISDOM_COSTS: Record<WisdomPerkId, number> = {
  roomyStart: 1,
  gentleAutomation: 1,
  rareInstinct: 2,
  chorusTraining: 2,
};

export function getCosts(state: GameState): Costs {
  const furniture = Object.fromEntries(
    (["hideyHouse", "tunnel", "litterTray", "chewToy", "snuggleSack", "cardboardCastle", "royalThrone"] as FurnitureId[]).map(
      (id) => [id, getFurnitureCost(state, id)],
    ),
  ) as Record<FurnitureId, number>;

  return {
    pig: Math.ceil(10 * 1.35 ** Math.max(0, state.pigs.length - 1)),
    feed: Math.ceil(18 * 1.6 ** state.upgrades.feedLevel),
    scoop: Math.ceil(14 * 1.7 ** state.upgrades.scoopLevel),
    robot: Math.max(45, ROBOT_COST - state.upgrades.scoopLevel * 5 - (state.wisdom.gentleAutomation ? 10 : 0)),
    cage: Math.ceil(60 * 2.1 ** state.upgrades.cageLevel),
    furniture,
    rarePig: Math.ceil(
      220 *
        1.8 ** state.stats.legendaryPigsAdopted *
        (state.recipes.beanBlessing ? 0.84 : 1) *
        (state.recipes.royalAccord ? 0.92 : 1),
    ),
    prestige: 5000,
  };
}

export function getPigCapacity(state: GameState): number {
  return 2 + state.upgrades.cageLevel * 2 + (state.wisdom.roomyStart ? 2 : 0) + (state.recipes.royalAccord ? 1 : 0);
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
    (total, id) => total + state.furniture[id] * FURNITURE_SPACE_COSTS[id],
    0,
  );
}

export function getAbilityCost(state: GameState, id: AbilityId): number {
  const discount = state.wisdom.chorusTraining ? 1 : 0;
  return Math.max(0, ABILITY_SQUEAK_COSTS[id] - discount - (state.lateGame.squeakChoir ? 1 : 0));
}

export function getAutomationFuelCost(state: GameState): number {
  return Math.max(5, 12 - state.upgrades.scoopLevel - (state.wisdom.gentleAutomation ? 3 : 0) - (state.recipes.compostCatalyst ? 2 : 0));
}

export function getWisdomCost(id: WisdomPerkId): number {
  return WISDOM_COSTS[id];
}

export function getTotalWisdom(state: GameState): number {
  return (
    state.cavyWisdom +
    (Object.keys(state.wisdom) as WisdomPerkId[]).reduce(
      (total, id) => total + (state.wisdom[id] ? WISDOM_COSTS[id] : 0),
      0,
    )
  );
}

export function getPigPoopInterval(state: GameState, pig: Pig): number {
  const feedMultiplier = 0.9 ** state.upgrades.feedLevel * (state.lateGame.hayDimension ? 0.88 : 1);
  const hayPenalty = state.needs.hay <= 0 ? 1.3 : state.needs.hay < 25 ? 1.15 : 1;
  const waterPenalty = state.needs.water <= 0 ? 1.2 : state.needs.water < 25 ? 1.1 : 1;
  const enrichmentMultiplier = 1 - Math.min(0.22, state.cage.enrichment / 500);
  const socialMultiplier = 1 - Math.min(0.18, state.cage.socialization / 600);
  const happinessMultiplier = state.cage.happiness >= 85 ? 0.88 : state.cage.happiness < 45 ? 1.22 : 1;
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
  return Math.ceil(baseCosts[id] * 1.75 ** state.furniture[id]);
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
