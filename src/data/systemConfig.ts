import { GameStage } from '../game/state';

export interface RangeMs {
  min: number;
  max: number;
}

export interface WindowsUpdateConfig {
  enabledAfterStage: GameStage;
  nagIntervalMsRange: RangeMs;
  countdownMs: number;
}

export interface SystemConfig {
  windowsUpdate: WindowsUpdateConfig;
}

export const systemConfig: SystemConfig = {
  windowsUpdate: {
    enabledAfterStage: 'search_email',
    nagIntervalMsRange: {
      min: 90_000,
      max: 120_000,
    },
    countdownMs: 120_000,
  },
};
