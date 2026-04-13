import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { resolveDbRuntimeConfig, type EnvReader } from '../config/db-config.ts';

export interface V1Db {
  database: DatabaseSync;
  close: () => void;
}

const migration_001_init_v1 = `
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
`;

const migration_002_demo_metadata = `
CREATE TABLE IF NOT EXISTS demo_organizations (
  organization_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  segment TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS demo_users (
  user_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  role TEXT NOT NULL,
  display_name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX IF NOT EXISTS idx_demo_users_org_id ON demo_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_demo_users_role ON demo_users(role);
CREATE INDEX IF NOT EXISTS idx_demo_users_created_at ON demo_users(created_at);
`;

const migration_003_anti_matter_core = `
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
`;

const V1_MIGRATIONS: Array<{ version: string; sql: string }> = [
  { version: '001_init_v1', sql: migration_001_init_v1 },
  { version: '002_demo_metadata', sql: migration_002_demo_metadata },
  { version: '003_anti_matter_core', sql: migration_003_anti_matter_core }
];

const ensureMigrationsTable = (database: DatabaseSync): void => {
  database.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);
};

const hasMigration = (database: DatabaseSync, version: string): boolean => {
  const row = database
    .prepare('SELECT version FROM schema_migrations WHERE version = ?')
    .get(version) as { version: string } | undefined;

  return Boolean(row);
};

const applyMigration = (database: DatabaseSync, version: string, sql: string): void => {
  database.exec('BEGIN');
  try {
    database.exec(sql);
    database
      .prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
      .run(version, new Date().toISOString());
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
};

export const runV1Migrations = (database: DatabaseSync): void => {
  ensureMigrationsTable(database);

  V1_MIGRATIONS.forEach((migration) => {
    if (!hasMigration(database, migration.version)) {
      applyMigration(database, migration.version, migration.sql);
    }
  });
};

export const createV1Db = (path = ':memory:'): V1Db => {
  if (path !== ':memory:') {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const database = new DatabaseSync(path);
  database.exec('PRAGMA foreign_keys = ON');
  runV1Migrations(database);

  return {
    database,
    close: () => database.close()
  };
};

export const createConfiguredV1Db = (env: EnvReader): V1Db => {
  const config = resolveDbRuntimeConfig(env);
  return createV1Db(config.dbPath);
};
