-- ============================================================
-- Migration 0012: Specialized Indexes
-- ============================================================
-- Applied AFTER all tables exist (depends on 0003–0010).
-- GIN indexes on tsvector generated columns and jsonb/array columns.
-- Trigram indexes for autocomplete.
-- pgvector HNSW index for ANN semantic search.

-- ------------------------------------------------------------
-- 1. Convert search columns to tsvector GENERATED ALWAYS AS
-- ------------------------------------------------------------
-- Drizzle declared these as text; we replace with proper generated columns.

-- knowledge_entries
ALTER TABLE knowledge_entries DROP COLUMN IF EXISTS search_ko;
ALTER TABLE knowledge_entries DROP COLUMN IF EXISTS search_en;
ALTER TABLE knowledge_entries DROP COLUMN IF EXISTS search_ja;

ALTER TABLE knowledge_entries
  ADD COLUMN search_ko tsvector
    GENERATED ALWAYS AS (
      to_tsvector('simple',
        coalesce(title_ko, '') || ' ' ||
        coalesce(summary_ko, '') || ' ' ||
        coalesce(body_ko, ''))
    ) STORED,
  ADD COLUMN search_en tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(title_en, '') || ' ' ||
        coalesce(summary_en, '') || ' ' ||
        coalesce(body_en, ''))
    ) STORED,
  ADD COLUMN search_ja tsvector
    GENERATED ALWAYS AS (
      to_tsvector('simple',
        coalesce(title_ja, '') || ' ' ||
        coalesce(summary_ja, '') || ' ' ||
        coalesce(body_ja, ''))
    ) STORED;

CREATE INDEX knowledge_entries_search_ko_idx ON knowledge_entries USING GIN (search_ko);
CREATE INDEX knowledge_entries_search_en_idx ON knowledge_entries USING GIN (search_en);
CREATE INDEX knowledge_entries_search_ja_idx ON knowledge_entries USING GIN (search_ja);

-- skills
ALTER TABLE skills DROP COLUMN IF EXISTS search_vec;
ALTER TABLE skills
  ADD COLUMN search_vec tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        name || ' ' || description || ' ' ||
        array_to_string(tags, ' '))
    ) STORED;

CREATE INDEX skills_search_idx   ON skills USING GIN (search_vec);
CREATE INDEX skills_triggers_idx ON skills USING GIN (triggers);
CREATE INDEX skills_tags_idx     ON skills USING GIN (tags);

-- case_studies
ALTER TABLE case_studies DROP COLUMN IF EXISTS search_en;
ALTER TABLE case_studies DROP COLUMN IF EXISTS search_ko;

ALTER TABLE case_studies
  ADD COLUMN search_en tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(title_en, '') || ' ' ||
        coalesce(summary_en, '') || ' ' ||
        coalesce(body_en, ''))
    ) STORED,
  ADD COLUMN search_ko tsvector
    GENERATED ALWAYS AS (
      to_tsvector('simple',
        coalesce(title_ko, '') || ' ' ||
        coalesce(summary_ko, '') || ' ' ||
        coalesce(body_ko, ''))
    ) STORED;

CREATE INDEX case_studies_search_en_idx ON case_studies USING GIN (search_en);
CREATE INDEX case_studies_search_ko_idx ON case_studies USING GIN (search_ko);
CREATE INDEX case_studies_metrics_idx   ON case_studies USING GIN (metrics);
CREATE INDEX case_studies_stack_idx     ON case_studies USING GIN (tech_stack);

-- claude_configs
ALTER TABLE claude_configs DROP COLUMN IF EXISTS search_vec;
ALTER TABLE claude_configs
  ADD COLUMN search_vec tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        title || ' ' ||
        coalesce(description, '') || ' ' ||
        body)
    ) STORED;

CREATE INDEX claude_configs_search_idx ON claude_configs USING GIN (search_vec);

-- ------------------------------------------------------------
-- 2. Trigram indexes for autocomplete / fuzzy title search
-- ------------------------------------------------------------

CREATE INDEX knowledge_entries_title_en_trgm_idx
  ON knowledge_entries USING GIN (title_en gin_trgm_ops);

CREATE INDEX knowledge_entries_title_ko_trgm_idx
  ON knowledge_entries USING GIN (title_ko gin_trgm_ops);

CREATE INDEX skills_name_trgm_idx
  ON skills USING GIN (name gin_trgm_ops);

CREATE INDEX case_studies_title_en_trgm_idx
  ON case_studies USING GIN (title_en gin_trgm_ops);

-- ------------------------------------------------------------
-- 3. pgvector: change embedding column to vector(1536)
--    and create HNSW index for ANN search
-- ------------------------------------------------------------

ALTER TABLE content_embeddings
  DROP COLUMN IF EXISTS embedding;

ALTER TABLE content_embeddings
  ADD COLUMN embedding vector(1536) NOT NULL;

-- HNSW index: faster queries than IVFFlat for < 1M vectors
-- m=16 neighbors per layer, ef_construction=64 (quality/build tradeoff)
CREATE INDEX content_embeddings_hnsw_idx
  ON content_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ------------------------------------------------------------
-- 4. analytics_events partitioning setup
-- ------------------------------------------------------------
-- Convert to range-partitioned table by month.
-- Run this BEFORE inserting any data.

-- Step 1: rename existing table (created by Drizzle)
ALTER TABLE analytics_events RENAME TO analytics_events_unpartitioned;

-- Step 2: create partitioned parent (no data)
CREATE TABLE analytics_events (
  LIKE analytics_events_unpartitioned INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Step 3: create initial monthly partitions
CREATE TABLE analytics_events_2026_03
  PARTITION OF analytics_events
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE analytics_events_2026_04
  PARTITION OF analytics_events
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE analytics_events_2026_05
  PARTITION OF analytics_events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE analytics_events_2026_06
  PARTITION OF analytics_events
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- Step 4: migrate existing data (if any)
INSERT INTO analytics_events SELECT * FROM analytics_events_unpartitioned;
DROP TABLE analytics_events_unpartitioned;

-- ------------------------------------------------------------
-- 5. Materialized view for search facets
-- ------------------------------------------------------------

CREATE MATERIALIZED VIEW search_facets AS
SELECT
  'category'   AS facet_type,
  c.slug       AS facet_value,
  c.label_en   AS facet_label,
  COUNT(ke.id) AS count
FROM categories c
LEFT JOIN knowledge_entries ke
  ON ke.category_id = c.id AND ke.status = 'published'
GROUP BY c.slug, c.label_en

UNION ALL

SELECT
  'difficulty'        AS facet_type,
  ke.difficulty_level AS facet_value,
  ke.difficulty_level AS facet_label,
  COUNT(*)
FROM knowledge_entries ke
WHERE ke.status = 'published'
  AND ke.difficulty_level IS NOT NULL
GROUP BY ke.difficulty_level

UNION ALL

SELECT
  'content_type'  AS facet_type,
  ke.content_type AS facet_value,
  ke.content_type AS facet_label,
  COUNT(*)
FROM knowledge_entries ke
WHERE ke.status = 'published'
GROUP BY ke.content_type

UNION ALL

SELECT
  'tag'       AS facet_type,
  t.slug      AS facet_value,
  t.label_en  AS facet_label,
  COUNT(et.entry_id)
FROM tags t
LEFT JOIN knowledge_entry_tags et ON et.tag_id = t.id
LEFT JOIN knowledge_entries ke ON ke.id = et.entry_id
  AND ke.status = 'published'
GROUP BY t.slug, t.label_en
HAVING COUNT(et.entry_id) > 0;

CREATE UNIQUE INDEX search_facets_uk ON search_facets (facet_type, facet_value);

-- Refresh command (called by pg_cron job every 10 minutes):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY search_facets;

-- ------------------------------------------------------------
-- 6. Skill dependency closure (materialized view)
-- ------------------------------------------------------------

CREATE MATERIALIZED VIEW skill_dep_closure AS
WITH RECURSIVE closure AS (
  SELECT
    skill_id,
    depends_on_id,
    1          AS depth,
    ARRAY[skill_id] AS path
  FROM skill_dependencies
  WHERE required = true

  UNION ALL

  SELECT
    c.skill_id,
    d.depends_on_id,
    c.depth + 1,
    c.path || d.depends_on_id
  FROM closure c
  JOIN skill_dependencies d ON d.skill_id = c.depends_on_id
  WHERE NOT d.depends_on_id = ANY(c.path)
    AND c.depth < 10
)
SELECT DISTINCT skill_id, depends_on_id, MIN(depth) AS min_depth
FROM closure
GROUP BY skill_id, depends_on_id;

CREATE UNIQUE INDEX skill_dep_closure_uk ON skill_dep_closure (skill_id, depends_on_id);
