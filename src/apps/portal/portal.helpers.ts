export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const pickThree = <T,>(items: T[], seed: number): T[] => {
  const arr = [...items];
  let x = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const j = x % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j] as T;
    arr[j] = tmp as T;
  }
  return arr.slice(0, 3);
};

export const shuffleWithSeed = <T,>(items: T[], seed: number): T[] => {
  const arr = [...items];
  let x = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const j = x % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j] as T;
    arr[j] = tmp as T;
  }
  return arr;
};

export const toCircleAccuracy = (points: { x: number; y: number }[]): number => {
  if (points.length < 24) return 0;
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const radii = points.map((p) => Math.hypot(p.x - cx, p.y - cy));
  const mean = radii.reduce((sum, r) => sum + r, 0) / radii.length;
  if (mean <= 1) return 0;
  const variance =
    radii.reduce((sum, r) => sum + (r - mean) * (r - mean), 0) / radii.length;
  const stdDev = Math.sqrt(variance);
  const start = points[0];
  const end = points[points.length - 1];
  if (!start || !end) return 0;
  const closurePenalty = Math.hypot(end.x - start.x, end.y - start.y) / mean;
  const wobblePenalty = stdDev / mean;
  const raw = 100 - wobblePenalty * 180 - closurePenalty * 40;
  return Math.round(clamp(raw, 0, 100));
};
