// Thin fetch wrapper around the deadline-api Worker.
//
// The base URL is read from VITE_API_BASE_URL (e.g.
// "https://deadline-api.pabs.workers.dev"). When unset, all calls return
// `null` / no-op, so the rest of the app degrades gracefully (no leaderboard
// network traffic, no errors thrown into the UI).

const RAW_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? '';
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export const isApiConfigured = (): boolean => API_BASE_URL.length > 0;

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNKNOWN_RUN'
  | 'BAD_TOKEN'
  | 'BAD_CHECKPOINT'
  | 'UNKNOWN_CHECKPOINT'
  | 'RUN_CLOSED'
  | 'ALREADY_SUBMITTED'
  | 'NAME_TAKEN'
  | 'BAD_NAME'
  | 'MISSING_CHECKPOINTS'
  | 'TIME_OUT_OF_BOUNDS'
  | 'RATE_LIMITED'
  | 'DB_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL'
  | 'NETWORK_ERROR'
  | 'NOT_CONFIGURED';

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiFailure {
  ok: false;
  error: ApiError;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

const DEFAULT_TIMEOUT_MS = 8000;

const request = async <T>(
  path: string,
  init: RequestInit
): Promise<ApiResult<T>> => {
  if (!isApiConfigured()) {
    return {
      ok: false,
      error: new ApiError('NOT_CONFIGURED', 'API base URL is not set', 0),
    };
  }
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // Non-JSON or empty response.
    }
    if (!response.ok || !body || (body as { ok?: boolean }).ok === false) {
      const err = (body as {
        error?: { code?: string; message?: string };
      } | null)?.error;
      return {
        ok: false,
        error: new ApiError(
          (err?.code as ApiErrorCode) ?? 'INTERNAL',
          err?.message ?? `Request failed (${response.status})`,
          response.status
        ),
      };
    }
    return { ok: true, data: body as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: new ApiError('NETWORK_ERROR', message, 0),
    };
  } finally {
    window.clearTimeout(timer);
  }
};

export const apiPost = <T>(
  path: string,
  body: unknown
): Promise<ApiResult<T>> =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

export const apiGet = <T>(path: string): Promise<ApiResult<T>> =>
  request<T>(path, { method: 'GET' });
