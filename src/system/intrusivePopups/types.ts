import { IconId } from '../../types/Icon';

export type IntrusivePopupSpawnMode = 'random' | 'cursorExact';

export interface IntrusivePopupBehavior {
  autoSpawnEverySeconds?: number;
  bounceSpeedMaxPxPerSecond?: number;
  bounceSpeedMinPxPerSecond?: number;
  bounceSpeedPxPerSecond?: number;
  closeOtherPopupOnCloseClick?: boolean;
  desktopClickSpawnChance?: number;
  hydraSpawnCount?: number;
  recursiveRespawnDelayMs?: number;
  scrambledDecorations?: boolean;
  snapUnderCursorOnNextClick?: boolean;
  spawnMode?: IntrusivePopupSpawnMode;
  spontaneousReplaceEveryMs?: number;
  stackedCloseClicks?: number;
}

export interface IntrusivePopupContent {
  body: string;
  ctaLabel?: string;
  details?: string[];
  headline: string;
}

export interface IntrusivePopupConfig {
  backgroundImageUrl?: string;
  behavior: IntrusivePopupBehavior;
  content?: IntrusivePopupContent;
  iconId: IconId;
  id: string;
  size: { height: number; width: number };
  title: string;
}

export type IntrusivePopupDecorationAction = 'close' | 'maximize' | 'minimize';

export interface IntrusivePopupDecorationButton {
  action: IntrusivePopupDecorationAction;
  left: number;
  symbol: string;
  top: number;
}

export interface ActiveIntrusivePopup {
  config: IntrusivePopupConfig;
  coords: { x: number; y: number };
  id: string;
  isMaximized: boolean;
  nextAutoSpawnAt: number | null;
  nextSpontaneousAt: number | null;
  pausedVelocity: { x: number; y: number } | null;
  shouldSnapOnNextClick: boolean;
  velocity: { x: number; y: number } | null;
  zIndex: number;
}
