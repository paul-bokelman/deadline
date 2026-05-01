// Narrow selector hook for the story-progression boolean flags.
// Components that only care about whether a milestone has been hit should
// prefer this over reaching into the full GameStateContext.

import { useGameState } from '@/game/state';
import type { GameFlags } from '@/game/state';

export interface ProgressionView {
  hasReceivedIntroCall: boolean;
  hasEmailAccess: boolean;
  hasFoundRealEmail: boolean;
  hasUnlockedAttachment: boolean;
  hasDownloadStarted: boolean;
  hasDownloadFailed: boolean;
  hasZipFile: boolean;
  hasWinRarInstalled: boolean;
  hasFinalReportFile: boolean;
  hasReceivedPortalIntroCall: boolean;
  hasFoundCorrectEmail: boolean;
  hasInstalledWinRar: boolean;
  hasSubmittedFinalReport: boolean;
  hasReceivedWinRarLinkEmail: boolean;
  zipExtractionLevel: GameFlags['zipExtractionLevel'];
  zipGarbageBatch: GameFlags['zipGarbageBatch'];
}

export const useProgression = (): ProgressionView => {
  const { flags } = useGameState();
  return {
    hasReceivedIntroCall: flags.hasReceivedIntroCall,
    hasEmailAccess: flags.hasEmailAccess,
    hasFoundRealEmail: flags.hasFoundRealEmail,
    hasUnlockedAttachment: flags.hasUnlockedAttachment,
    hasDownloadStarted: flags.hasDownloadStarted,
    hasDownloadFailed: flags.hasDownloadFailed,
    hasZipFile: flags.hasZipFile,
    hasWinRarInstalled: flags.hasWinRarInstalled,
    hasFinalReportFile: flags.hasFinalReportFile,
    hasReceivedPortalIntroCall: flags.hasReceivedPortalIntroCall,
    hasFoundCorrectEmail: flags.hasFoundCorrectEmail,
    hasInstalledWinRar: flags.hasInstalledWinRar,
    hasSubmittedFinalReport: flags.hasSubmittedFinalReport,
    hasReceivedWinRarLinkEmail: flags.hasReceivedWinRarLinkEmail,
    zipExtractionLevel: flags.zipExtractionLevel,
    zipGarbageBatch: flags.zipGarbageBatch,
  };
};
