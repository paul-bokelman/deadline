// Narrow selector hook for run/progression-cycle state.
// Backed by the consolidated GameStateContext today; in the future this
// is the seam where a real RunStateContext would be introduced without
// touching consumers.

import { useGameState } from '@/game/state';
import type { GameStage } from '@/game/state';

export interface RunStateView {
  stage: GameStage;
  hasSeenInitialBios: boolean;
  firedEvents: Record<string, true>;
  setStage: (stage: GameStage) => void;
  markEventFired: (eventId: string) => void;
  hasEventFired: (eventId: string) => boolean;
  rebootGame: () => void;
  completeInitialBios: () => void;
}

export const useRunState = (): RunStateView => {
  const {
    stage,
    hasSeenInitialBios,
    firedEvents,
    setStage,
    markEventFired,
    hasEventFired,
    rebootGame,
    completeInitialBios,
  } = useGameState();
  return {
    stage,
    hasSeenInitialBios,
    firedEvents,
    setStage,
    markEventFired,
    hasEventFired,
    rebootGame,
    completeInitialBios,
  };
};
