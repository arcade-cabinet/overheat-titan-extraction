CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 0,
  upgrades TEXT NOT NULL DEFAULT '{"cap":1,"pow":1,"cool":1}',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  volume REAL NOT NULL DEFAULT 0.5,
  sensitivity REAL NOT NULL DEFAULT 0.002,
  crt_overlays INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS run_history (
  id TEXT PRIMARY KEY,
  credits_earned INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  seed_phrase TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
