// Leaderboard runtime.
//
// Source of truth is the deadline-api Worker (/leaderboard). This module
// caches the last-fetched board, exposes a subscribe/refresh API for
// reactive consumers, and tracks the local "you" entry that gets merged
// into the cached board after a successful submit.

import { gameEventBus } from '../../game/events';
import { apiFetchLeaderboard, apiSubmitRun } from '../api/leaderboard';
import { isApiConfigured, ApiError } from '../api/client';
import { getActiveRunToken } from '../runTimer/runTimer';

export type LeaderboardEntry = {
  name: string;
  ms: number;
  you?: boolean;
};

export const NAME_MAX_LENGTH = 6;

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface LeaderboardState {
  status: LoadStatus;
  entries: LeaderboardEntry[];
  errorMessage: string | null;
}

let state: LeaderboardState = {
  status: 'idle',
  entries: [],
  errorMessage: null,
};

let playerEntry: LeaderboardEntry | null = null;
let inFlightLoad: Promise<void> | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = (): void => {
  listeners.forEach((listener) => listener());
};

let hasResetHook = false;
const ensureResetHook = (): void => {
  if (hasResetHook) return;
  hasResetHook = true;
  gameEventBus.on('game:rebooted', () => {
    playerEntry = null;
    notify();
  });
};

export const subscribeLeaderboard = (listener: Listener): (() => void) => {
  ensureResetHook();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const sanitizeLeaderboardName = (raw: string): string => {
  const trimmed = (raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, NAME_MAX_LENGTH);
  return trimmed.length > 0 ? trimmed : 'AAA';
};

export const setLeaderboardPlayerEntry = (name: string, ms: number): void => {
  ensureResetHook();
  playerEntry = {
    name: sanitizeLeaderboardName(name),
    ms: Math.max(0, Math.floor(ms)),
    you: true,
  };
  notify();
};

export const loadLeaderboard = async (): Promise<void> => {
  ensureResetHook();
  if (!isApiConfigured()) {
    state = { status: 'ready', entries: [], errorMessage: null };
    notify();
    return;
  }
  if (inFlightLoad) return inFlightLoad;
  state = { ...state, status: 'loading', errorMessage: null };
  notify();

  inFlightLoad = (async () => {
    const result = await apiFetchLeaderboard();
    if (!result.ok) {
      state = {
        status: 'error',
        entries: state.entries,
        errorMessage: result.error.message,
      };
    } else {
      state = {
        status: 'ready',
        entries: result.data.entries.map((row) => ({
          name: row.name,
          ms: row.timeMs,
        })),
        errorMessage: null,
      };
    }
    inFlightLoad = null;
    notify();
  })();

  return inFlightLoad;
};

export const submitLeaderboardEntry = async (
  name: string
): Promise<
  { ok: true; ms: number; rank: number } | { ok: false; error: ApiError }
> => {
  ensureResetHook();
  const sanitized = sanitizeLeaderboardName(name);
  const run = await getActiveRunToken();
  if (!run) {
    return {
      ok: false,
      error: new ApiError(
        'NOT_CONFIGURED',
        'No active run; leaderboard submission unavailable.',
        0
      ),
    };
  }
  const result = await apiSubmitRun(run.runId, run.token, sanitized);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  setLeaderboardPlayerEntry(result.data.entry.name, result.data.entry.timeMs);
  // Refresh from server so the board includes the new row authoritatively.
  void loadLeaderboard();
  return {
    ok: true,
    ms: result.data.entry.timeMs,
    rank: result.data.entry.rank,
  };
};

export const getLeaderboardViewModel = (): {
  board: LeaderboardEntry[];
  youIndex: number;
  status: LoadStatus;
  errorMessage: string | null;
} => {
  ensureResetHook();
  const base = state.entries;
  if (!playerEntry) {
    return {
      board: [...base],
      youIndex: -1,
      status: state.status,
      errorMessage: state.errorMessage,
    };
  }
  // Merge "you" — but if the server already has the same name in `base`,
  // mark that row as you instead of duplicating.
  const existingIdx = base.findIndex(
    (entry) => entry.name === playerEntry?.name && entry.ms === playerEntry?.ms
  );
  if (existingIdx >= 0) {
    const board = base.map((entry, idx) =>
      idx === existingIdx ? { ...entry, you: true } : entry
    );
    return {
      board,
      youIndex: existingIdx,
      status: state.status,
      errorMessage: state.errorMessage,
    };
  }
  const board = [...base, playerEntry].sort((a, b) => a.ms - b.ms);
  const youIndex = board.findIndex((entry) => entry.you);
  return {
    board,
    youIndex,
    status: state.status,
    errorMessage: state.errorMessage,
  };
};

export const getLeaderboardInsertionRank = (ms: number): number => {
  const rank = state.entries.filter((entry) => entry.ms < ms).length + 1;
  return Math.max(1, rank);
};
