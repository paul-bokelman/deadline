export type StroopColor = { name: string; css: string };

export const STROOP_COLORS: StroopColor[] = [
  { name: 'red', css: '#c00000' },
  { name: 'green', css: '#2f9f2f' },
  { name: 'blue', css: '#1f4ad1' },
  { name: 'yellow', css: '#b39600' },
  { name: 'purple', css: '#6b2f9f' },
  { name: 'orange', css: '#c96b00' },
];

export type CaptchaId =
  | 'stroop_trap'
  | 'micro_pixel_grid'
  | 'bear_market'
  | 'fleeing_checkbox'
  | 'circle_game';

export type MarketChart = {
  id: string;
  points: number[];
  bearish: boolean;
};

export const marketCharts: MarketChart[] = [
  { id: 'ch-1', points: [12.2, 12.1, 12.25, 12.0, 11.95, 11.9], bearish: true },
  { id: 'ch-2', points: [10.4, 10.55, 10.5, 10.65, 10.6, 10.75], bearish: false },
  { id: 'ch-3', points: [13.1, 13.0, 13.05, 12.9, 12.85, 12.8], bearish: true },
  { id: 'ch-4', points: [9.8, 9.7, 9.85, 9.75, 9.9, 9.95], bearish: false },
  { id: 'ch-5', points: [11.5, 11.45, 11.35, 11.4, 11.25, 11.2], bearish: true },
  { id: 'ch-6', points: [8.9, 8.95, 8.85, 9.0, 8.95, 9.05], bearish: false },
  { id: 'ch-7', points: [12.7, 12.65, 12.7, 12.5, 12.45, 12.35], bearish: true },
  { id: 'ch-8', points: [10.9, 10.8, 10.95, 10.9, 11.0, 11.05], bearish: false },
  { id: 'ch-9', points: [11.9, 12.0, 11.85, 11.8, 11.75, 11.7], bearish: true },
];

export const crosswalkTargetCells = (() => {
  const cells = new Set<number>();
  let x = 0x96f00d;
  while (cells.size < 45) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const idx = x % 256;
    cells.add(idx);
  }
  return cells;
})();

export const CAPTCHA_POOL: CaptchaId[] = [
  'stroop_trap',
  'micro_pixel_grid',
  'bear_market',
  'fleeing_checkbox',
  'circle_game',
];
