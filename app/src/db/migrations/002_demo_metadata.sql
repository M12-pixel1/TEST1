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
