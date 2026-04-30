-- Deadline leaderboard schema (Cloudflare D1 / SQLite).
--
-- NOTE: data is intentionally wiped during this migration.

DROP TABLE IF EXISTS leaderboard;
DROP TABLE IF EXISTS runs;

CREATE TABLE runs (
  run_id              TEXT PRIMARY KEY,
  started_at          INTEGER NOT NULL,           -- session start ms since epoch (server time)
  segment_started_at  INTEGER NOT NULL,           -- current run segment start; resets on reboot
  submitted_at        INTEGER,                    -- ms since epoch, null until submit
  reboot_count        INTEGER NOT NULL DEFAULT 0, -- increments each reboot in-session
  status              TEXT NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open','submitted','expired')),
  checkpoints         TEXT NOT NULL DEFAULT '{}', -- JSON: {"checkpoint_name": ts_ms}
  client_ip           TEXT,
  ua                  TEXT
);

CREATE INDEX runs_started_at_idx ON runs(started_at);
CREATE INDEX runs_client_ip_idx  ON runs(client_ip, started_at);

CREATE TABLE leaderboard (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  time_ms    INTEGER NOT NULL,
  reboots    INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  run_id     TEXT NOT NULL UNIQUE,
  FOREIGN KEY (run_id) REFERENCES runs(run_id)
);

CREATE INDEX leaderboard_time_idx ON leaderboard(time_ms);
