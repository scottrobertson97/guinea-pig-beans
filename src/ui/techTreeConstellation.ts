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

export interface TechBranchRegion {
  id: TechBranchId;
  x: number;
  y: number;
  width: number;
  height: number;
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

export const TECH_BRANCH_REGIONS: TechBranchRegion[] = [
  { id: "care", x: 36, y: 52, width: 620, height: 360 },
  { id: "automation", x: 490, y: 250, width: 720, height: 430 },
  { id: "habitat", x: 36, y: 438, width: 1160, height: 590 },
  { id: "wisdom", x: 1040, y: 220, width: 860, height: 720 },
  { id: "abilities", x: 36, y: 948, width: 1840, height: 440 },
];

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
  betterScoop: { x: 130, y: 160 },
  cleanStreakTraining: { x: 330, y: 150 },
  careRoutines: { x: 530, y: 150 },
  biggerCage: { x: 130, y: 330 },
  betterHay: { x: 330, y: 330 },
  hayDimension: { x: 530, y: 330 },

  litterTray: { x: 330, y: 520 },
  poopRoomba: { x: 560, y: 500 },
  automationDirectives: { x: 760, y: 430 },
  roombaSensors: { x: 960, y: 430 },
  compostOverdrive: { x: 760, y: 300 },
  litterMethod: { x: 960, y: 560 },
  rareGuardProtocol: { x: 1160, y: 500 },

  tunnel: { x: 130, y: 610 },
  chewToy: { x: 330, y: 690 },
  cleanupCircuit: { x: 560, y: 640 },
  zoomiePlayground: { x: 760, y: 650 },
  abilityZoomieMode: { x: 960, y: 710 },
  hideyHouse: { x: 130, y: 790 },
  snuggleSack: { x: 330, y: 870 },
  cozyCorner: { x: 130, y: 930 },
  furnitureCareKit: { x: 560, y: 780 },
  habitatStewardKit: { x: 760, y: 790 },
  cardboardCastle: { x: 760, y: 960 },
  royalThrone: { x: 960, y: 960 },
  royalCompostCourt: { x: 1160, y: 960 },

  abilityWheekCall: { x: 130, y: 1080 },
  abilityTreatBag: { x: 330, y: 1040 },
  abilitySnackTime: { x: 530, y: 1040 },
  abilityFreshBedding: { x: 330, y: 1178 },
  abilityDeepClean: { x: 560, y: 1178 },
  squeakTraining: { x: 760, y: 1110 },
  rareCatalog: { x: 760, y: 1240 },
  beanBlessing: { x: 960, y: 1240 },
  compostCatalyst: { x: 1160, y: 1160 },
  royalAccord: { x: 1360, y: 1100 },
  beanExchange: { x: 1360, y: 1240 },
  goldenScoop: { x: 1580, y: 1160 },
  singularityExperiment: { x: 1580, y: 1320 },
  singularityStabilizers: { x: 1760, y: 1320 },

  greatComposting: { x: 1120, y: 650 },
  roomyStart: { x: 1320, y: 430 },
  steadySupplies: { x: 1500, y: 330 },
  freshStart: { x: 1680, y: 250 },
  gentleCare: { x: 1840, y: 250 },
  bondedBeginnings: { x: 1320, y: 570 },
  socialMemory: { x: 1500, y: 570 },
  chorusTraining: { x: 1680, y: 570 },
  gentleAutomation: { x: 1320, y: 700 },
  compostEngine: { x: 1500, y: 700 },
  trayAffinity: { x: 1680, y: 700 },
  automationSteward: { x: 1840, y: 700 },
  rareInstinct: { x: 1320, y: 840 },
  goldenNose: { x: 1500, y: 840 },
  royalMemory: { x: 1680, y: 840 },
  rareBeanAlchemy: { x: 1840, y: 840 },
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
