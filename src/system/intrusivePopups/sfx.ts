import { pickRandom } from '../../utils/random';

const SPAWN_SOURCES = ['/audio/popups/popup1.mp3', '/audio/popups/popup2.mp3'];
const LOOP_SOURCES = [
  '/audio/popups/advertise.mp3',
  '/audio/popups/airhorn.mp3',
  '/audio/popups/alarm1.mp3',
  '/audio/popups/alarm2.wav',
  '/audio/popups/alarm3.wav',
  '/audio/popups/bass-boost.mp3',
  '/audio/popups/bluescreen.mp3',
  '/audio/popups/cash-register.mp3',
];
const CLICK_SOURCE = '/audio/clicking_effect.m4a';

const CLICK_START_SECONDS = 0.54;
const CLICK_END_SECONDS = 0.74;
const CLICK_CLIP_MS = (CLICK_END_SECONDS - CLICK_START_SECONDS) * 1000;

const CLOSE_POOL_SIZE = 3;
let closePool: HTMLAudioElement[] | null = null;

let nextCloseIndex = 0;

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

const getClosePool = (): HTMLAudioElement[] => {
  if (!closePool) {
    closePool = buildPool(CLICK_SOURCE, 0.45, CLOSE_POOL_SIZE);
  }
  return closePool;
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
  const source = pickRandom(SPAWN_SOURCES);
  if (!source) return;
  const audio = createAudio(source, 0.42);
  audio.play().catch(() => undefined);
};

export const createIntrusivePopupLoopSfx = (): HTMLAudioElement | null => {
  if (Math.random() >= 0.5) return null;
  const source = pickRandom(LOOP_SOURCES);
  if (!source) return null;
  const audio = createAudio(source, 0.36);
  audio.loop = true;
  return audio;
};

export const stopIntrusivePopupLoopSfx = (
  audio: HTMLAudioElement | null | undefined
): void => {
  if (!audio) return;
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {
    // noop
  }
};

export const playIntrusivePopupCloseSfx = (): void => {
  nextCloseIndex = playClippedClick(getClosePool(), nextCloseIndex);
};
