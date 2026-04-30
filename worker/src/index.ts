// Deadline leaderboard Worker.
//
// Endpoints (all JSON):
//   POST /run/start                        -> { runId, startedAt, token }
//   POST /run/reboot                       -> { ok: true, rebootCount }
//   POST /run/checkpoint                   -> { ok: true }
//   POST /run/submit                       -> { ok: true, entry: { name, timeMs, reboots, rank } }
//   GET  /leaderboard                      -> { entries: [{ rank, name, timeMs, reboots }] }
//   GET  /health                           -> { ok: true }
//
// Anti-cheat surface:
//   - All writes go through this worker (no direct DB access from the client).
//   - /run/start issues a server-timestamped run row and an HMAC token bound to (runId, startedAt).
//   - Every subsequent call MUST present runId + token; HMAC is verified.
//   - /run/submit verifies all REQUIRED_CHECKPOINTS were recorded before submission.
//   - Elapsed time is computed server-side (submitted_at - segment_started_at).
//   - `run_id` is session-scoped; rebooting keeps run_id and resets segment timer.
//   - Per-IP rate limit on /run/start.
//   - Names enforced server-side: ^[A-Z0-9]{1,6}$, unique.
//   - Each run can only be submitted once (status flips to 'submitted').

import { buildCorsHeaders, preflight } from './cors';
import { signRunToken, verifyRunToken } from './hmac';

interface Env {
  DB: D1Database;
  RUN_TOKEN_SECRET: string;
  ALLOWED_ORIGINS: string;
  REQUIRED_CHECKPOINTS: string;
  MAX_RUN_MS: string;
  MIN_RUN_MS: string;
  RATE_LIMIT_STARTS_PER_MIN: string;
  CLEANUP_OPEN_AFTER_MS: string;
  CLEANUP_EXPIRED_AFTER_MS: string;
}

const NAME_PATTERN = /^[A-Z0-9]{1,6}$/;
const CHECKPOINT_PATTERN = /^[a-z0-9_]{1,32}$/;
const MAX_LEADERBOARD_ROWS = 100;

const json = (body: unknown, status: number, cors: HeadersInit): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...cors },
  });

const error = (
  code: string,
  message: string,
  status: number,
  cors: HeadersInit
): Response => json({ ok: false, error: { code, message } }, status, cors);

const getClientIp = (request: Request): string =>
  request.headers.get('CF-Connecting-IP') ?? 'unknown';

const safeJson = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
};

interface RunRow {
  run_id: string;
  started_at: number;
  segment_started_at: number;
  reboot_count: number;
  submitted_at: number | null;
  status: string;
  checkpoints: string;
}

const loadRun = async (env: Env, runId: string): Promise<RunRow | null> => {
  return env.DB.prepare(
    'SELECT run_id, started_at, segment_started_at, reboot_count, submitted_at, status, checkpoints FROM runs WHERE run_id = ?'
  )
    .bind(runId)
    .first<RunRow>();
};

type AuthFailure = { code: string; message: string; status: number };

const verifyAuth = async (
  env: Env,
  runId: unknown,
  token: unknown
): Promise<RunRow | { fail: AuthFailure }> => {
  if (typeof runId !== 'string' || typeof token !== 'string') {
    return {
      fail: {
        code: 'BAD_REQUEST',
        message: 'runId and token are required',
        status: 400,
      },
    };
  }
  const run = await loadRun(env, runId);
  if (!run) {
    return {
      fail: { code: 'UNKNOWN_RUN', message: 'Run not found', status: 404 },
    };
  }
  const ok = await verifyRunToken(
    env.RUN_TOKEN_SECRET,
    run.run_id,
    run.started_at,
    token
  );
  if (!ok) {
    return {
      fail: { code: 'BAD_TOKEN', message: 'Invalid run token', status: 401 },
    };
  }
  return run;
};

const handleStart = async (
  request: Request,
  env: Env,
  cors: HeadersInit
): Promise<Response> => {
  const ip = getClientIp(request);
  const ua = request.headers.get('User-Agent')?.slice(0, 256) ?? null;
  const ratePerMin = Number.parseInt(env.RATE_LIMIT_STARTS_PER_MIN, 10) || 30;
  const since = Date.now() - 60_000;
  const recent = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM runs WHERE client_ip = ? AND started_at > ?'
  )
    .bind(ip, since)
    .first<{ count: number }>();
  if (recent && recent.count >= ratePerMin) {
    return error(
      'RATE_LIMITED',
      'Too many runs started; slow down.',
      429,
      cors
    );
  }

  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  await env.DB.prepare(
    `INSERT INTO runs (run_id, started_at, segment_started_at, reboot_count, status, checkpoints, client_ip, ua)
       VALUES (?, ?, ?, 0, 'open', '{}', ?, ?)`
  )
    .bind(runId, startedAt, startedAt, ip, ua)
    .run();
  const token = await signRunToken(env.RUN_TOKEN_SECRET, runId, startedAt);
  return json({ ok: true, runId, startedAt, token }, 200, cors);
};

const handleReboot = async (
  request: Request,
  env: Env,
  cors: HeadersInit
): Promise<Response> => {
  const body = await safeJson(request);
  const result = await verifyAuth(env, body.runId, body.token);
  if ('fail' in result) {
    return error(
      result.fail.code,
      result.fail.message,
      result.fail.status,
      cors
    );
  }
  if (result.status !== 'open') {
    return error('RUN_CLOSED', 'Run is not open', 409, cors);
  }
  const nextReboots = result.reboot_count + 1;
  await env.DB.prepare(
    "UPDATE runs SET reboot_count = ?, segment_started_at = ?, checkpoints = '{}' WHERE run_id = ?"
  )
    .bind(nextReboots, Date.now(), result.run_id)
    .run();
  return json({ ok: true, rebootCount: nextReboots }, 200, cors);
};

const handleCheckpoint = async (
  request: Request,
  env: Env,
  cors: HeadersInit
): Promise<Response> => {
  const body = await safeJson(request);
  const checkpoint = body.checkpoint;
  if (typeof checkpoint !== 'string' || !CHECKPOINT_PATTERN.test(checkpoint)) {
    return error('BAD_CHECKPOINT', 'Invalid checkpoint name', 400, cors);
  }
  const allowed = env.REQUIRED_CHECKPOINTS.split(',').map((s) => s.trim());
  if (!allowed.includes(checkpoint)) {
    return error('UNKNOWN_CHECKPOINT', 'Checkpoint not allowed', 400, cors);
  }
  const result = await verifyAuth(env, body.runId, body.token);
  if ('fail' in result) {
    return error(
      result.fail.code,
      result.fail.message,
      result.fail.status,
      cors
    );
  }
  if (result.status !== 'open') {
    return error('RUN_CLOSED', 'Run is not open', 409, cors);
  }

  let checkpoints: Record<string, number> = {};
  try {
    checkpoints = JSON.parse(result.checkpoints) as Record<string, number>;
  } catch {
    checkpoints = {};
  }
  if (checkpoints[checkpoint] !== undefined) {
    // Idempotent: already recorded; no-op.
    return json({ ok: true, alreadyRecorded: true }, 200, cors);
  }
  checkpoints[checkpoint] = Date.now();
  await env.DB.prepare('UPDATE runs SET checkpoints = ? WHERE run_id = ?')
    .bind(JSON.stringify(checkpoints), result.run_id)
    .run();
  return json({ ok: true }, 200, cors);
};

const computeRank = async (env: Env, timeMs: number): Promise<number> => {
  const row = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM leaderboard WHERE time_ms < ?'
  )
    .bind(timeMs)
    .first<{ count: number }>();
  return (row?.count ?? 0) + 1;
};

const handleSubmit = async (
  request: Request,
  env: Env,
  cors: HeadersInit
): Promise<Response> => {
  const body = await safeJson(request);
  const result = await verifyAuth(env, body.runId, body.token);
  if ('fail' in result) {
    return error(
      result.fail.code,
      result.fail.message,
      result.fail.status,
      cors
    );
  }
  const run = result;

  if (run.status !== 'open') {
    return error('ALREADY_SUBMITTED', 'Run already submitted', 409, cors);
  }

  const rawName = typeof body.name === 'string' ? body.name : '';
  const name = rawName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  if (!NAME_PATTERN.test(name)) {
    return error(
      'BAD_NAME',
      'Name must be 1\u20136 alphanumeric characters',
      400,
      cors
    );
  }

  const required = env.REQUIRED_CHECKPOINTS.split(',').map((s) => s.trim());
  let recorded: Record<string, number> = {};
  try {
    recorded = JSON.parse(run.checkpoints) as Record<string, number>;
  } catch {
    recorded = {};
  }
  const missing = required.filter((cp) => recorded[cp] === undefined);
  if (missing.length > 0) {
    return error(
      'MISSING_CHECKPOINTS',
      `Missing checkpoints: ${missing.join(',')}`,
      400,
      cors
    );
  }

  const submittedAt = Date.now();
  const elapsedMs = submittedAt - run.segment_started_at;
  const minMs = Number.parseInt(env.MIN_RUN_MS, 10) || 0;
  const maxMs = Number.parseInt(env.MAX_RUN_MS, 10) || 900_000;
  if (elapsedMs < minMs || elapsedMs > maxMs) {
    await env.DB.prepare("UPDATE runs SET status = 'expired' WHERE run_id = ?")
      .bind(run.run_id)
      .run();
    return error(
      'TIME_OUT_OF_BOUNDS',
      `Elapsed ${elapsedMs}ms is outside [${minMs}, ${maxMs}]`,
      400,
      cors
    );
  }

  // Insert leaderboard row; UNIQUE(name) enforces "reject duplicates".
  // We do this BEFORE flipping run status so a name collision lets the
  // player retry under a different name with the same run.
  try {
    await env.DB.prepare(
      `INSERT INTO leaderboard (name, time_ms, reboots, created_at, run_id)
         VALUES (?, ?, ?, ?, ?)`
    )
      .bind(name, elapsedMs, run.reboot_count, submittedAt, run.run_id)
      .run();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/UNIQUE/i.test(message) && /name/i.test(message)) {
      return error(
        'NAME_TAKEN',
        'That name is already on the leaderboard',
        409,
        cors
      );
    }
    if (/UNIQUE/i.test(message) && /run_id/i.test(message)) {
      return error('ALREADY_SUBMITTED', 'Run already submitted', 409, cors);
    }
    return error('DB_ERROR', 'Database error', 500, cors);
  }

  await env.DB.prepare(
    "UPDATE runs SET status = 'submitted', submitted_at = ? WHERE run_id = ?"
  )
    .bind(submittedAt, run.run_id)
    .run();

  const rank = await computeRank(env, elapsedMs);
  return json(
    {
      ok: true,
      entry: { name, timeMs: elapsedMs, reboots: run.reboot_count, rank },
    },
    200,
    cors
  );
};

const handleLeaderboard = async (
  env: Env,
  cors: HeadersInit
): Promise<Response> => {
  const result = await env.DB.prepare(
    `SELECT name, time_ms, reboots FROM leaderboard
       ORDER BY time_ms ASC, created_at ASC
       LIMIT ?`
  )
    .bind(MAX_LEADERBOARD_ROWS)
    .all<{ name: string; time_ms: number; reboots: number }>();
  const entries = (result.results ?? []).map((row, idx) => ({
    rank: idx + 1,
    name: row.name,
    timeMs: row.time_ms,
    reboots: row.reboots,
  }));
  return json({ ok: true, entries }, 200, cors);
};

// Scheduled cleanup. Removes abandoned 'open' runs and old 'expired' runs.
// 'submitted' runs are kept indefinitely for audit (and because the
// leaderboard rows reference them).
const runCleanup = async (
  env: Env
): Promise<{ open: number; expired: number }> => {
  const now = Date.now();
  const openCutoff =
    now - (Number.parseInt(env.CLEANUP_OPEN_AFTER_MS, 10) || 86_400_000);
  const expiredCutoff =
    now - (Number.parseInt(env.CLEANUP_EXPIRED_AFTER_MS, 10) || 604_800_000);

  const openResult = await env.DB.prepare(
    "DELETE FROM runs WHERE status = 'open' AND started_at < ?"
  )
    .bind(openCutoff)
    .run();
  const expiredResult = await env.DB.prepare(
    "DELETE FROM runs WHERE status = 'expired' AND started_at < ?"
  )
    .bind(expiredCutoff)
    .run();

  return {
    open: openResult.meta?.changes ?? 0,
    expired: expiredResult.meta?.changes ?? 0,
  };
};

export default {
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(
      runCleanup(env).then((stats) => {
        // eslint-disable-next-line no-console
        console.log(
          `[cleanup] removed ${stats.open} open + ${stats.expired} expired runs`
        );
      })
    );
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = buildCorsHeaders(request, env.ALLOWED_ORIGINS);

    if (request.method === 'OPTIONS') {
      return preflight(request, env.ALLOWED_ORIGINS);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (request.method === 'GET' && path === '/health') {
        return json({ ok: true }, 200, cors);
      }
      if (request.method === 'GET' && path === '/leaderboard') {
        return handleLeaderboard(env, cors);
      }
      if (request.method === 'POST' && path === '/run/start') {
        return handleStart(request, env, cors);
      }
      if (request.method === 'POST' && path === '/run/checkpoint') {
        return handleCheckpoint(request, env, cors);
      }
      if (request.method === 'POST' && path === '/run/reboot') {
        return handleReboot(request, env, cors);
      }
      if (request.method === 'POST' && path === '/run/submit') {
        return handleSubmit(request, env, cors);
      }
      return error('NOT_FOUND', 'Not found', 404, cors);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return error('INTERNAL', message, 500, cors);
    }
  },
};
