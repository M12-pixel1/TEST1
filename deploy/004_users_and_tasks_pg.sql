-- V1.1: Users table + task_results for HTTP API layer
-- Run against augimo_programa database

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'learner',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS task_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  task_id VARCHAR(100) NOT NULL,
  score DECIMAL(3,2) NOT NULL,
  error_type VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_results_user ON task_results(user_id, created_at DESC);

-- Grant to augimo_user
GRANT ALL ON ALL TABLES IN SCHEMA public TO augimo_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO augimo_user;
