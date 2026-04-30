# deadline-api

Cloudflare Worker + D1 backend for the Deadline leaderboard.

## Architecture

- `POST /run/start` — issues a `runId`, server-side `startedAt`, and an HMAC `token`.
- `POST /run/reboot` — keeps the same `runId`, increments `reboot_count`, resets the current segment timer.
- `POST /run/checkpoint` — records a server-timestamped milestone for a run. Required milestones (set in `wrangler.toml`): `password_solved`, `portal_captcha_cleared`.
- `POST /run/submit` — verifies token + all required checkpoints, computes `elapsedMs` from server timestamps, inserts a leaderboard row (`time_ms` + `reboots`), returns the row + rank.
- `GET /leaderboard` — top 100 entries, sorted by time ascending, with rank + reboot count.

Anti-cheat properties:

- The client never supplies its own elapsed time. The Worker computes it.
- All writes require a valid HMAC token bound to `(runId, startedAt)`.
- A run can only be submitted once.
- Names are validated server-side (`^[A-Z0-9]{1,6}$`) and enforced unique.
- Submissions outside `[MIN_RUN_MS, MAX_RUN_MS]` are rejected.
- Per-IP rate limit on `/run/start`.

## First-time setup

```bash
cd worker
bun install            # or: npm install

# 1. Create the D1 database. Copy the printed `database_id` into wrangler.toml.
bun run db:create

# 2. Apply the schema to the remote DB.
bun run db:migrate:remote

# 3. Generate and store the HMAC secret used to sign run tokens.
openssl rand -base64 48 | tr -d '\n' | bun run secret:set-token
# (paste the value when prompted; it is stored as a Worker secret, never in source)

# 4. Deploy.
bun run deploy
```

The Worker will be reachable at:

```
https://deadline-api.pabs.workers.dev
```

Set `VITE_API_BASE_URL` in the game's `.env` (and in your Vercel project's environment variables) to that URL.

## Local dev

```bash
bun run db:migrate:local       # one-time: apply schema to local D1
echo "<secret>" | bun run secret:set-token   # or: wrangler secret put RUN_TOKEN_SECRET --local
bun run dev                    # serves on http://127.0.0.1:8787
```

Point the game at it via `.env.local`:

```
VITE_API_BASE_URL=http://127.0.0.1:8787
```

## CORS allow-list

Configured via the `ALLOWED_ORIGINS` var in `wrangler.toml` (comma-separated). To add new origins (e.g. Vercel preview URLs), edit and redeploy.

## Tweakable knobs (wrangler.toml `[vars]`)

| Var | Default | Purpose |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | `https://deadline.pab.dev,http://localhost:5173,http://localhost:4173` | CORS allow-list |
| `REQUIRED_CHECKPOINTS` | `password_solved,portal_captcha_cleared` | Milestones a run must hit before submission |
| `MAX_RUN_MS` | `900000` (15 min) | Reject runs longer than this |
| `MIN_RUN_MS` | `0` | Reject runs shorter than this |
| `RATE_LIMIT_STARTS_PER_MIN` | `30` | Per-IP cap on new run starts per minute |
| `CLEANUP_OPEN_AFTER_MS` | `86400000` (24h) | Cleanup deletes `open` runs older than this |
| `CLEANUP_EXPIRED_AFTER_MS` | `604800000` (7d) | Cleanup deletes `expired` runs older than this |

## Scheduled cleanup

A daily cron (`0 4 * * *` UTC, configured under `[triggers]` in `wrangler.toml`) runs `scheduled()` in the worker, which:

- deletes `runs` rows with `status='open'` older than `CLEANUP_OPEN_AFTER_MS` (abandoned plays)
- deletes `runs` rows with `status='expired'` older than `CLEANUP_EXPIRED_AFTER_MS` (failed validation)
- leaves `runs` rows with `status='submitted'` untouched (audit + FK target)
- never touches `leaderboard` rows

Trigger it manually any time with:

```bash
npx wrangler dev --test-scheduled
# in another terminal:
curl "http://localhost:8787/__scheduled?cron=0+4+*+*+*"
```

## Resetting / wiping the leaderboard

```bash
wrangler d1 execute deadline-leaderboard --remote --command "DELETE FROM leaderboard;"
wrangler d1 execute deadline-leaderboard --remote --command "DELETE FROM runs;"
```
