import { gameEventBus } from '../../game/events';

let baseRealMs = Date.now();
let baseVirtualMs = 0;
let isInitialized = false;

export const resetGameClock = (): void => {
  const now = new Date();
  now.setHours(16, 45, 0, 0); // 4:45 PM local time
  baseRealMs = Date.now();
  baseVirtualMs = now.getTime();
};

export const initializeGameClock = (): void => {
  if (isInitialized) return;
  isInitialized = true;
  resetGameClock();
  gameEventBus.on('game:rebooted', () => resetGameClock());
};

export const getGameDate = (): Date => {
  if (!isInitialized) initializeGameClock();
  const elapsed = Date.now() - baseRealMs;
  return new Date(baseVirtualMs + elapsed);
};
