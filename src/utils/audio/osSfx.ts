import { registerManagedAudio } from './masterVolume';

const SFX_PATHS = {
  reboot: '/audio/os/reboot.mp3',
  startup: '/audio/os/startup.mp3',
  hangup: '/audio/os/hangup.wav',
  incomingCall: '/audio/os/incoming_call.mp3',
  youGotMail: '/audio/os/you_got_mail.mp3',
  callOver: '/audio/os/call_over.mp3',
  tada: '/audio/os/tada.mp3',
  error: '/audio/os/error.mp3',
  bluescreen: '/audio/os/bsod_troll.m4a',
} as const;

const createAudio = (src: string, volume: number): HTMLAudioElement => {
  const audio = new Audio(src);
  audio.preload = 'auto';
  registerManagedAudio(audio, volume);
  return audio;
};

const createUnmanagedAudio = (
  src: string,
  volume: number
): HTMLAudioElement => {
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = volume;
  return audio;
};

const playOneShot = (src: string, volume: number): Promise<boolean> => {
  const audio = createAudio(src, volume);
  return audio
    .play()
    .then(() => true)
    .catch(() => false);
};

const getAudioDurationMs = (
  src: string,
  fallbackMs: number
): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    let settled = false;

    const finish = (durationMs: number) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(durationMs);
    };

    const timeoutId = window.setTimeout(() => finish(fallbackMs), 1200);
    audio.addEventListener(
      'loadedmetadata',
      () => {
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
          finish(fallbackMs);
          return;
        }
        finish(Math.round(audio.duration * 1000));
      },
      { once: true }
    );
    audio.addEventListener('error', () => finish(fallbackMs), { once: true });
    audio.load();
  });
};

let rebootDurationMsPromise: Promise<number> | null = null;
let startupDurationMsPromise: Promise<number> | null = null;

export const playRebootSfx = (): Promise<number> => {
  if (!rebootDurationMsPromise) {
    rebootDurationMsPromise = getAudioDurationMs(SFX_PATHS.reboot, 3200);
  }
  void playOneShot(SFX_PATHS.reboot, 0.6);
  return rebootDurationMsPromise;
};

export const playStartupSfx = async (): Promise<{
  durationMs: number;
  didStart: boolean;
}> => {
  if (!startupDurationMsPromise) {
    startupDurationMsPromise = getAudioDurationMs(SFX_PATHS.startup, 1800);
  }
  const [durationMs, didStart] = await Promise.all([
    startupDurationMsPromise,
    playOneShot(SFX_PATHS.startup, 0.55),
  ]);
  return { durationMs, didStart };
};

export const playHangupSfx = (): void => {
  void playOneShot(SFX_PATHS.hangup, 0.6);
};

export const playIncomingCallSfxLoop = (): HTMLAudioElement => {
  const audio = createAudio(SFX_PATHS.incomingCall, 0.5);
  audio.loop = true;
  return audio;
};

export const playYouGotMailSfx = (): void => {
  void playOneShot(SFX_PATHS.youGotMail, 0.55);
};

export const playCallOverSfx = (): HTMLAudioElement => {
  const audio = createAudio(SFX_PATHS.callOver, 0.6);
  audio.play().catch(() => undefined);
  return audio;
};

export const stopCallOverSfx = (audio?: HTMLAudioElement | null): void => {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
};

export const playTadaSfx = (): void => {
  void playOneShot(SFX_PATHS.tada, 0.7);
};

export const playErrorSfx = (): void => {
  void playOneShot(SFX_PATHS.error, 0.55);
};

export interface BluescreenSfxController {
  start: () => void;
  stop: () => void;
}

export const createBluescreenSfxController = (): BluescreenSfxController => {
  const audio = createUnmanagedAudio(SFX_PATHS.bluescreen, 0.7);
  audio.loop = true;
  let isPlaying = false;

  return {
    start: () => {
      if (isPlaying) return;
      isPlaying = true;
      audio.currentTime = 0;
      audio.play().catch(() => undefined);
    },
    stop: () => {
      if (!isPlaying) return;
      isPlaying = false;
      audio.pause();
      audio.currentTime = 0;
    },
  };
};
