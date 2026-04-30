const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

let masterVolume = 1;
let forcedMuteLockCount = 0;
const listeners = new Set<(volume: number) => void>();
const managedAudioBaseVolumes = new Map<HTMLMediaElement, number>();

const getEffectiveMasterVolume = (): number =>
  forcedMuteLockCount > 0 ? 0 : masterVolume;

const notifyListeners = () => {
  managedAudioBaseVolumes.forEach((baseVolume, audio) => {
    audio.volume = applyMasterVolume(baseVolume);
  });
  listeners.forEach((listener) => listener(getEffectiveMasterVolume()));
};

export const getMasterVolume = (): number => masterVolume;

export const getMasterVolumePercent = (): number =>
  Math.round(masterVolume * 100);

export const setMasterVolumePercent = (percent: number): void => {
  masterVolume = clamp(percent / 100, 0, 1);
  notifyListeners();
};

export const applyMasterVolume = (baseVolume: number): number =>
  clamp(baseVolume, 0, 1) * getEffectiveMasterVolume();

export const registerManagedAudio = (
  audio: HTMLMediaElement,
  baseVolume: number
): (() => void) => {
  managedAudioBaseVolumes.set(audio, clamp(baseVolume, 0, 1));
  audio.volume = applyMasterVolume(baseVolume);
  return () => {
    managedAudioBaseVolumes.delete(audio);
  };
};

export const updateManagedAudioBaseVolume = (
  audio: HTMLMediaElement,
  baseVolume: number
): void => {
  if (!managedAudioBaseVolumes.has(audio)) return;
  managedAudioBaseVolumes.set(audio, clamp(baseVolume, 0, 1));
  audio.volume = applyMasterVolume(baseVolume);
};

export const subscribeMasterVolume = (
  listener: (volume: number) => void
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const lockMasterMute = (): (() => void) => {
  forcedMuteLockCount += 1;
  notifyListeners();

  let didRelease = false;
  return () => {
    if (didRelease) return;
    didRelease = true;
    forcedMuteLockCount = Math.max(0, forcedMuteLockCount - 1);
    notifyListeners();
  };
};
