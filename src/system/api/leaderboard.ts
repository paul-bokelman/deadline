// Typed API calls against the deadline-api Worker.

import { apiGet, apiPost, ApiResult } from './client';

export type CheckpointName =
  | 'password_solved'
  | 'email_sent'
  | 'portal_captcha_cleared';

export interface StartRunResponse {
  ok: true;
  runId: string;
  startedAt: number;
  token: string;
}

export interface CheckpointResponse {
  ok: true;
  alreadyRecorded?: boolean;
}

export interface SubmitRunResponse {
  ok: true;
  entry: {
    name: string;
    timeMs: number;
    rank: number;
  };
}

export interface LeaderboardResponse {
  ok: true;
  entries: { rank: number; name: string; timeMs: number }[];
}

export const apiStartRun = (): Promise<ApiResult<StartRunResponse>> =>
  apiPost<StartRunResponse>('/run/start', {});

export const apiSendCheckpoint = (
  runId: string,
  token: string,
  checkpoint: CheckpointName
): Promise<ApiResult<CheckpointResponse>> =>
  apiPost<CheckpointResponse>('/run/checkpoint', { runId, token, checkpoint });

export const apiSubmitRun = (
  runId: string,
  token: string,
  name: string
): Promise<ApiResult<SubmitRunResponse>> =>
  apiPost<SubmitRunResponse>('/run/submit', { runId, token, name });

export const apiFetchLeaderboard = (): Promise<
  ApiResult<LeaderboardResponse>
> => apiGet<LeaderboardResponse>('/leaderboard');
