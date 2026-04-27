import { GameStage } from '../game/state';

export interface WindowsUpdateConfig {
  enabledAfterStage: GameStage;
  countdownMs: number;
}

export interface SystemConfig {
  windowsUpdate: WindowsUpdateConfig;
}

export const systemConfig: SystemConfig = {
  windowsUpdate: {
    enabledAfterStage: 'desktop_intro',
    countdownMs: 15 * 60 * 1000,
  },
};
