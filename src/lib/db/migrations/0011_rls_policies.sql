-- ============================================================
-- Migration 0011: Row Level Security Policies
-- ============================================================
-- All policies use auth.uid() from Supabase Auth JWT.
-- Enable RLS on all tables first, then add policies.
-- The service role key bypasses RLS for server-side operations.

-- ------------------------------------------------------------
-- Enable RLS on all tables
-- ------------------------------------------------------------

ALTER TABLE users                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entry_tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_versions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_dependencies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_security_findings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_study_tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_configs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_config_sections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_config_tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_suggestions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_relations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths            ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_steps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_content          ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_scores            ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members              ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------

-- Anyone can read public profiles
CREATE POLICY "users_select_public"
  ON users FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Insert handled by Supabase Auth trigger (service role)
CREATE POLICY "users_insert_service_role"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------
-- knowledge_entries
-- ------------------------------------------------------------

-- Published entries visible to everyone
CREATE POLICY "entries_select_published"
  ON knowledge_entries FOR SELECT
  USING (
    status = 'published'
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

-- Contributors can create draft entries
CREATE POLICY "entries_insert_contributors"
  ON knowledge_entries FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id = auth.uid()
  );

-- Authors can edit their own entries; moderators can edit any
CREATE POLICY "entries_update_authors_mods"
  ON knowledge_entries FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

-- Only admins can delete (soft archive preferred)
CREATE POLICY "entries_delete_admins"
  ON knowledge_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- skills (same pattern as knowledge_entries)
-- ------------------------------------------------------------

CREATE POLICY "skills_select_published"
  ON skills FOR SELECT
  USING (
    status IN ('published', 'deprecated')
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "skills_insert_contributors"
  ON skills FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY "skills_update_authors_mods"
  ON skills FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- ------------------------------------------------------------
-- case_studies (published or own drafts)
-- ------------------------------------------------------------

CREATE POLICY "case_studies_select"
  ON case_studies FOR SELECT
  USING (
    status = 'published'
    OR author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "case_studies_insert"
  ON case_studies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY "case_studies_update"
  ON case_studies FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- ------------------------------------------------------------
-- claude_configs (same as case_studies)
-- ------------------------------------------------------------

CREATE POLICY "claude_configs_select"
  ON claude_configs FOR SELECT
  USING (
    status = 'published'
    OR author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "claude_configs_insert"
  ON claude_configs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY "claude_configs_update"
  ON claude_configs FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- ------------------------------------------------------------
-- votes: users can only manage their own votes
-- ------------------------------------------------------------

CREATE POLICY "votes_select_all"    ON votes FOR SELECT USING (true);
CREATE POLICY "votes_insert_own"    ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_update_own"    ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "votes_delete_own"    ON votes FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- comments: public read, authenticated write, own edit
-- ------------------------------------------------------------

CREATE POLICY "comments_select_all"   ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_auth"  ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_update_own"   ON comments FOR UPDATE USING (auth.uid() = author_id);

-- Soft delete only — set is_deleted = true
CREATE POLICY "comments_delete_own_or_mod"
  ON comments FOR UPDATE
  USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- ------------------------------------------------------------
-- edit_suggestions: authors + moderators
-- ------------------------------------------------------------

CREATE POLICY "suggestions_select"
  ON edit_suggestions FOR SELECT
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "suggestions_insert"
  ON edit_suggestions FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Only moderators/admins can update status (accept/reject)
CREATE POLICY "suggestions_update_mods"
  ON edit_suggestions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- ------------------------------------------------------------
-- bookmarks: private to each user
-- ------------------------------------------------------------

CREATE POLICY "bookmarks_own"
  ON bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- analytics_events: insert-only for auth users; no SELECT via client
-- ------------------------------------------------------------

CREATE POLICY "analytics_events_insert"
  ON analytics_events FOR INSERT
  WITH CHECK (true);  -- allow anon inserts (session tracking)

CREATE POLICY "analytics_events_select_admins"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ------------------------------------------------------------
-- learning paths: public read, auth write
-- ------------------------------------------------------------

CREATE POLICY "learning_paths_select"
  ON learning_paths FOR SELECT
  USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "learning_paths_insert"
  ON learning_paths FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "learning_paths_update"
  ON learning_paths FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- ------------------------------------------------------------
-- user_learning_progress: private to each user
-- ------------------------------------------------------------

CREATE POLICY "progress_own"
  ON user_learning_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- teams: members can see their team; owner manages
-- ------------------------------------------------------------

CREATE POLICY "teams_select"
  ON teams FOR SELECT
  USING (
    is_public = true
    OR owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = id AND tm.user_id = auth.uid())
  );

CREATE POLICY "teams_insert"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "teams_update_owners"
  ON teams FOR UPDATE
  USING (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- content_relations, content_versions: public read, mod write
-- ------------------------------------------------------------

CREATE POLICY "content_relations_select" ON content_relations FOR SELECT USING (true);
CREATE POLICY "content_relations_write_mods"
  ON content_relations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      is_manual = false
      OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    )
  );

CREATE POLICY "content_versions_select" ON content_versions FOR SELECT USING (true);

-- ------------------------------------------------------------
-- Trending content: public read
-- ------------------------------------------------------------

CREATE POLICY "trending_content_select" ON trending_content FOR SELECT USING (true);
CREATE POLICY "content_scores_select"   ON content_scores   FOR SELECT USING (true);
