const SPAWN_SOURCE = '/audio/popup.mp3';
const CLICK_SOURCE = '/audio/clicking_effect.m4a';

const CLICK_START_SECONDS = 0.54;
const CLICK_END_SECONDS = 0.74;
const CLICK_CLIP_MS = (CLICK_END_SECONDS - CLICK_START_SECONDS) * 1000;

const SPAWN_POOL_SIZE = 3;
const CLOSE_POOL_SIZE = 3;
const HOVER_POOL_SIZE = 3;

let spawnPool: HTMLAudioElement[] | null = null;
let closePool: HTMLAudioElement[] | null = null;
let hoverPool: HTMLAudioElement[] | null = null;

let nextSpawnIndex = 0;
let nextCloseIndex = 0;
let nextHoverIndex = 0;
let lastHoverAt = 0;

const clipStopTimers = new WeakMap<HTMLAudioElement, number>();

const createAudio = (source: string, volume: number): HTMLAudioElement => {
  const audio = new Audio(source);
  audio.preload = 'auto';
  audio.volume = volume;
  return audio;
};

const buildPool = (
  source: string,
  volume: number,
  size: number
): HTMLAudioElement[] => {
  return Array.from({ length: size }, () => {
    const audio = createAudio(source, volume);
    audio.load();
    return audio;
  });
};

const getSpawnPool = (): HTMLAudioElement[] => {
  if (!spawnPool) {
    spawnPool = buildPool(SPAWN_SOURCE, 0.42, SPAWN_POOL_SIZE);
  }
  return spawnPool;
};

const getClosePool = (): HTMLAudioElement[] => {
  if (!closePool) {
    closePool = buildPool(CLICK_SOURCE, 0.45, CLOSE_POOL_SIZE);
  }
  return closePool;
};

const getHoverPool = (): HTMLAudioElement[] => {
  if (!hoverPool) {
    hoverPool = buildPool(CLICK_SOURCE, 0.22, HOVER_POOL_SIZE);
  }
  return hoverPool;
};

const playClippedClick = (pool: HTMLAudioElement[], index: number): number => {
  const audio = pool[index % pool.length];

  const previousTimer = clipStopTimers.get(audio);
  if (previousTimer !== undefined) {
    window.clearTimeout(previousTimer);
  }

  try {
    const seekTarget =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? Math.min(CLICK_START_SECONDS, Math.max(0, audio.duration - 0.03))
        : CLICK_START_SECONDS;
    audio.currentTime = seekTarget;
  } catch {
    audio.currentTime = 0;
  }

  audio.play().catch(() => undefined);

  const timer = window.setTimeout(() => {
    audio.pause();
    audio.currentTime = CLICK_START_SECONDS;
    clipStopTimers.delete(audio);
  }, CLICK_CLIP_MS);
  clipStopTimers.set(audio, timer);

  return (index + 1) % pool.length;
};

export const playIntrusivePopupSpawnSfx = (): void => {
  const pool = getSpawnPool();
  const audio = pool[nextSpawnIndex % pool.length];
  nextSpawnIndex = (nextSpawnIndex + 1) % pool.length;

  try {
    audio.currentTime = 0;
  } catch {
    // noop
  }

  audio.play().catch(() => undefined);
};

export const playIntrusivePopupCloseSfx = (): void => {
  nextCloseIndex = playClippedClick(getClosePool(), nextCloseIndex);
};

export const playIntrusivePopupHoverSfx = (): void => {
  const now = Date.now();
  if (now - lastHoverAt < 110) return;
  lastHoverAt = now;

  nextHoverIndex = playClippedClick(getHoverPool(), nextHoverIndex);
};
