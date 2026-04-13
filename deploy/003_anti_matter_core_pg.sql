-- Anti-Matter Core: PostgreSQL version for production deploy
-- Run against augimo_programa database

CREATE TABLE IF NOT EXISTS signal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID,
  task_id UUID,
  event_type VARCHAR(50) NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_events_user ON signal_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_events_type ON signal_events(event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS anti_signals_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  signal_type VARCHAR(50) NOT NULL,
  strength DECIMAL(3,2) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  related_session_id UUID,
  related_task_id UUID,
  recommended_action VARCHAR(100) NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_anti_signals_v2_user_active ON anti_signals_v2(user_id, severity)
  WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_anti_signals_v2_detected ON anti_signals_v2(detected_at DESC);
