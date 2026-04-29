import { GameStage } from '../game/state';

export interface WindowsUpdateConfig {
  enabled: boolean;
  enabledAfterStage: GameStage;
  countdownMs: number;
}

export interface SystemConfig {
  windowsUpdate: WindowsUpdateConfig;
}

export const systemConfig: SystemConfig = {
  windowsUpdate: {
    enabled: true,
    enabledAfterStage: 'desktop_intro',
    countdownMs: 15 * 60 * 1000,
  },
};
