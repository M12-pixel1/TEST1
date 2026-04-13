-- Anti-Matter Core: Signal Events (Block 1) + Anti Signals V2 (Block 3)

CREATE TABLE IF NOT EXISTS signal_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  task_id TEXT,
  event_type TEXT NOT NULL,
  raw_data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signal_events_user ON signal_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_events_type ON signal_events(event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS anti_signals_v2 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  strength REAL NOT NULL,
  severity TEXT NOT NULL,
  confidence REAL NOT NULL,
  related_session_id TEXT,
  related_task_id TEXT,
  recommended_action TEXT NOT NULL,
  detected_at TEXT NOT NULL,
  resolved_at TEXT,
  resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_anti_signals_v2_user_active ON anti_signals_v2(user_id, severity);
CREATE INDEX IF NOT EXISTS idx_anti_signals_v2_detected ON anti_signals_v2(detected_at DESC);
