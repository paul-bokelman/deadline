import { gameEventBus } from '../../game/events';

export type LeaderboardEntry = {
  name: string;
  ms: number;
  you?: boolean;
};

const SAMPLE_BOARD: LeaderboardEntry[] = [
  { name: 'GREG_IT_99', ms: 47 * 1000 + 220 },
  { name: 'THE_BOSS', ms: 1 * 60_000 + 12 * 1000 },
  { name: 'ALICE_R', ms: 1 * 60_000 + 28 * 1000 + 410 },
  { name: 'M.VANCE', ms: 1 * 60_000 + 44 * 1000 },
  { name: 'NIGHTOWL', ms: 2 * 60_000 + 3 * 1000 + 80 },
  { name: 'PRINCE_OBASI', ms: 2 * 60_000 + 17 * 1000 + 940 },
  { name: 'SANDRA_M', ms: 2 * 60_000 + 41 * 1000 },
  { name: 'WEB_DUDE', ms: 3 * 60_000 + 5 * 1000 + 110 },
  { name: 'CRT_FAN_94', ms: 3 * 60_000 + 22 * 1000 },
  { name: 'AAA', ms: 4 * 60_000 + 11 * 1000 + 800 },
];

let playerEntry: LeaderboardEntry | null = null;
let hasResetHook = false;

const ensureResetHook = (): void => {
  if (hasResetHook) return;
  hasResetHook = true;
  gameEventBus.on('game:rebooted', () => {
    playerEntry = null;
  });
};

export const sanitizeLeaderboardName = (raw: string): string => {
  const trimmed = (raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);
  return trimmed.length > 0 ? trimmed : 'AAA';
};

export const setLeaderboardPlayerEntry = (name: string, ms: number): void => {
  ensureResetHook();
  playerEntry = {
    name: sanitizeLeaderboardName(name),
    ms: Math.max(0, Math.floor(ms)),
    you: true,
  };
};

export const getLeaderboardViewModel = (): {
  board: LeaderboardEntry[];
  youIndex: number;
} => {
  ensureResetHook();
  if (!playerEntry) {
    return {
      board: [...SAMPLE_BOARD],
      youIndex: -1,
    };
  }
  const board = [...SAMPLE_BOARD, playerEntry].sort((a, b) => a.ms - b.ms);
  const youIndex = board.findIndex((entry) => entry.you);
  return { board, youIndex };
};

export const getLeaderboardInsertionRank = (ms: number): number => {
  const rank = SAMPLE_BOARD.filter((entry) => entry.ms < ms).length + 1;
  return Math.max(1, rank);
};
