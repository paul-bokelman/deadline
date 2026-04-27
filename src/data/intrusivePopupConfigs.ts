import { IntrusivePopupConfig } from '../system/intrusivePopups/types';

const popupBackgroundImages = Object.values(
  import.meta.glob('../assets/img/popupBackgrounds/*.png', {
    eager: true,
    import: 'default',
  }) as Record<string, string>
);

const POPUP_BASE_WIDTH = 960;
const POPUP_BASE_HEIGHT = 716;
const POPUP_SCALES = [0.25, 0.5, 0.75] as const;

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomEntry = <T>(entries: T[]): T => {
  return entries[Math.floor(Math.random() * entries.length)];
};

const maybe = (chance: number): boolean => Math.random() < chance;

const createRandomBehavior = (): IntrusivePopupConfig['behavior'] => {
  const hasBounce = maybe(0.55);
  const hasHydra = maybe(0.4);
  const hasSpontaneous = maybe(0.35);

  return {
    spawnMode: maybe(0.4) ? 'cursorExact' : 'random',
    snapUnderCursorOnNextClick: maybe(0.45),
    bounceSpeedPxPerSecond: hasBounce ? randomInt(120, 300) : undefined,
    hydraSpawnCount: hasHydra ? 2 : undefined,
    spontaneousReplaceEveryMs: hasSpontaneous ? 500 : undefined,
    scrambledDecorations: true,
    stackedCloseClicks: randomInt(1, 3),
    closeOtherPopupOnCloseClick: maybe(0.35),
    autoSpawnEverySeconds: maybe(0.6) ? randomInt(10, 60) : undefined,
    desktopClickSpawnChance: maybe(0.35) ? 0.05 : undefined,
    recursiveRespawnDelayMs: maybe(0.5) ? randomInt(160, 700) : undefined,
  };
};

export const createRandomIntrusivePopupConfig = (): IntrusivePopupConfig => {
  const scale = randomEntry([...POPUP_SCALES]);
  const width = Math.round(POPUP_BASE_WIDTH * scale);
  const height = Math.round((width * POPUP_BASE_HEIGHT) / POPUP_BASE_WIDTH);

  return {
    id: `popup-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    iconId: randomEntry(['warning', 'error', 'question']),
    title: randomEntry([
      'Critical Prompt',
      'Urgent System Notice',
      'Warning Dialog',
      'Stability Alert',
      'Action Required',
    ]),
    size: { width, height },
    backgroundImageUrl:
      popupBackgroundImages.length > 0
        ? randomEntry(popupBackgroundImages)
        : undefined,
    behavior: createRandomBehavior(),
  };
};
