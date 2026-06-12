import type { GameState } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizePercent(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, 0, 100) : fallback;
}

export function normalizeTimer(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function pickWeighted<T>(items: Array<{ id: T; weight: number }>): T;
export function pickWeighted<T>(items: Array<{ event: T; weight: number }>, key: "event"): T;
export function pickWeighted<T>(items: Array<{ furnitureId: T; weight: number }>, key: "furnitureId"): T;
export function pickWeighted<T>(
  items: Array<({ id: T } | { event: T } | { furnitureId: T }) & { weight: number }>,
  key: "id" | "event" | "furnitureId" = "id",
): T {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= Math.max(0, item.weight);
    if (roll <= 0) return getWeightedValue(item, key);
  }
  return getWeightedValue(items[items.length - 1], key);
}

function getWeightedValue<T>(
  item: ({ id: T } | { event: T } | { furnitureId: T }) & { weight: number },
  key: "id" | "event" | "furnitureId",
): T {
  if (key === "event" && "event" in item) return item.event;
  if (key === "furnitureId" && "furnitureId" in item) return item.furnitureId;
  if ("id" in item) return item.id;
  throw new Error(`Weighted item is missing ${key}`);
}

export function formatNeed(current: number, required: number, singular: string, plural = `${singular}s`): string {
  const missing = Math.max(1, Math.ceil(required - current));
  return `Need ${missing} ${missing === 1 ? singular : plural}`;
}

export function awardBeans(state: GameState, amount: number): void {
  state.beans += amount;
  state.stats.lifetimeBeans += amount;
}
