export type PigMood = "content" | "hungry" | "thirsty" | "messy";
export type PigBreed = "American" | "Abyssinian" | "Peruvian" | "Teddy" | "Rex";
export type PigTrait = "Chonker" | "Zoomer" | "Neat Freak" | "Gremlin";
export type PoopType = "normal" | "golden" | "stinky";

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

export interface GameState {
  beans: number;
  pigs: Pig[];
  poops: Poop[];
  upgrades: {
    feedLevel: number;
    scoopLevel: number;
  };
  needs: {
    hay: number;
    water: number;
  };
  cage: {
    width: number;
    height: number;
    cleanliness: number;
  };
  log: string[];
}

export interface Costs {
  pig: number;
  feed: number;
  scoop: number;
}
