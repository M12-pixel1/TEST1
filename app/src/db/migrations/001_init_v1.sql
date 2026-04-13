CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS organization_memberships (
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS diagnostic_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  raw_answers_json TEXT,
  scoring_result_json TEXT
);

CREATE TABLE IF NOT EXISTS growth_paths (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  today_action TEXT NOT NULL,
  week_plan_json TEXT NOT NULL,
  month_focus TEXT NOT NULL,
  based_on_top_focus_area TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS practice_tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS task_attempts (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  response TEXT NOT NULL,
  score_placeholder_json TEXT NOT NULL,
  feedback_placeholder_json TEXT NOT NULL,
  feedback_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES practice_tasks(id)
);

CREATE TABLE IF NOT EXISTS anti_signals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  related_session_id TEXT,
  related_task_attempt_id TEXT,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  signal_strength INTEGER NOT NULL,
  recommended_action TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (related_session_id) REFERENCES diagnostic_sessions(id),
  FOREIGN KEY (related_task_attempt_id) REFERENCES task_attempts(id)
);

CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_id ON organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_created_at ON organization_memberships(created_at);

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_user_id ON diagnostic_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_org_id ON diagnostic_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_started_at ON diagnostic_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_completed_at ON diagnostic_sessions(completed_at);

CREATE INDEX IF NOT EXISTS idx_growth_paths_user_id ON growth_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_paths_created_at ON growth_paths(created_at);
CREATE INDEX IF NOT EXISTS idx_growth_paths_updated_at ON growth_paths(updated_at);

CREATE INDEX IF NOT EXISTS idx_practice_tasks_created_at ON practice_tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_task_attempts_user_id ON task_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_task_attempts_task_id ON task_attempts(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attempts_created_at ON task_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_anti_signals_user_id ON anti_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_anti_signals_created_at ON anti_signals(created_at);
CREATE INDEX IF NOT EXISTS idx_anti_signals_session_id ON anti_signals(related_session_id);
CREATE INDEX IF NOT EXISTS idx_anti_signals_attempt_id ON anti_signals(related_task_attempt_id);
