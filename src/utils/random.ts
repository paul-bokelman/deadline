export const pickRandom = <T>(items: readonly T[]): T | null => {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
};

export const randomIntBetween = (min: number, max: number): number => {
  return Math.floor(min + Math.random() * (max - min + 1));
};
