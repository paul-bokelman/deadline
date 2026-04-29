export const STARTING_RAM_MB = 0;
export const MAX_RAM_MB = 16;
export const RAM_PER_WINDOW_MB = 0.8;

export const calculateUsedRamMb = (windowCount: number): number =>
  Math.min(MAX_RAM_MB, STARTING_RAM_MB + windowCount * RAM_PER_WINDOW_MB);
