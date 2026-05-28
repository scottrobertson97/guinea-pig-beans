import { addLog } from "./state";
import type { GameState } from "./types";

export interface MilestoneView {
  id: string;
  title: string;
  progress: string;
  complete: boolean;
}

interface MilestoneDefinition {
  id: string;
  title: string;
  complete: (state: GameState) => boolean;
  progress: (state: GameState) => string;
  log: string;
}

const questDefinitions: MilestoneDefinition[] = [
  {
    id: "clean-10",
    title: "Clean 10 beans",
    complete: (state) => state.stats.cleanedPoops >= 10,
    progress: (state) => `${Math.min(state.stats.cleanedPoops, 10)}/10`,
    log: "Quest complete: the first ten beans have been handled.",
  },
  {
    id: "reach-100-beans",
    title: "Reach 100 Beans",
    complete: (state) => state.beans >= 100 || state.stats.lifetimeBeans >= 100,
    progress: (state) => `${Math.min(Math.floor(Math.max(state.beans, state.stats.lifetimeBeans)), 100)}/100`,
    log: "Quest complete: 100 Beans. The economy has begun.",
  },
  {
    id: "adopt-second-pig",
    title: "Adopt a second pig",
    complete: (state) => state.pigs.length >= 2,
    progress: (state) => `${Math.min(state.pigs.length, 2)}/2`,
    log: "Quest complete: the herd is officially plural.",
  },
  {
    id: "buy-scoop",
    title: "Buy Better Scoop",
    complete: (state) => state.upgrades.scoopLevel >= 1,
    progress: (state) => `${Math.min(state.upgrades.scoopLevel, 1)}/1`,
    log: "Quest complete: your scoop technology has advanced.",
  },
  {
    id: "clean-streak-5",
    title: "Hit Clean Streak x5",
    complete: (state) => state.combo.best >= 5,
    progress: (state) => `${Math.min(state.combo.best, 5)}/5`,
    log: "Quest complete: Clean Streak x5. Heroic and unpleasant.",
  },
  {
    id: "unlock-roomba",
    title: "Unlock Poop Roomba",
    complete: (state) => Boolean(state.robot),
    progress: (state) => (state.robot ? "1/1" : "0/1"),
    log: "Quest complete: automation has entered the cage.",
  },
  {
    id: "buy-furniture",
    title: "Add cage furniture",
    complete: (state) => state.stats.furnitureBought >= 1,
    progress: (state) => `${Math.min(state.stats.furnitureBought, 1)}/1`,
    log: "Quest complete: the cage has furniture now.",
  },
  {
    id: "clean-rare",
    title: "Clean 5 rare beans",
    complete: (state) => state.stats.rarePoopsCleaned >= 5,
    progress: (state) => `${Math.min(state.stats.rarePoopsCleaned, 5)}/5`,
    log: "Quest complete: rare bean handling is now part of the job.",
  },
  {
    id: "use-ability",
    title: "Use an active ability",
    complete: (state) => state.stats.abilitiesUsed >= 1,
    progress: (state) => `${Math.min(state.stats.abilitiesUsed, 1)}/1`,
    log: "Quest complete: direct intervention has begun.",
  },
  {
    id: "adopt-legend",
    title: "Adopt a legendary pig",
    complete: (state) => state.stats.legendaryPigsAdopted >= 1,
    progress: (state) => `${Math.min(state.stats.legendaryPigsAdopted, 1)}/1`,
    log: "Quest complete: a legendary pig has entered the story.",
  },
  {
    id: "prestige",
    title: "Enter the Great Composting",
    complete: (state) => state.stats.prestiges >= 1,
    progress: (state) => `${Math.min(state.stats.prestiges, 1)}/1`,
    log: "Quest complete: the Great Composting has occurred.",
  },
];

const achievementDefinitions: MilestoneDefinition[] = [
  {
    id: "first-bean",
    title: "First Bean",
    complete: (state) => state.stats.cleanedPoops >= 1,
    progress: (state) => `${Math.min(state.stats.cleanedPoops, 1)}/1`,
    log: "Achievement unlocked: First Bean.",
  },
  {
    id: "gold-rush",
    title: "Gold Rush",
    complete: (state) => state.stats.goldenCleaned >= 1,
    progress: (state) => `${Math.min(state.stats.goldenCleaned, 1)}/1`,
    log: "Achievement unlocked: Gold Rush.",
  },
  {
    id: "cage-goblin",
    title: "Cage Goblin",
    complete: (state) => state.cage.cleanliness < 10,
    progress: (state) => `${Math.max(0, 10 - state.cage.cleanliness)}/10`,
    log: "Achievement unlocked: Cage Goblin. The bedding will remember this.",
  },
  {
    id: "oops-all-poop",
    title: "Oops, All Poop",
    complete: (state) => state.poops.length >= 50,
    progress: (state) => `${Math.min(state.poops.length, 50)}/50`,
    log: "Achievement unlocked: Oops, All Poop.",
  },
  {
    id: "bean-counter",
    title: "Bean Counter",
    complete: (state) => state.stats.lifetimeBeans >= 1000,
    progress: (state) => `${Math.min(Math.floor(state.stats.lifetimeBeans), 1000)}/1000`,
    log: "Achievement unlocked: Bean Counter.",
  },
  {
    id: "the-janitor-rises",
    title: "The Janitor Rises",
    complete: (state) => state.stats.roombaPurchased,
    progress: (state) => (state.stats.roombaPurchased ? "1/1" : "0/1"),
    log: "Achievement unlocked: The Janitor Rises.",
  },
  {
    id: "wheek-shall-overcome",
    title: "Wheek Shall Overcome",
    complete: (state) => state.pigs.length >= 10,
    progress: (state) => `${Math.min(state.pigs.length, 10)}/10`,
    log: "Achievement unlocked: Wheek Shall Overcome.",
  },
  {
    id: "rare-bean-counter",
    title: "Rare Bean Counter",
    complete: (state) => state.stats.rarePoopsCleaned >= 25,
    progress: (state) => `${Math.min(state.stats.rarePoopsCleaned, 25)}/25`,
    log: "Achievement unlocked: Rare Bean Counter.",
  },
  {
    id: "interior-designer",
    title: "Interior Designer",
    complete: (state) => state.stats.furnitureBought >= 5,
    progress: (state) => `${Math.min(state.stats.furnitureBought, 5)}/5`,
    log: "Achievement unlocked: Interior Designer.",
  },
  {
    id: "eventful",
    title: "Eventful",
    complete: (state) => state.stats.eventsSurvived >= 5,
    progress: (state) => `${Math.min(state.stats.eventsSurvived, 5)}/5`,
    log: "Achievement unlocked: Eventful.",
  },
  {
    id: "poop-baron",
    title: "Poop Baron",
    complete: (state) => state.stats.lifetimeBeans >= 1_000_000,
    progress: (state) => `${Math.min(Math.floor(state.stats.lifetimeBeans), 1_000_000)}/1000000`,
    log: "Achievement unlocked: Poop Baron.",
  },
  {
    id: "the-poopening",
    title: "The Poopening",
    complete: (state) => state.stats.prestiges >= 1,
    progress: (state) => `${Math.min(state.stats.prestiges, 1)}/1`,
    log: "Achievement unlocked: The Poopening.",
  },
];

export function updateMilestones(state: GameState): void {
  completeMilestones(state, questDefinitions, state.milestones.quests);
  completeMilestones(state, achievementDefinitions, state.milestones.achievements);
}

export function getQuestViews(state: GameState): MilestoneView[] {
  return questDefinitions.map((definition) => toView(definition, state, state.milestones.quests));
}

export function getAchievementViews(state: GameState): MilestoneView[] {
  return achievementDefinitions.map((definition) =>
    toView(definition, state, state.milestones.achievements),
  );
}

function completeMilestones(
  state: GameState,
  definitions: MilestoneDefinition[],
  completedIds: string[],
): void {
  for (const definition of definitions) {
    if (!completedIds.includes(definition.id) && definition.complete(state)) {
      completedIds.push(definition.id);
      addLog(state, definition.log);
    }
  }
}

function toView(
  definition: MilestoneDefinition,
  state: GameState,
  completedIds: string[],
): MilestoneView {
  return {
    id: definition.id,
    title: definition.title,
    progress: definition.progress(state),
    complete: completedIds.includes(definition.id),
  };
}
