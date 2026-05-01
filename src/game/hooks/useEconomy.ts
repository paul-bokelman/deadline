// Narrow selector hook for blackjack/bank/anti-virus economy fields.
// Used by blackjack + portal + system performance UIs.

import { useGameState } from '@/game/state';
import type { GameFlags } from '@/game/state';

export interface EconomyView {
  bankBalance: number;
  blackjackBalance: number;
  blackjackHandsInProgress: number;
  blackjackBailoutCount: GameFlags['blackjackBailoutCount'];
  hasPurchasedWinRar: boolean;
  hasPurchasedAntiVirus: boolean;
  setFlag: <K extends keyof GameFlags>(flag: K, value: GameFlags[K]) => void;
  setFlags: (partialFlags: Partial<GameFlags>) => void;
}

export const useEconomy = (): EconomyView => {
  const { flags, setFlag, setFlags } = useGameState();
  return {
    bankBalance: flags.bankBalance,
    blackjackBalance: flags.blackjackBalance,
    blackjackHandsInProgress: flags.blackjackHandsInProgress,
    blackjackBailoutCount: flags.blackjackBailoutCount,
    hasPurchasedWinRar: flags.hasPurchasedWinRar,
    hasPurchasedAntiVirus: flags.hasPurchasedAntiVirus,
    setFlag,
    setFlags,
  };
};
