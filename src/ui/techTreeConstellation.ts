import type { TechBranchId, TechNodeId } from "../simulation/types";

export const TECH_MAP_WIDTH = 1940;
export const TECH_MAP_HEIGHT = 1420;

export const TECH_NODE_WIDTH = 64;
export const TECH_NODE_HEIGHT = 64;

export interface TechBranchVisual {
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  border: string;
  soft: string;
}

export interface TechNodeLayout {
  x: number;
  y: number;
}

export interface TechNodeIcon {
  path: string;
  code: string;
}

export const TECH_BRANCH_VISUALS: Record<TechBranchId, TechBranchVisual> = {
  care: {
    label: "Care & Cage",
    shortLabel: "Care",
    icon: "C",
    color: "#4f8f45",
    border: "rgba(79, 143, 69, 0.46)",
    soft: "rgba(127, 178, 105, 0.16)",
  },
  habitat: {
    label: "Habitat",
    shortLabel: "Habitat",
    icon: "H",
    color: "#b17b2a",
    border: "rgba(177, 123, 42, 0.44)",
    soft: "rgba(213, 161, 73, 0.15)",
  },
  automation: {
    label: "Automation",
    shortLabel: "Auto",
    icon: "A",
    color: "#2f8c9f",
    border: "rgba(47, 140, 159, 0.42)",
    soft: "rgba(72, 170, 185, 0.14)",
  },
  abilities: {
    label: "Abilities & Rare Beans",
    shortLabel: "Rare",
    icon: "R",
    color: "#a24f8b",
    border: "rgba(162, 79, 139, 0.42)",
    soft: "rgba(196, 95, 168, 0.13)",
  },
  wisdom: {
    label: "Wisdom Legacy",
    shortLabel: "Wisdom",
    icon: "W",
    color: "#6f5aa8",
    border: "rgba(111, 90, 168, 0.42)",
    soft: "rgba(139, 119, 194, 0.13)",
  },
};

export const TECH_NODE_ICONS: Record<TechNodeId, TechNodeIcon> = {
  betterHay: { path: "assets/sprites/decor/hay_rack_full.png", code: "HY" },
  hayDimension: { path: "assets/sprites/decor/hay_rack_full.png", code: "HD" },
  betterScoop: { path: "assets/ui/scooper_cursor.png", code: "SC" },
  biggerCage: { path: "assets/sprites/pigs/pig_cream_brown_idle.png", code: "CG" },
  cleanStreakTraining: { path: "assets/ui/golden_scooper_cursor.png", code: "ST" },
  careRoutines: { path: "assets/sprites/decor/water_bottle_full.png", code: "CR" },

  hideyHouse: { path: "assets/sprites/decor/hidey_house.png", code: "HH" },
  snuggleSack: { path: "assets/sprites/decor/snuggle_sack.png", code: "SS" },
  cozyCorner: { path: "assets/sprites/decor/snuggle_sack.png", code: "CC" },
  tunnel: { path: "assets/sprites/decor/toy_tunnel_blue.png", code: "TN" },
  chewToy: { path: "assets/sprites/decor/toy_pile.png", code: "CT" },
  zoomiePlayground: { path: "assets/sprites/decor/toy_tunnel_blue.png", code: "ZP" },
  litterTray: { path: "assets/sprites/decor/litter_tray_clean.png", code: "LT" },
  cleanupCircuit: { path: "assets/sprites/decor/litter_tray_clean.png", code: "CC" },
  cardboardCastle: { path: "assets/sprites/decor/hidey_house.png", code: "CS" },
  royalThrone: { path: "assets/sprites/decor/royal_throne.png", code: "RT" },
  royalCompostCourt: { path: "assets/sprites/decor/royal_throne.png", code: "RC" },
  furnitureCareKit: { path: "assets/sprites/upgrades/roaming_dustpan.png", code: "FK" },
  habitatStewardKit: { path: "assets/sprites/decor/toy_pile.png", code: "HS" },

  poopRoomba: { path: "assets/sprites/upgrades/cavybot_3000.png", code: "RB" },
  compostOverdrive: { path: "assets/sprites/upgrades/compost_bin.png", code: "CO" },
  automationDirectives: { path: "assets/sprites/upgrades/cavybot_3000.png", code: "AD" },
  roombaSensors: { path: "assets/sprites/upgrades/cavybot_3000.png", code: "RS" },
  litterMethod: { path: "assets/sprites/decor/litter_tray_clean.png", code: "LM" },
  rareGuardProtocol: { path: "assets/sprites/upgrades/cavybot_3000.png", code: "RG" },

  abilityWheekCall: { path: "assets/sprites/pigs/pig_white_black_idle.png", code: "WH" },
  abilityTreatBag: { path: "assets/sprites/beans/bean_normal.png", code: "TB" },
  abilityFreshBedding: { path: "assets/sprites/decor/snuggle_sack.png", code: "FB" },
  abilitySnackTime: { path: "assets/sprites/beans/bean_golden.png", code: "SN" },
  abilityZoomieMode: { path: "assets/sprites/decor/toy_tunnel_blue.png", code: "ZM" },
  abilityDeepClean: { path: "assets/ui/golden_scooper_cursor.png", code: "DC" },
  squeakTraining: { path: "assets/sprites/pigs/pig_russet_idle.png", code: "SQ" },
  rareCatalog: { path: "assets/sprites/beans/bean_rainbow.png", code: "RC" },
  beanBlessing: { path: "assets/sprites/beans/bean_rainbow.png", code: "BB" },
  compostCatalyst: { path: "assets/sprites/beans/bean_compost.png", code: "CP" },
  royalAccord: { path: "assets/sprites/beans/bean_golden.png", code: "RA" },
  beanExchange: { path: "assets/sprites/beans/bean_aged.png", code: "EX" },
  goldenScoop: { path: "assets/ui/golden_scooper_cursor.png", code: "GS" },
  singularityExperiment: { path: "assets/sprites/beans/bean_rainbow.png", code: "SX" },
  singularityStabilizers: { path: "assets/sprites/upgrades/compost_bin.png", code: "SZ" },

  greatComposting: { path: "assets/sprites/upgrades/compost_bin.png", code: "GC" },
  roomyStart: { path: "assets/sprites/pigs/pig_cream_brown_idle.png", code: "RM" },
  steadySupplies: { path: "assets/sprites/decor/hay_rack_full.png", code: "SP" },
  freshStart: { path: "assets/ui/scooper_cursor.png", code: "FS" },
  gentleCare: { path: "assets/sprites/decor/water_bottle_full.png", code: "GC" },
  bondedBeginnings: { path: "assets/sprites/pigs/pig_tricolor_idle.png", code: "BB" },
  socialMemory: { path: "assets/sprites/pigs/pig_gray_white_idle.png", code: "SM" },
  chorusTraining: { path: "assets/sprites/pigs/pig_russet_idle.png", code: "CH" },
  gentleAutomation: { path: "assets/sprites/upgrades/cavybot_3000.png", code: "GA" },
  compostEngine: { path: "assets/sprites/upgrades/compost_bin.png", code: "CE" },
  trayAffinity: { path: "assets/sprites/decor/litter_tray_clean.png", code: "TA" },
  automationSteward: { path: "assets/sprites/upgrades/cavybot_3000.png", code: "AS" },
  rareInstinct: { path: "assets/sprites/beans/bean_rainbow.png", code: "RI" },
  goldenNose: { path: "assets/sprites/beans/bean_golden.png", code: "GN" },
  royalMemory: { path: "assets/sprites/decor/royal_throne.png", code: "RM" },
  rareBeanAlchemy: { path: "assets/sprites/beans/bean_rainbow.png", code: "RA" },
};

export const TECH_NODE_LAYOUT: Record<TechNodeId, TechNodeLayout> = {
  betterHay: { x: 140, y: 140 },
  hayDimension: { x: 340, y: 140 },
  betterScoop: { x: 140, y: 280 },
  cleanStreakTraining: { x: 340, y: 280 },
  careRoutines: { x: 540, y: 280 },
  biggerCage: { x: 140, y: 420 },

  hideyHouse: { x: 140, y: 560 },
  snuggleSack: { x: 340, y: 560 },
  cozyCorner: { x: 540, y: 560 },
  furnitureCareKit: { x: 540, y: 680 },
  habitatStewardKit: { x: 740, y: 560 },
  tunnel: { x: 140, y: 700 },
  chewToy: { x: 340, y: 700 },
  zoomiePlayground: { x: 740, y: 700 },
  litterTray: { x: 140, y: 840 },
  cleanupCircuit: { x: 740, y: 960 },
  cardboardCastle: { x: 140, y: 1020 },
  royalThrone: { x: 340, y: 1020 },
  royalCompostCourt: { x: 540, y: 1080 },

  poopRoomba: { x: 340, y: 840 },
  automationDirectives: { x: 540, y: 760 },
  compostOverdrive: { x: 540, y: 840 },
  roombaSensors: { x: 540, y: 920 },
  litterMethod: { x: 740, y: 840 },
  rareGuardProtocol: { x: 940, y: 760 },

  abilityWheekCall: { x: 140, y: 1180 },
  abilityTreatBag: { x: 340, y: 1180 },
  abilitySnackTime: { x: 540, y: 1180 },
  abilityFreshBedding: { x: 340, y: 1100 },
  abilityDeepClean: { x: 740, y: 1040 },
  abilityZoomieMode: { x: 740, y: 1120 },
  squeakTraining: { x: 340, y: 1300 },
  rareCatalog: { x: 540, y: 1300 },
  beanBlessing: { x: 740, y: 1300 },
  compostCatalyst: { x: 940, y: 1240 },
  royalAccord: { x: 940, y: 1360 },
  beanExchange: { x: 1140, y: 1240 },
  goldenScoop: { x: 1340, y: 1180 },
  singularityExperiment: { x: 1140, y: 1360 },
  singularityStabilizers: { x: 1340, y: 1360 },

  greatComposting: { x: 980, y: 560 },
  roomyStart: { x: 1160, y: 340 },
  steadySupplies: { x: 1340, y: 260 },
  freshStart: { x: 1520, y: 200 },
  gentleCare: { x: 1700, y: 200 },
  bondedBeginnings: { x: 1160, y: 480 },
  socialMemory: { x: 1340, y: 480 },
  chorusTraining: { x: 1520, y: 480 },
  gentleAutomation: { x: 1160, y: 620 },
  compostEngine: { x: 1340, y: 620 },
  trayAffinity: { x: 1520, y: 620 },
  automationSteward: { x: 1700, y: 620 },
  rareInstinct: { x: 1160, y: 760 },
  goldenNose: { x: 1340, y: 820 },
  royalMemory: { x: 1520, y: 880 },
  rareBeanAlchemy: { x: 1700, y: 880 },
};

export function getTechLinkPath(from: TechNodeLayout, to: TechNodeLayout): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const curve = Math.max(72, Math.min(220, Math.abs(dx) * 0.45));
    const direction = Math.sign(dx) || 1;
    return `M ${from.x} ${from.y} C ${from.x + curve * direction} ${from.y}, ${to.x - curve * direction} ${to.y}, ${to.x} ${to.y}`;
  }

  const curve = Math.max(58, Math.min(180, Math.abs(dy) * 0.45));
  const direction = Math.sign(dy) || 1;
  return `M ${from.x} ${from.y} C ${from.x} ${from.y + curve * direction}, ${to.x} ${to.y - curve * direction}, ${to.x} ${to.y}`;
}
