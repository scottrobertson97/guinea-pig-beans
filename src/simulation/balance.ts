import type { Costs, FurnitureId, GameState, Pig } from "./types";

export const CAGE_PADDING = 34;
export const BASE_POOP_INTERVAL = 5;
export const MAX_LOG_ITEMS = 8;
export const ROBOT_COST = 75;

export function getCosts(state: GameState): Costs {
  const furniture = Object.fromEntries(
    (["hideyHouse", "tunnel", "litterTray", "chewToy", "snuggleSack", "cardboardCastle", "royalThrone"] as FurnitureId[]).map(
      (id) => [id, getFurnitureCost(state, id)],
    ),
  ) as Record<FurnitureId, number>;

  return {
    pig: Math.ceil(15 * 1.35 ** Math.max(0, state.pigs.length - 1)),
    feed: Math.ceil(25 * 1.6 ** state.upgrades.feedLevel),
    scoop: Math.ceil(20 * 1.7 ** state.upgrades.scoopLevel),
    robot: ROBOT_COST,
    cage: Math.ceil(80 * 2.1 ** state.upgrades.cageLevel),
    furniture,
    rarePig: Math.ceil(220 * 1.8 ** state.stats.legendaryPigsAdopted),
    prestige: 5000,
  };
}

export function getScoopRadius(state: GameState): number {
  return 24 + state.upgrades.scoopLevel * 9;
}

export function getPigPoopInterval(state: GameState, pig: Pig): number {
  const feedMultiplier = 0.9 ** state.upgrades.feedLevel * (state.lateGame.hayDimension ? 0.88 : 1);
  const hayPenalty = state.needs.hay <= 0 ? 1.3 : state.needs.hay < 25 ? 1.15 : 1;
  const waterPenalty = state.needs.water <= 0 ? 1.2 : state.needs.water < 25 ? 1.1 : 1;
  const enrichmentMultiplier = 1 - Math.min(0.22, state.cage.enrichment / 500);
  const socialMultiplier = 1 - Math.min(0.18, state.cage.socialization / 600);
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
  const wisdomMultiplier = 0.98 ** state.cavyWisdom;
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
    eventMultiplier *
    abilityMultiplier *
    wisdomMultiplier
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
