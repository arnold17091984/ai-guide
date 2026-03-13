-- ============================================================
-- Migration 0020: Create All Tables
-- ============================================================
-- Complete, idempotent migration that creates every table
-- defined in the Drizzle schema files. Safe to run on a fresh
-- database or to verify schema completeness.
--
-- Table creation order respects foreign key dependencies:
--   1. users
--   2. taxonomy (categories, tags)
--   3. knowledge (knowledge_entries, knowledge_entry_tags)
--   4. skills (skills, skill_versions, skill_dependencies, skill_security_findings)
--   5. case_studies (case_studies, case_study_tags)
--   6. claude_configs (claude_configs, claude_config_sections, claude_config_tags)
--   7. social (votes, comments, edit_suggestions, bookmarks)
--   8. graph (content_relations, learning_paths, learning_path_steps,
--             user_learning_progress, content_embeddings,
--             user_content_interactions, recommendation_cache)
--   9. versioning (content_versions)
--  10. analytics (trending_content, content_scores, analytics_events,
--                 analytics_daily_content, analytics_contributions,
--                 analytics_skill_adoption)
--  11. achievements (achievements, user_achievements)
--  12. notifications (notifications, activity_feed)
--  13. trending (trending_items, trending_sources, user_bookmarks)
--  14. digests (weekly_digests, user_digest_preferences)
--  15. teams (teams, team_members, team_invites)
--  16. analytics.team_skill_snapshots (references teams)
--  17. skill_packages (skill_packages, skill_package_items, skill_package_stars)
--  18. knowledge_debt (knowledge_debt_items, debt_votes, debt_comments)

-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 1. users
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL,
  email         TEXT NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  role          TEXT NOT NULL DEFAULT 'contributor',
  locale        TEXT NOT NULL DEFAULT 'ko',
  github_handle TEXT,
  website_url   TEXT,
  reputation    INTEGER NOT NULL DEFAULT 0,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_uk ON users (username);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uk    ON users (email);
CREATE INDEX       IF NOT EXISTS users_role_idx     ON users (role);

-- ============================================================
-- 2. taxonomy — categories
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT NOT NULL,
  label_ko   TEXT NOT NULL,
  label_en   TEXT NOT NULL,
  label_ja   TEXT NOT NULL,
  icon       TEXT,
  parent_id  UUID REFERENCES categories (id),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_uk   ON categories (slug);
CREATE INDEX       IF NOT EXISTS categories_parent_idx ON categories (parent_id);

-- ============================================================
-- 2b. taxonomy — tags
-- ============================================================

CREATE TABLE IF NOT EXISTS tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT NOT NULL,
  label_ko   TEXT NOT NULL,
  label_en   TEXT NOT NULL,
  label_ja   TEXT NOT NULL,
  color      TEXT,
  category   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tags_slug_uk ON tags (slug);

-- ============================================================
-- 3. knowledge_entries
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL,
  content_type     TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft',
  difficulty_level TEXT,
  author_id        UUID NOT NULL REFERENCES users (id),
  category_id      UUID REFERENCES categories (id),

  -- Localized content
  title_ko   TEXT NOT NULL,
  title_en   TEXT,
  title_ja   TEXT,
  summary_ko TEXT,
  summary_en TEXT,
  summary_ja TEXT,
  body_ko    TEXT,
  body_en    TEXT,
  body_ja    TEXT,

  -- Metadata
  read_time_mins  INTEGER,
  featured_image  TEXT,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Full-text search (generated columns added separately or via trigger)
  search_ko TEXT,
  search_en TEXT,
  search_ja TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_entries_slug_uk       ON knowledge_entries (slug);
CREATE INDEX       IF NOT EXISTS knowledge_entries_status_idx     ON knowledge_entries (status);
CREATE INDEX       IF NOT EXISTS knowledge_entries_type_idx       ON knowledge_entries (content_type);
CREATE INDEX       IF NOT EXISTS knowledge_entries_author_idx     ON knowledge_entries (author_id);
CREATE INDEX       IF NOT EXISTS knowledge_entries_category_idx   ON knowledge_entries (category_id);
CREATE INDEX       IF NOT EXISTS knowledge_entries_published_idx  ON knowledge_entries (published_at);

-- ============================================================
-- 3b. knowledge_entry_tags (junction)
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_entry_tags (
  entry_id UUID NOT NULL REFERENCES knowledge_entries (id) ON DELETE CASCADE,
  tag_id   UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

-- ============================================================
-- 4. skills
-- ============================================================

CREATE TABLE IF NOT EXISTS skills (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT NOT NULL,
  author_id           UUID NOT NULL REFERENCES users (id),
  category_id         UUID REFERENCES categories (id),
  name                TEXT NOT NULL,
  description         TEXT NOT NULL,
  current_version     TEXT NOT NULL,
  license             TEXT,
  homepage_url        TEXT,
  status              TEXT NOT NULL DEFAULT 'draft',
  compatible_min      TEXT,
  compatible_max      TEXT,
  triggers            TEXT[] NOT NULL,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  downloads           INTEGER NOT NULL DEFAULT 0,
  stars               INTEGER NOT NULL DEFAULT 0,
  forks               INTEGER NOT NULL DEFAULT 0,
  weekly_downloads    INTEGER[] NOT NULL DEFAULT '{}',
  body                TEXT NOT NULL,
  content_hash        TEXT NOT NULL,
  security_scanned_at TIMESTAMPTZ,
  security_passed     BOOLEAN,
  security_risk_score INTEGER,
  search_vec          TEXT,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS skills_slug_uk      ON skills (slug);
CREATE INDEX       IF NOT EXISTS skills_author_idx    ON skills (author_id);
CREATE INDEX       IF NOT EXISTS skills_status_idx    ON skills (status);
CREATE INDEX       IF NOT EXISTS skills_category_idx  ON skills (category_id);

-- ============================================================
-- 4b. skill_versions
-- ============================================================

CREATE TABLE IF NOT EXISTS skill_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id     UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
  version      TEXT NOT NULL,
  body         TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  changelog    TEXT,
  yanked       BOOLEAN NOT NULL DEFAULT FALSE,
  yanked_reason TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by UUID REFERENCES users (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS skill_versions_uk        ON skill_versions (skill_id, version);
CREATE INDEX       IF NOT EXISTS skill_versions_skill_idx  ON skill_versions (skill_id);

-- ============================================================
-- 4c. skill_dependencies (self-referential)
-- ============================================================

CREATE TABLE IF NOT EXISTS skill_dependencies (
  skill_id      UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES skills (id) ON DELETE RESTRICT,
  version_range TEXT,
  required      BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (skill_id, depends_on_id)
);

CREATE INDEX IF NOT EXISTS skill_deps_depends_on_idx ON skill_dependencies (depends_on_id);

-- ============================================================
-- 4d. skill_security_findings
-- ============================================================

CREATE TABLE IF NOT EXISTS skill_security_findings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id   UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
  version_id UUID REFERENCES skill_versions (id) ON DELETE CASCADE,
  level      TEXT NOT NULL,
  rule       TEXT NOT NULL,
  message    TEXT NOT NULL,
  lines      INTEGER[],
  suggestion TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS skill_findings_skill_idx   ON skill_security_findings (skill_id);
CREATE INDEX IF NOT EXISTS skill_findings_version_idx ON skill_security_findings (version_id);

-- ============================================================
-- 5. case_studies
-- ============================================================

CREATE TABLE IF NOT EXISTS case_studies (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    TEXT NOT NULL,
  author_id               UUID NOT NULL REFERENCES users (id),
  category_id             UUID REFERENCES categories (id),
  status                  TEXT NOT NULL DEFAULT 'draft',

  -- Localized content
  title_ko   TEXT NOT NULL,
  title_en   TEXT,
  title_ja   TEXT,
  summary_ko TEXT,
  summary_en TEXT,
  summary_ja TEXT,
  body_ko    TEXT,
  body_en    TEXT,
  body_ja    TEXT,

  -- Structured fields
  team_size               INTEGER,
  project_duration_weeks  INTEGER,
  industry                TEXT,
  tech_stack              TEXT[] NOT NULL DEFAULT '{}',
  metrics                 JSONB NOT NULL DEFAULT '{}',
  featured_image          TEXT,
  is_featured             BOOLEAN NOT NULL DEFAULT FALSE,
  search_en               TEXT,
  search_ko               TEXT,
  published_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS case_studies_slug_uk        ON case_studies (slug);
CREATE INDEX       IF NOT EXISTS case_studies_status_idx      ON case_studies (status);
CREATE INDEX       IF NOT EXISTS case_studies_author_idx      ON case_studies (author_id);
CREATE INDEX       IF NOT EXISTS case_studies_category_idx    ON case_studies (category_id);
CREATE INDEX       IF NOT EXISTS case_studies_published_idx   ON case_studies (published_at);

-- ============================================================
-- 5b. case_study_tags (junction)
-- ============================================================

CREATE TABLE IF NOT EXISTS case_study_tags (
  case_study_id UUID NOT NULL REFERENCES case_studies (id) ON DELETE CASCADE,
  tag_id        UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (case_study_id, tag_id)
);

-- ============================================================
-- 6. claude_configs
-- ============================================================

CREATE TABLE IF NOT EXISTS claude_configs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               TEXT NOT NULL,
  author_id          UUID NOT NULL REFERENCES users (id),
  title              TEXT NOT NULL,
  description        TEXT,
  role_type          TEXT,
  body               TEXT NOT NULL,
  completeness_score INTEGER NOT NULL DEFAULT 0,
  quality_score      INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'draft',
  is_template        BOOLEAN NOT NULL DEFAULT FALSE,
  stars              INTEGER NOT NULL DEFAULT 0,
  forks              INTEGER NOT NULL DEFAULT 0,
  search_vec         TEXT,
  published_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS claude_configs_slug_uk      ON claude_configs (slug);
CREATE INDEX       IF NOT EXISTS claude_configs_author_idx    ON claude_configs (author_id);
CREATE INDEX       IF NOT EXISTS claude_configs_status_idx    ON claude_configs (status);
CREATE INDEX       IF NOT EXISTS claude_configs_template_idx  ON claude_configs (is_template);

-- ============================================================
-- 6b. claude_config_sections
-- ============================================================

CREATE TABLE IF NOT EXISTS claude_config_sections (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id  UUID NOT NULL REFERENCES claude_configs (id) ON DELETE CASCADE,
  heading    TEXT NOT NULL,
  level      INTEGER NOT NULL,
  content    TEXT NOT NULL,
  line_start INTEGER,
  line_end   INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS config_sections_config_idx ON claude_config_sections (config_id);

-- ============================================================
-- 6c. claude_config_tags (junction)
-- ============================================================

CREATE TABLE IF NOT EXISTS claude_config_tags (
  config_id UUID NOT NULL REFERENCES claude_configs (id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (config_id, tag_id)
);

-- ============================================================
-- 7. social — votes
-- ============================================================

CREATE TABLE IF NOT EXISTS votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id   UUID NOT NULL,
  value       SMALLINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS votes_user_target_uk ON votes (user_id, target_type, target_id);
CREATE INDEX       IF NOT EXISTS votes_target_idx      ON votes (target_type, target_id);

-- ============================================================
-- 7b. social — comments
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID REFERENCES users (id) ON DELETE SET NULL,
  parent_id   UUID,
  target_type TEXT NOT NULL,
  target_id   UUID NOT NULL,
  body        TEXT NOT NULL,
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_target_idx ON comments (target_type, target_id);
CREATE INDEX IF NOT EXISTS comments_author_idx ON comments (author_id);
CREATE INDEX IF NOT EXISTS comments_parent_idx ON comments (parent_id);

-- ============================================================
-- 7c. social — edit_suggestions
-- ============================================================

CREATE TABLE IF NOT EXISTS edit_suggestions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES users (id),
  reviewed_by     UUID REFERENCES users (id),
  target_type     TEXT NOT NULL,
  target_id       UUID NOT NULL,
  field           TEXT NOT NULL,
  original_body   TEXT NOT NULL,
  suggested_body  TEXT NOT NULL,
  summary         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS edit_suggestions_target_idx ON edit_suggestions (target_type, target_id);
CREATE INDEX IF NOT EXISTS edit_suggestions_status_idx ON edit_suggestions (status);
CREATE INDEX IF NOT EXISTS edit_suggestions_author_idx ON edit_suggestions (author_id);

-- ============================================================
-- 7d. social — bookmarks
-- ============================================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id   UUID NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_uk       ON bookmarks (user_id, content_type, content_id);
CREATE INDEX       IF NOT EXISTS bookmarks_user_idx  ON bookmarks (user_id);

-- ============================================================
-- 8. graph — content_relations
-- ============================================================

CREATE TABLE IF NOT EXISTS content_relations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type   TEXT NOT NULL,
  source_id     UUID NOT NULL,
  target_type   TEXT NOT NULL,
  target_id     UUID NOT NULL,
  relation_type TEXT NOT NULL,
  weight        REAL NOT NULL DEFAULT 1.0,
  is_manual     BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    UUID REFERENCES users (id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS content_relations_uk         ON content_relations (source_type, source_id, target_type, target_id, relation_type);
CREATE INDEX       IF NOT EXISTS content_relations_source_idx  ON content_relations (source_type, source_id);
CREATE INDEX       IF NOT EXISTS content_relations_target_idx  ON content_relations (target_type, target_id);
CREATE INDEX       IF NOT EXISTS content_relations_type_idx    ON content_relations (relation_type);

-- ============================================================
-- 8b. graph — learning_paths
-- ============================================================

CREATE TABLE IF NOT EXISTS learning_paths (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id        UUID NOT NULL REFERENCES users (id),
  title_ko         TEXT NOT NULL,
  title_en         TEXT,
  title_ja         TEXT,
  description_ko   TEXT,
  description_en   TEXT,
  description_ja   TEXT,
  target_role      TEXT,
  difficulty_level TEXT,
  estimated_hours  INTEGER,
  is_official      BOOLEAN NOT NULL DEFAULT FALSE,
  status           TEXT NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learning_paths_author_idx ON learning_paths (author_id);
CREATE INDEX IF NOT EXISTS learning_paths_role_idx   ON learning_paths (target_role);
CREATE INDEX IF NOT EXISTS learning_paths_status_idx ON learning_paths (status);

-- ============================================================
-- 8c. graph — learning_path_steps
-- ============================================================

CREATE TABLE IF NOT EXISTS learning_path_steps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id      UUID NOT NULL REFERENCES learning_paths (id) ON DELETE CASCADE,
  step_number  INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  content_id   UUID NOT NULL,
  is_required  BOOLEAN NOT NULL DEFAULT TRUE,
  notes_ko     TEXT,
  notes_en     TEXT,
  notes_ja     TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS path_steps_uk       ON learning_path_steps (path_id, step_number);
CREATE INDEX       IF NOT EXISTS path_steps_path_idx  ON learning_path_steps (path_id);

-- ============================================================
-- 8d. graph — user_learning_progress
-- ============================================================

CREATE TABLE IF NOT EXISTS user_learning_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  path_id         UUID NOT NULL REFERENCES learning_paths (id),
  step_id         UUID NOT NULL REFERENCES learning_path_steps (id),
  status          TEXT NOT NULL DEFAULT 'not_started',
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  time_spent_secs INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS user_progress_uk           ON user_learning_progress (user_id, path_id, step_id);
CREATE INDEX       IF NOT EXISTS user_progress_user_path_idx ON user_learning_progress (user_id, path_id);

-- ============================================================
-- 8e. graph — content_embeddings
-- ============================================================

CREATE TABLE IF NOT EXISTS content_embeddings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id   UUID NOT NULL,
  model        TEXT NOT NULL,
  -- Declared as TEXT; ALTER TABLE to vector(1536) if pgvector is installed
  embedding    TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS content_embeddings_uk   ON content_embeddings (content_type, content_id, model);
CREATE INDEX       IF NOT EXISTS embeddings_content_idx   ON content_embeddings (content_type, content_id);

-- ============================================================
-- 8f. graph — user_content_interactions
-- ============================================================

CREATE TABLE IF NOT EXISTS user_content_interactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content_type     TEXT NOT NULL,
  content_id       UUID NOT NULL,
  interaction_type TEXT NOT NULL,
  weight           REAL NOT NULL,
  session_id       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS interactions_user_idx    ON user_content_interactions (user_id, content_type);
CREATE INDEX IF NOT EXISTS interactions_content_idx ON user_content_interactions (content_type, content_id);
CREATE INDEX IF NOT EXISTS interactions_created_idx ON user_content_interactions (created_at);

-- ============================================================
-- 8g. graph — recommendation_cache
-- ============================================================

CREATE TABLE IF NOT EXISTS recommendation_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users (id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id   UUID NOT NULL,
  score        REAL NOT NULL,
  reason       TEXT,
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS reco_user_score_idx ON recommendation_cache (user_id, content_type, score);
CREATE INDEX IF NOT EXISTS reco_expires_idx    ON recommendation_cache (expires_at);

-- ============================================================
-- 9. versioning — content_versions
-- ============================================================

CREATE TABLE IF NOT EXISTS content_versions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type       TEXT NOT NULL,
  content_id         UUID NOT NULL,
  version_number     INTEGER NOT NULL,
  author_id          UUID REFERENCES users (id),
  edit_suggestion_id UUID,
  snapshot           JSONB NOT NULL,
  diff_patch         JSONB,
  change_summary     TEXT,
  change_type        TEXT NOT NULL DEFAULT 'edit',
  base_version       INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS content_versions_uk          ON content_versions (content_type, content_id, version_number);
CREATE INDEX       IF NOT EXISTS content_versions_content_idx  ON content_versions (content_type, content_id, version_number);
CREATE INDEX       IF NOT EXISTS content_versions_author_idx   ON content_versions (author_id);
CREATE INDEX       IF NOT EXISTS content_versions_date_idx     ON content_versions (created_at);

-- ============================================================
-- 10. analytics — trending_content
-- ============================================================

CREATE TABLE IF NOT EXISTS trending_content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL,
  external_id     TEXT NOT NULL,
  url             TEXT NOT NULL,
  title           TEXT NOT NULL,
  summary         TEXT,
  author_handle   TEXT,
  author_name     TEXT,
  raw_metrics     JSONB NOT NULL DEFAULT '{}',
  relevance_score REAL NOT NULL DEFAULT 0,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  is_curated      BOOLEAN NOT NULL DEFAULT FALSE,
  curated_by      UUID REFERENCES users (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS trending_content_source_uk ON trending_content (source, external_id);
CREATE INDEX       IF NOT EXISTS trending_score_idx          ON trending_content (relevance_score);
CREATE INDEX       IF NOT EXISTS trending_expires_idx        ON trending_content (expires_at);

-- ============================================================
-- 10b. analytics — content_scores
-- ============================================================

CREATE TABLE IF NOT EXISTS content_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type    TEXT NOT NULL,
  content_id      UUID NOT NULL,
  votes_score     INTEGER NOT NULL DEFAULT 0,
  views_24h       INTEGER NOT NULL DEFAULT 0,
  views_7d        INTEGER NOT NULL DEFAULT 0,
  views_total     INTEGER NOT NULL DEFAULT 0,
  comments_count  INTEGER NOT NULL DEFAULT 0,
  bookmarks_count INTEGER NOT NULL DEFAULT 0,
  installs_count  INTEGER NOT NULL DEFAULT 0,
  trending_score  REAL NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS content_scores_uk      ON content_scores (content_type, content_id);
CREATE INDEX       IF NOT EXISTS scores_trending_idx     ON content_scores (content_type, trending_score);

-- ============================================================
-- 10c. analytics — analytics_events
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       TEXT NOT NULL,
  user_id          UUID REFERENCES users (id) ON DELETE CASCADE,
  session_id       TEXT NOT NULL,
  content_type     TEXT,
  content_id       UUID,
  locale           TEXT NOT NULL DEFAULT 'ko',
  referrer         TEXT,
  search_query     TEXT,
  properties       JSONB NOT NULL DEFAULT '{}',
  ip_country       TEXT,
  user_agent_hash  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_user_idx    ON analytics_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS events_content_idx ON analytics_events (content_type, content_id);
CREATE INDEX IF NOT EXISTS events_type_idx    ON analytics_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS events_session_idx ON analytics_events (session_id);

-- ============================================================
-- 10d. analytics — analytics_daily_content
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_daily_content (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date             DATE NOT NULL,
  content_type     TEXT NOT NULL,
  content_id       UUID NOT NULL,
  locale           TEXT NOT NULL,
  views            INTEGER NOT NULL DEFAULT 0,
  unique_visitors  INTEGER NOT NULL DEFAULT 0,
  avg_time_secs    INTEGER NOT NULL DEFAULT 0,
  votes_cast       INTEGER NOT NULL DEFAULT 0,
  comments_posted  INTEGER NOT NULL DEFAULT 0,
  copies           INTEGER NOT NULL DEFAULT 0,
  shares           INTEGER NOT NULL DEFAULT 0,
  bookmarks        INTEGER NOT NULL DEFAULT 0,
  installs         INTEGER NOT NULL DEFAULT 0,
  bounce_rate      REAL NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS analytics_daily_uk       ON analytics_daily_content (date, content_type, content_id, locale);
CREATE INDEX       IF NOT EXISTS analytics_daily_date_idx  ON analytics_daily_content (date);
CREATE INDEX       IF NOT EXISTS analytics_daily_type_idx  ON analytics_daily_content (content_type, date);

-- ============================================================
-- 10e. analytics — analytics_contributions
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_contributions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users (id),
  month            DATE NOT NULL,
  entries_created  INTEGER NOT NULL DEFAULT 0,
  entries_edited   INTEGER NOT NULL DEFAULT 0,
  skills_published INTEGER NOT NULL DEFAULT 0,
  case_studies     INTEGER NOT NULL DEFAULT 0,
  claude_configs   INTEGER NOT NULL DEFAULT 0,
  edits_accepted   INTEGER NOT NULL DEFAULT 0,
  edits_rejected   INTEGER NOT NULL DEFAULT 0,
  comments_posted  INTEGER NOT NULL DEFAULT 0,
  votes_cast       INTEGER NOT NULL DEFAULT 0,
  reputation_earned INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS analytics_contrib_uk ON analytics_contributions (user_id, month);

-- ============================================================
-- 10f. analytics — analytics_skill_adoption
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_skill_adoption (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id         UUID NOT NULL REFERENCES users (id),
  week_start       DATE NOT NULL,
  new_installs     INTEGER NOT NULL DEFAULT 0,
  total_installs   INTEGER NOT NULL DEFAULT 0,
  active_users     INTEGER NOT NULL DEFAULT 0,
  uninstalls       INTEGER NOT NULL DEFAULT 0,
  retention_rate   REAL NOT NULL DEFAULT 0,
  version_breakdown JSONB NOT NULL DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS skill_adoption_uk       ON analytics_skill_adoption (skill_id, week_start);
CREATE INDEX       IF NOT EXISTS skill_adoption_week_idx  ON analytics_skill_adoption (week_start);

-- ============================================================
-- 11. achievements
-- ============================================================

CREATE TABLE IF NOT EXISTS achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(100) NOT NULL,
  name_key        VARCHAR(200) NOT NULL,
  description_key VARCHAR(200) NOT NULL,
  icon_name       VARCHAR(100) NOT NULL,
  category        TEXT NOT NULL,
  tier            TEXT NOT NULL,
  required_value  INTEGER NOT NULL DEFAULT 1,
  is_secret       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS achievements_slug_uk       ON achievements (slug);
CREATE INDEX       IF NOT EXISTS achievements_category_idx   ON achievements (category);
CREATE INDEX       IF NOT EXISTS achievements_tier_idx       ON achievements (tier);

-- ============================================================
-- 11b. user_achievements
-- ============================================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements (id) ON DELETE CASCADE,
  progress       INTEGER NOT NULL DEFAULT 0,
  unlocked_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS user_achievements_uk              ON user_achievements (user_id, achievement_id);
CREATE INDEX       IF NOT EXISTS user_achievements_user_idx         ON user_achievements (user_id);
CREATE INDEX       IF NOT EXISTS user_achievements_achievement_idx  ON user_achievements (achievement_id);

-- ============================================================
-- 12. notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT NOT NULL,
  link_url   VARCHAR(500),
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS notifications_user_idx        ON notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_created_idx     ON notifications (created_at);

-- ============================================================
-- 12b. activity_feed
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  action_type  VARCHAR(50) NOT NULL,
  target_type  VARCHAR(50) NOT NULL,
  target_id    UUID NOT NULL,
  target_title VARCHAR(500) NOT NULL,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_public    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS activity_feed_actor_idx   ON activity_feed (actor_id);
CREATE INDEX IF NOT EXISTS activity_feed_created_idx ON activity_feed (created_at);
CREATE INDEX IF NOT EXISTS activity_feed_action_idx  ON activity_feed (action_type);
CREATE INDEX IF NOT EXISTS activity_feed_public_idx  ON activity_feed (is_public, created_at);

-- ============================================================
-- 13. trending — trending_items
-- ============================================================

CREATE TABLE IF NOT EXISTS trending_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source            VARCHAR(32) NOT NULL,
  external_id       VARCHAR(255) NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  url               TEXT NOT NULL,
  author_name       VARCHAR(255),
  author_avatar_url VARCHAR(512),
  score             INTEGER NOT NULL DEFAULT 0,
  comment_count     INTEGER NOT NULL DEFAULT 0,
  tags              JSONB NOT NULL DEFAULT '[]',
  image_url         VARCHAR(512),
  published_at      TIMESTAMPTZ NOT NULL,
  fetched_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata          JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS trending_items_source_external_uk ON trending_items (source, external_id);
CREATE INDEX       IF NOT EXISTS trending_items_source_idx          ON trending_items (source);
CREATE INDEX       IF NOT EXISTS trending_items_score_idx           ON trending_items (score);
CREATE INDEX       IF NOT EXISTS trending_items_published_idx       ON trending_items (published_at);

-- ============================================================
-- 13b. trending — trending_sources
-- ============================================================

CREATE TABLE IF NOT EXISTS trending_sources (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   VARCHAR(32) NOT NULL,
  display_name           VARCHAR(64) NOT NULL,
  icon_name              VARCHAR(32) NOT NULL,
  base_url               VARCHAR(255) NOT NULL,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  last_fetched_at        TIMESTAMPTZ,
  fetch_interval_minutes INTEGER NOT NULL DEFAULT 30
);

CREATE UNIQUE INDEX IF NOT EXISTS trending_sources_name_uk ON trending_sources (name);

-- ============================================================
-- 13c. trending — user_bookmarks
-- ============================================================

CREATE TABLE IF NOT EXISTS user_bookmarks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  trending_item_id UUID NOT NULL REFERENCES trending_items (id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_bookmarks_uk        ON user_bookmarks (user_id, trending_item_id);
CREATE INDEX       IF NOT EXISTS user_bookmarks_user_idx   ON user_bookmarks (user_id);
CREATE INDEX       IF NOT EXISTS user_bookmarks_item_idx   ON user_bookmarks (trending_item_id);

-- ============================================================
-- 14. digests — weekly_digests
-- ============================================================

CREATE TABLE IF NOT EXISTS weekly_digests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start       TIMESTAMPTZ NOT NULL,
  week_end         TIMESTAMPTZ NOT NULL,
  top_entries      JSONB NOT NULL DEFAULT '[]',
  top_skills       JSONB NOT NULL DEFAULT '[]',
  top_contributors JSONB NOT NULL DEFAULT '[]',
  stats            JSONB NOT NULL DEFAULT '{}',
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weekly_digests_week_idx ON weekly_digests (week_start);

-- ============================================================
-- 14b. digests — user_digest_preferences
-- ============================================================

CREATE TABLE IF NOT EXISTS user_digest_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  email_digest      BOOLEAN NOT NULL DEFAULT TRUE,
  digest_frequency  TEXT NOT NULL DEFAULT 'weekly',
  preferred_sources JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_digest_prefs_user_uk ON user_digest_preferences (user_id);

-- ============================================================
-- 15. teams
-- ============================================================

CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT,
  avatar_url  TEXT,
  owner_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  is_public   BOOLEAN NOT NULL DEFAULT TRUE,
  max_members INTEGER NOT NULL DEFAULT 10,
  settings    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS teams_slug_uk      ON teams (slug);
CREATE INDEX       IF NOT EXISTS teams_owner_id_idx  ON teams (owner_id);

-- ============================================================
-- 15b. team_members
-- ============================================================

CREATE TABLE IF NOT EXISTS team_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT team_members_team_user_uk UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON team_members (team_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members (user_id);

-- ============================================================
-- 15c. team_invites
-- ============================================================

CREATE TABLE IF NOT EXISTS team_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  inviter_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  token         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS team_invites_token_uk          ON team_invites (token);
CREATE INDEX       IF NOT EXISTS team_invites_team_id_idx        ON team_invites (team_id);
CREATE INDEX       IF NOT EXISTS team_invites_invitee_email_idx  ON team_invites (invitee_email);

-- ============================================================
-- 16. analytics — team_skill_snapshots (references teams)
-- ============================================================

CREATE TABLE IF NOT EXISTS team_skill_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          UUID NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  week_start       DATE NOT NULL,
  total_members    INTEGER NOT NULL,
  skills_installed JSONB NOT NULL,
  coverage_score   REAL NOT NULL DEFAULT 0,
  categories       JSONB NOT NULL DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS team_snapshots_uk ON team_skill_snapshots (team_id, week_start);

-- ============================================================
-- 17. skill_packages
-- ============================================================

CREATE TABLE IF NOT EXISTS skill_packages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT NOT NULL,
  author_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  is_public     BOOLEAN NOT NULL DEFAULT TRUE,
  icon_name     TEXT,
  tags          JSONB NOT NULL DEFAULT '[]',
  install_count INTEGER NOT NULL DEFAULT 0,
  star_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS skill_packages_slug_uk      ON skill_packages (slug);
CREATE INDEX       IF NOT EXISTS skill_packages_author_idx    ON skill_packages (author_id);
CREATE INDEX       IF NOT EXISTS skill_packages_public_idx    ON skill_packages (is_public);

-- ============================================================
-- 17b. skill_package_items (junction)
-- ============================================================

CREATE TABLE IF NOT EXISTS skill_package_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES skill_packages (id) ON DELETE CASCADE,
  skill_id   UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
  "order"    INTEGER NOT NULL DEFAULT 0,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS skill_package_items_uk         ON skill_package_items (package_id, skill_id);
CREATE INDEX       IF NOT EXISTS skill_package_items_pkg_idx     ON skill_package_items (package_id);
CREATE INDEX       IF NOT EXISTS skill_package_items_skill_idx   ON skill_package_items (skill_id);

-- ============================================================
-- 17c. skill_package_stars
-- ============================================================

CREATE TABLE IF NOT EXISTS skill_package_stars (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES skill_packages (id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS skill_package_stars_uk       ON skill_package_stars (package_id, user_id);
CREATE INDEX       IF NOT EXISTS skill_package_stars_pkg_idx   ON skill_package_stars (package_id);
CREATE INDEX       IF NOT EXISTS skill_package_stars_user_idx  ON skill_package_stars (user_id);

-- ============================================================
-- 18. knowledge_debt — knowledge_debt_items
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_debt_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  category         TEXT NOT NULL,
  priority         TEXT NOT NULL DEFAULT 'medium',
  status           TEXT NOT NULL DEFAULT 'open',
  reporter_id      UUID NOT NULL REFERENCES users (id),
  assignee_id      UUID REFERENCES users (id),
  related_entry_id UUID REFERENCES knowledge_entries (id),
  tags             JSONB DEFAULT '[]',
  resolved_at      TIMESTAMPTZ,
  resolved_by_id   UUID REFERENCES users (id),
  resolution_note  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debt_items_status_idx   ON knowledge_debt_items (status);
CREATE INDEX IF NOT EXISTS debt_items_category_idx ON knowledge_debt_items (category);
CREATE INDEX IF NOT EXISTS debt_items_priority_idx ON knowledge_debt_items (priority);
CREATE INDEX IF NOT EXISTS debt_items_reporter_idx ON knowledge_debt_items (reporter_id);
CREATE INDEX IF NOT EXISTS debt_items_assignee_idx ON knowledge_debt_items (assignee_id);
CREATE INDEX IF NOT EXISTS debt_items_created_idx  ON knowledge_debt_items (created_at);

-- ============================================================
-- 18b. debt_votes
-- ============================================================

CREATE TABLE IF NOT EXISTS debt_votes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_item_id UUID NOT NULL REFERENCES knowledge_debt_items (id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users (id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS debt_votes_item_user_uk ON debt_votes (debt_item_id, user_id);
CREATE INDEX       IF NOT EXISTS debt_votes_item_idx      ON debt_votes (debt_item_id);

-- ============================================================
-- 18c. debt_comments
-- ============================================================

CREATE TABLE IF NOT EXISTS debt_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_item_id UUID NOT NULL REFERENCES knowledge_debt_items (id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users (id),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debt_comments_item_idx ON debt_comments (debt_item_id);
