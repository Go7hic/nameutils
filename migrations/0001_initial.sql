PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  google_subject TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  domain_name TEXT NOT NULL,
  registrar TEXT NOT NULL DEFAULT '',
  registration_date TEXT,
  expiration_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT NOT NULL DEFAULT '',
  is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
  auto_renew INTEGER NOT NULL DEFAULT 0 CHECK (auto_renew IN (0, 1)),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price REAL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_user_domain_unique
  ON domains(user_id, domain_name);
CREATE INDEX IF NOT EXISTS idx_domains_user_id
  ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_expiration_date
  ON domains(expiration_date);

CREATE TABLE IF NOT EXISTS domain_tags (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_domain_tags_domain_id
  ON domain_tags(domain_id);
