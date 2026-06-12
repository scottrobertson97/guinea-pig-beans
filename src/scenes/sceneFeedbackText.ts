import { isPigComfortableInFavoriteZone } from "../simulation/ecology";
import type { CleanedPoop } from "../simulation/actions";
import type { AbilityId, GameState, Pig } from "../simulation/types";
import type { SceneFeedbackDetail } from "../ui/events";

export function getPigThoughtText(pig: Pig, state: GameState): string {
  if (pig.stress >= 72) return "Too much";
  if (pig.stress >= 48) return "Uneasy";
  if (pig.goal === "seekFood") return "Hay?";
  if (pig.goal === "sleep") return "Zzz";
  if (pig.goal === "seekSleep") return "Nap?";
  if (pig.goal === "eat") return state.needs.hay > 0 ? "Nibble" : "Hay!";
  if (pig.goal === "seekWater") return state.event.bottleJammed ? "Stuck?" : "Bottle?";
  if (pig.goal === "drink") return state.needs.water > 0 && !state.event.bottleJammed ? "Sip" : "H2O";
  if (pig.goal === "seekPlay") return "Play?";
  if (pig.goal === "playWithPig") return "Together";
  if (pig.goal === "playWithFurniture") return "Toy!";
  if (isPigComfortableInFavoriteZone(state, pig)) return "Cozy";
  if (pig.goal === "roam" && Math.min(pig.hunger, pig.thirst, pig.energy) > 55) return "Roam";
  if (state.needs.hay < 25 || pig.mood === "hungry") return "Hay?";
  if (state.needs.water < 25 || pig.mood === "thirsty") return "H2O";
  if (pig.mood === "messy" || state.cage.cleanliness < 45) return "Clean?";
  if (pig.trait === "Neat Freak") return "Tray";
  if (pig.trait === "Hay Goblin") return "Hay!";
  if (pig.trait === "Shy Beaner") return "Hide";
  if (pig.trait === "Royal Pig") return "Royal";
  if (pig.trait === "Zoomer") return "Run!";
  if (pig.trait === "Compost Mystic") return "Hmm";
  return "Sniff";
}

export function getClickReactionText(pig: Pig): string {
  if (pig.trait === "Zoomer") return "Zoom?";
  if (pig.trait === "Neat Freak") return "Clean?";
  if (pig.trait === "Shy Beaner") return "Hi?";
  if (pig.trait === "Royal Pig") return "Yes?";
  return "Sniff";
}

export function getAbilityReaction(abilityId?: AbilityId): { label: string; thought: string; color: number; pigCount: number; burstCount: number } {
  if (abilityId === "wheekCall") {
    return { label: "Wheek Call", thought: "Wheek!", color: 0xf0d56b, pigCount: 4, burstCount: 7 };
  }
  if (abilityId === "treatBag") {
    return { label: "Treat Bag", thought: "Treats?", color: 0xe4b83b, pigCount: 4, burstCount: 7 };
  }
  if (abilityId === "deepClean") {
    return { label: "Deep Clean", thought: "Clean!", color: 0x86d9f0, pigCount: 3, burstCount: 6 };
  }
  if (abilityId === "freshBedding") {
    return { label: "Fresh Bedding", thought: "Fresh!", color: 0x7db46a, pigCount: 3, burstCount: 6 };
  }
  if (abilityId === "snackTime") {
    return { label: "Snack Time", thought: "Snack!", color: 0xe4b83b, pigCount: 4, burstCount: 7 };
  }
  if (abilityId === "zoomieMode") {
    return { label: "Zoomie Mode", thought: "Run!", color: 0xb965d2, pigCount: 4, burstCount: 8 };
  }
  return { label: "Ability", thought: "!", color: 0xf0d56b, pigCount: 3, burstCount: 5 };
}

export function getCouncilReactionText(decreeId?: SceneFeedbackDetail["decreeId"]): string {
  if (decreeId === "careMandate") return "Order!";
  if (decreeId === "cleanupOrdinance") return "Clean!";
  if (decreeId === "herdCharter") return "Charter!";
  return "Council!";
}

export function getEventReactionText(choiceId?: SceneFeedbackDetail["eventChoiceId"]): string {
  if (!choiceId) return "Event!";
  if (choiceId.includes("litter")) return "Clean!";
  if (choiceId.includes("hidey")) return "Cozy";
  if (choiceId.includes("traffic")) return "Run!";
  if (choiceId.includes("zoomies") || choiceId.includes("Zoomies")) return "Zoom!";
  if (choiceId.includes("hay") || choiceId.includes("Hay")) return "Hay!";
  if (choiceId.includes("bottle") || choiceId.includes("Bottle")) return "Sip!";
  if (choiceId.includes("nap") || choiceId.includes("Nap")) return "Nap!";
  if (choiceId.includes("compost") || choiceId.includes("Compost")) return "Compost!";
  if (choiceId.includes("wheek") || choiceId.includes("Wheek")) return "Wheek!";
  return "Done!";
}

export function getCleanRewardText(cleaned: CleanedPoop): string {
  if (cleaned.type === "golden") return "+Gold";
  if (cleaned.type === "compost") return "+Compost";
  if (cleaned.type === "blessed") return "+Squeak";
  if (cleaned.type === "royal") return "+Royal";
  if (cleaned.type === "cursed") return "+Cursed";
  if (cleaned.type === "mystery") return "+Mystery";
  if (cleaned.type === "stinky") return "+Stinky";
  if (cleaned.type === "messPile") return "+Pile";
  return `+${cleaned.value}`;
}
