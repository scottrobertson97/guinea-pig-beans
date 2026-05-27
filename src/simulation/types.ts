export type PigMood = "content" | "hungry" | "thirsty" | "messy";

export interface Pig {
  id: number;
  name: string;
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
  x: number;
  y: number;
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
