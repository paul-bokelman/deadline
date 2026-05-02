import { isSafariBrowser } from '@/system/browserCompat';
import { registerManagedAudio, subscribeMasterVolume } from './masterVolume';

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
let clickAudioContext: AudioContext | null = null;
let clickGainNode: GainNode | null = null;
let clickBufferPromise: Promise<AudioBuffer | null> | null = null;
let unsubscribeClickVolume: (() => void) | null = null;

const createAudio = (source: string, volume: number): HTMLAudioElement => {
  const audio = new Audio(source);
  audio.preload = 'auto';
  registerManagedAudio(audio, volume);
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

const getClickAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!clickAudioContext) {
    const contextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!contextCtor) return null;
    clickAudioContext = new contextCtor();
    clickGainNode = clickAudioContext.createGain();
    clickGainNode.gain.value = 0.45;
    clickGainNode.connect(clickAudioContext.destination);
    unsubscribeClickVolume = subscribeMasterVolume((volume) => {
      if (clickGainNode) clickGainNode.gain.value = 0.45 * volume;
    });
    void unsubscribeClickVolume;
  }
  return clickAudioContext;
};

const getClickBuffer = (): Promise<AudioBuffer | null> => {
  if (!clickBufferPromise) {
    const context = getClickAudioContext();
    clickBufferPromise = context
      ? fetch(CLICK_SFX_SOURCE)
          .then((response) => response.arrayBuffer())
          .then((buffer) => context.decodeAudioData(buffer))
          .catch(() => null)
      : Promise.resolve(null);
  }
  return clickBufferPromise;
};

const playSafariClickSfx = (): void => {
  const context = getClickAudioContext();
  const gainNode = clickGainNode;
  if (!context || !gainNode) return;
  if (context.state === 'suspended') {
    void context.resume().catch(() => undefined);
  }

  getClickBuffer().then((buffer) => {
    if (!buffer) return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    source.start(0, CLICK_SFX_START_SECONDS, CLICK_CLIP_DURATION_MS / 1000);
  });
};

export const playClickSfx = (): void => {
  const now = Date.now();
  if (now - lastClickAt < 45) return;
  lastClickAt = now;

  if (isSafariBrowser()) {
    playSafariClickSfx();
    return;
  }

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
