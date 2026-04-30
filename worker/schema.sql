-- Deadline leaderboard schema (Cloudflare D1 / SQLite).

CREATE TABLE IF NOT EXISTS runs (
  run_id       TEXT PRIMARY KEY,
  started_at   INTEGER NOT NULL,           -- ms since epoch (server time)
  submitted_at INTEGER,                    -- ms since epoch, null until submit
  status       TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','submitted','expired')),
  checkpoints  TEXT NOT NULL DEFAULT '{}', -- JSON: {"checkpoint_name": ts_ms}
  client_ip    TEXT,
  ua           TEXT
);

CREATE INDEX IF NOT EXISTS runs_started_at_idx ON runs(started_at);
CREATE INDEX IF NOT EXISTS runs_client_ip_idx  ON runs(client_ip, started_at);

CREATE TABLE IF NOT EXISTS leaderboard (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  time_ms    INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  run_id     TEXT NOT NULL UNIQUE,
  FOREIGN KEY (run_id) REFERENCES runs(run_id)
);

CREATE INDEX IF NOT EXISTS leaderboard_time_idx ON leaderboard(time_ms);
