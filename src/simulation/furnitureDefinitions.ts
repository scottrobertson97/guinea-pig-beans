import type { CageZoneId, FurnitureId } from "./types";

export interface FurnitureDefinition {
  id: FurnitureId;
  label: string;
  careZoneId: CageZoneId;
  placement: {
    x: number;
    y: number;
  };
}

export const FURNITURE_DEFINITIONS: Record<FurnitureId, FurnitureDefinition> = {
  hideyHouse: {
    id: "hideyHouse",
    label: "Hidey House",
    careZoneId: "hideyZone",
    placement: { x: 0.17, y: 0.78 },
  },
  tunnel: {
    id: "tunnel",
    label: "Tunnel",
    careZoneId: "playRun",
    placement: { x: 0.33, y: 0.52 },
  },
  litterTray: {
    id: "litterTray",
    label: "Litter Tray",
    careZoneId: "litterCorner",
    placement: { x: 0.83, y: 0.8 },
  },
  chewToy: {
    id: "chewToy",
    label: "Chew Toy",
    careZoneId: "playRun",
    placement: { x: 0.52, y: 0.5 },
  },
  snuggleSack: {
    id: "snuggleSack",
    label: "Snuggle Sack",
    careZoneId: "hideyZone",
    placement: { x: 0.5, y: 0.76 },
  },
  cardboardCastle: {
    id: "cardboardCastle",
    label: "Cardboard Castle",
    careZoneId: "royalCourt",
    placement: { x: 0.22, y: 0.28 },
  },
  royalThrone: {
    id: "royalThrone",
    label: "Royal Throne",
    careZoneId: "royalCourt",
    placement: { x: 0.82, y: 0.31 },
  },
};

export const FURNITURE_IDS = Object.keys(FURNITURE_DEFINITIONS) as FurnitureId[];

export function getFurnitureDefinition(id: FurnitureId): FurnitureDefinition {
  return FURNITURE_DEFINITIONS[id];
}

export function getFurnitureName(id: FurnitureId): string {
  return getFurnitureDefinition(id).label;
}

export function getFurnitureCareZoneId(id: FurnitureId): CageZoneId {
  return getFurnitureDefinition(id).careZoneId;
}
