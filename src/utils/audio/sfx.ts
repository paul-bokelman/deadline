const CLICK_SFX_SOURCE = '/audio/clicking_effect.m4a';
const LOADING_SFX_SOURCE = '/audio/loading_effect.m4a';
const CLIPPY_TIP_SFX_SOURCE = '/audio/clippy/clippy-tip.mp3';
const CLICK_SFX_START_SECONDS = 0.54;
const CLICK_SFX_END_SECONDS = 0.74;
const CLICK_CLIP_DURATION_MS =
  (CLICK_SFX_END_SECONDS - CLICK_SFX_START_SECONDS) * 1000;
const CLICK_AUDIO_POOL_SIZE = 3;

let clickAudioPool: HTMLAudioElement[] | null = null;
let nextClickAudioIndex = 0;
let lastClickAt = 0;
const clickStopTimers = new WeakMap<HTMLAudioElement, number>();
let clippyTipAudio: HTMLAudioElement | null = null;

const createAudio = (source: string, volume: number): HTMLAudioElement => {
  const audio = new Audio(source);
  audio.preload = 'auto';
  audio.volume = volume;
  return audio;
};

const getClickAudioPool = (): HTMLAudioElement[] => {
  if (!clickAudioPool) {
    clickAudioPool = Array.from({ length: CLICK_AUDIO_POOL_SIZE }, () => {
      const audio = createAudio(CLICK_SFX_SOURCE, 0.45);
      // Prime buffering early to avoid first-click decode lag.
      audio.load();
      return audio;
    });
  }
  return clickAudioPool;
};

export const playClickSfx = (): void => {
  const now = Date.now();
  if (now - lastClickAt < 45) return;
  lastClickAt = now;

  const clickPool = getClickAudioPool();
  const audio = clickPool[nextClickAudioIndex];
  nextClickAudioIndex = (nextClickAudioIndex + 1) % clickPool.length;

  const previousStopTimer = clickStopTimers.get(audio);
  if (previousStopTimer !== undefined) {
    window.clearTimeout(previousStopTimer);
  }

  try {
    const seekTarget =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? Math.min(CLICK_SFX_START_SECONDS, Math.max(0, audio.duration - 0.03))
        : CLICK_SFX_START_SECONDS;
    audio.currentTime = seekTarget;
  } catch {
    audio.currentTime = 0;
  }

  audio.play().catch(() => undefined);

  const stopTimer = window.setTimeout(() => {
    audio.pause();
    audio.currentTime = CLICK_SFX_START_SECONDS;
    clickStopTimers.delete(audio);
  }, CLICK_CLIP_DURATION_MS);
  clickStopTimers.set(audio, stopTimer);
};

export const playClippyTipSfx = (): void => {
  if (!clippyTipAudio) {
    clippyTipAudio = createAudio(CLIPPY_TIP_SFX_SOURCE, 0.55);
    clippyTipAudio.load();
  }

  try {
    clippyTipAudio.currentTime = 0;
  } catch {
    clippyTipAudio.currentTime = 0;
  }

  clippyTipAudio.play().catch(() => undefined);
};

export interface LoadingSfxController {
  start: () => void;
  stop: () => void;
}

export const createLoadingSfxController = (): LoadingSfxController => {
  const audio = createAudio(LOADING_SFX_SOURCE, 0.35);
  audio.loop = true;

  let isRunning = false;
  let jitterTimer: number | null = null;
  let resumeTimer: number | null = null;

  const clearTimers = () => {
    if (jitterTimer !== null) {
      window.clearTimeout(jitterTimer);
      jitterTimer = null;
    }
    if (resumeTimer !== null) {
      window.clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  };

  const scheduleJitter = () => {
    if (!isRunning) return;

    const nextJitterMs = 800 + Math.random() * 1700;
    jitterTimer = window.setTimeout(() => {
      if (!isRunning) return;

      if (!audio.paused && Math.random() < 0.35) {
        audio.pause();
        const pauseForMs = 1200 + Math.random() * 2600;
        resumeTimer = window.setTimeout(() => {
          if (!isRunning) return;
          audio.play().catch(() => undefined);
        }, pauseForMs);
      }

      scheduleJitter();
    }, nextJitterMs);
  };

  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      audio.currentTime = 0;
      audio.play().catch(() => undefined);
      scheduleJitter();
    },
    stop: () => {
      if (!isRunning) return;
      isRunning = false;
      clearTimers();
      audio.pause();
      audio.currentTime = 0;
    },
  };
};
