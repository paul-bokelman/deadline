// Run timer + server-issued run token.
//
// The wall-clock timer is kept around purely for in-game UI display. The
// authoritative elapsed time used by the leaderboard is computed by the
// Worker (submitted_at - started_at) and returned by /run/submit. The
// runId/token issued by /run/start are required to call /run/checkpoint and
// /run/submit; without them, leaderboard submission will fail gracefully.

import {
  apiSendCheckpoint,
  apiStartRun,
  CheckpointName,
} from '../api/leaderboard';
import { isApiConfigured } from '../api/client';

let runStartedAtMs = Date.now();
let submittedElapsedMs: number | null = null;
let hasInitialised = false;

interface RunToken {
  runId: string;
  token: string;
  startedAt: number;
}

let activeRunToken: RunToken | null = null;
let pendingStart: Promise<RunToken | null> | null = null;
let recordedCheckpoints = new Set<CheckpointName>();

const startServerRun = async (): Promise<RunToken | null> => {
  if (!isApiConfigured()) return null;
  const result = await apiStartRun();
  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.warn('[deadline] /run/start failed:', result.error.message);
    return null;
  }
  const next: RunToken = {
    runId: result.data.runId,
    token: result.data.token,
    startedAt: result.data.startedAt,
  };
  activeRunToken = next;
  return next;
};

export const resetRunTimer = (): void => {
  runStartedAtMs = Date.now();
  submittedElapsedMs = null;
  activeRunToken = null;
  recordedCheckpoints = new Set();
  hasInitialised = true;
  // Fire-and-forget: kicks off a fresh server run for this play-through.
  pendingStart = startServerRun().catch(() => null);
};

export const ensureRunStarted = (): void => {
  if (hasInitialised) return;
  resetRunTimer();
};

export const markRunSubmitted = (): void => {
  submittedElapsedMs = Math.max(0, Date.now() - runStartedAtMs);
};

export const setSubmittedElapsedMs = (ms: number): void => {
  submittedElapsedMs = Math.max(0, Math.floor(ms));
};

export const getSubmittedElapsedMs = (): number | null => submittedElapsedMs;

export const getActiveRunToken = async (): Promise<RunToken | null> => {
  if (activeRunToken) return activeRunToken;
  if (pendingStart) return pendingStart;
  return null;
};

export const recordCheckpoint = (checkpoint: CheckpointName): void => {
  if (recordedCheckpoints.has(checkpoint)) return;
  recordedCheckpoints.add(checkpoint);
  void (async () => {
    const run = await getActiveRunToken();
    if (!run) return;
    const result = await apiSendCheckpoint(run.runId, run.token, checkpoint);
    if (!result.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        `[deadline] checkpoint ${checkpoint} failed:`,
        result.error.message
      );
      // Allow a retry on next call.
      recordedCheckpoints.delete(checkpoint);
    }
  })();
};
