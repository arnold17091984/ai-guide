# Knowledge Graph Design

## Overview

The knowledge graph models four types of semantic relationships between content:

1. **Prerequisite** — "you should read X before Y"
2. **Related** — "X and Y cover overlapping concepts"
3. **Builds Upon** — "Y is a direct extension of X"
4. **Contradicts** — "X and Y give conflicting advice; review both"

These relationships are stored in a single polymorphic edge table, enabling graph traversal via recursive CTEs without a separate graph database.

---

## Schema: Content Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│ content_relations                                               │
├─────────────────────────────────────────────────────────────────┤
│ PK  id              uuid                                        │
│     source_type     text  NOT NULL                              │
│                     -- 'knowledge_entry'|'skill'|'case_study'   │
│                     -- |'claude_config'                         │
│     source_id       uuid  NOT NULL                              │
│     target_type     text  NOT NULL                              │
│     target_id       uuid  NOT NULL                              │
│     relation_type   text  NOT NULL                              │
│                     -- 'prerequisite'|'related'|'builds_upon'   │
│                     -- |'contradicts'|'implements'|'mentions'   │
│     weight          float  DEFAULT 1.0                          │
│                     -- 0-1, confidence / strength of relation   │
│     is_manual       boolean  DEFAULT false                      │
│                     -- false = inferred by algorithm            │
│                     -- true  = author-curated                   │
│ FK  created_by      uuid  → users(id)                           │
│     created_at      timestamptz  DEFAULT now()                  │
│                                                                 │
│ IX  relations_source_idx  ON (source_type, source_id)           │
│ IX  relations_target_idx  ON (target_type, target_id)           │
│ IX  relations_type_idx    ON relation_type                      │
│ UK  (source_type, source_id, target_type, target_id,           │
│      relation_type)  -- no duplicate edges                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Schema: Skill Dependency Graph

The `skill_dependencies` junction table (from ERD) handles direct declared dependencies. A separate computed view materializes the full transitive closure for installer resolution.

```sql
-- Transitive dependency resolution via recursive CTE
-- Used by the install planner; refreshed on skill publish events

CREATE MATERIALIZED VIEW skill_dep_closure AS
WITH RECURSIVE closure AS (
  -- Base: direct dependencies
  SELECT
    skill_id,
    depends_on_id,
    1 AS depth,
    ARRAY[skill_id] AS path
  FROM skill_dependencies
  WHERE required = true

  UNION ALL

  -- Recursive: follow transitive deps
  SELECT
    c.skill_id,
    d.depends_on_id,
    c.depth + 1,
    c.path || d.depends_on_id
  FROM closure c
  JOIN skill_dependencies d ON d.skill_id = c.depends_on_id
  WHERE NOT d.depends_on_id = ANY(c.path)  -- cycle guard
    AND c.depth < 10                        -- depth limit
)
SELECT DISTINCT skill_id, depends_on_id, MIN(depth) AS min_depth
FROM closure
GROUP BY skill_id, depends_on_id;

CREATE UNIQUE INDEX ON skill_dep_closure(skill_id, depends_on_id);
```

---

## Schema: User Learning Paths

```
┌─────────────────────────────────────────────────────────────────┐
│ learning_paths                                                  │
├─────────────────────────────────────────────────────────────────┤
│ PK  id               uuid                                       │
│ FK  author_id        uuid    → users(id)                        │
│     title_ko         text    NOT NULL                           │
│     title_en         text                                       │
│     title_ja         text                                       │
│     description_ko   text                                       │
│     description_en   text                                       │
│     description_ja   text                                       │
│     target_role      text                                       │
│                      -- 'backend'|'frontend'|'devops'|'fullstack'│
│     difficulty_level text                                       │
│     estimated_hours  integer                                    │
│     is_official      boolean  DEFAULT false                     │
│     status           text    DEFAULT 'draft'                    │
│     created_at       timestamptz  DEFAULT now()                 │
│     updated_at       timestamptz  DEFAULT now()                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ learning_path_steps                                             │
├─────────────────────────────────────────────────────────────────┤
│ PK  id               uuid                                       │
│ FK  path_id          uuid    → learning_paths(id) ON DELETE CASCADE│
│     step_number      integer  NOT NULL                          │
│     content_type     text    NOT NULL                           │
│     content_id       uuid    NOT NULL                           │
│     is_required      boolean  DEFAULT true                      │
│     notes_ko         text                                       │
│     notes_en         text                                       │
│     notes_ja         text                                       │
│ UK  (path_id, step_number)                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ user_learning_progress                                          │
├─────────────────────────────────────────────────────────────────┤
│ PK  id               uuid                                       │
│ FK  user_id          uuid    → users(id)   ON DELETE CASCADE    │
│ FK  path_id          uuid    → learning_paths(id)               │
│ FK  step_id          uuid    → learning_path_steps(id)          │
│     status           text    DEFAULT 'not_started'              │
│                      -- 'not_started'|'in_progress'|'completed' │
│     started_at       timestamptz                                │
│     completed_at     timestamptz                                │
│     time_spent_secs  integer  DEFAULT 0                         │
│                                                                 │
│ UK  (user_id, path_id, step_id)                                 │
│ IX  progress_user_path_idx  ON (user_id, path_id)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Schema: Content Recommendation Engine

The recommendation engine combines three signals:

1. **Collaborative filtering** — "users who engaged with X also engaged with Y"
2. **Content similarity** — cosine similarity of embedding vectors (`pgvector`)
3. **Graph proximity** — shared tags, categories, and explicit `content_relations` edges

```
┌─────────────────────────────────────────────────────────────────┐
│ content_embeddings                                              │
│ (requires: CREATE EXTENSION vector in Supabase)                │
├─────────────────────────────────────────────────────────────────┤
│ PK  id              uuid                                        │
│     content_type    text  NOT NULL                              │
│     content_id      uuid  NOT NULL                              │
│     model           text  NOT NULL  -- 'text-embedding-3-small' │
│     embedding       vector(1536)    -- OpenAI embedding dim     │
│     generated_at    timestamptz  DEFAULT now()                  │
│                                                                 │
│ UK  (content_type, content_id, model)                           │
│     -- HNSW index for ANN search                                │
│     CREATE INDEX ON content_embeddings                          │
│       USING hnsw (embedding vector_cosine_ops)                  │
│       WITH (m = 16, ef_construction = 64);                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ user_content_interactions                                       │
│ (collaborative filtering input table)                           │
├─────────────────────────────────────────────────────────────────┤
│ PK  id               uuid                                       │
│ FK  user_id          uuid    → users(id)  ON DELETE CASCADE     │
│     content_type     text    NOT NULL                           │
│     content_id       uuid    NOT NULL                           │
│     interaction_type text    NOT NULL                           │
│                      -- 'view'|'vote'|'bookmark'|'share'|       │
│                      -- 'copy'|'install'|'fork'|'complete'      │
│     weight           float   NOT NULL                           │
│                      -- view=0.1, vote=0.5, bookmark=0.7,       │
│                      -- install=1.0, complete=1.0               │
│     session_id       text                                       │
│     created_at       timestamptz  DEFAULT now()                 │
│                                                                 │
│ IX  interactions_user_idx     ON (user_id, content_type)        │
│ IX  interactions_content_idx  ON (content_type, content_id)     │
│ IX  interactions_created_idx  ON created_at DESC                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ recommendation_cache                                            │
│ (pre-computed recommendations, refreshed by cron job)          │
├─────────────────────────────────────────────────────────────────┤
│ PK  id               uuid                                       │
│ FK  user_id          uuid    → users(id)  ON DELETE CASCADE     │
│                      -- NULL = anonymous/global recommendations │
│     content_type     text    NOT NULL                           │
│     content_id       uuid    NOT NULL                           │
│     score            float   NOT NULL                           │
│     reason           text                                       │
│                      -- 'similar_to_viewed'|'popular_in_role'   │
│                      -- |'next_in_path'|'trending'              │
│     computed_at      timestamptz  DEFAULT now()                 │
│     expires_at       timestamptz                                │
│                                                                 │
│ IX  reco_user_score_idx  ON (user_id, content_type, score DESC) │
│ IX  reco_expires_idx     ON expires_at                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Graph Traversal Queries

### Find all prerequisites for a knowledge entry (recursive)

```sql
WITH RECURSIVE prerequisites AS (
  -- Base: direct prerequisites
  SELECT target_id AS prereq_id, 1 AS depth
  FROM content_relations
  WHERE source_type = 'knowledge_entry'
    AND source_id = $1
    AND relation_type = 'prerequisite'

  UNION ALL

  -- Recursive: prerequisites of prerequisites
  SELECT cr.target_id, p.depth + 1
  FROM content_relations cr
  JOIN prerequisites p ON p.prereq_id = cr.source_id
  WHERE cr.relation_type = 'prerequisite'
    AND cr.source_type = 'knowledge_entry'
    AND p.depth < 5
)
SELECT DISTINCT prereq_id, MIN(depth) AS depth
FROM prerequisites
GROUP BY prereq_id
ORDER BY depth;
```

### Find related content across types (2-hop neighborhood)

```sql
-- Direct relations + second-hop via shared tags
WITH direct AS (
  SELECT target_type, target_id, relation_type, weight
  FROM content_relations
  WHERE source_type = $source_type AND source_id = $content_id
),
shared_tags AS (
  SELECT
    'knowledge_entry' AS target_type,
    ke.id AS target_id,
    'shared_tag' AS relation_type,
    COUNT(*) / 10.0 AS weight
  FROM knowledge_entry_tags et1
  JOIN knowledge_entry_tags et2 ON et1.tag_id = et2.tag_id
  JOIN knowledge_entries ke ON ke.id = et2.entry_id
  WHERE et1.entry_id = $content_id
    AND ke.id != $content_id
    AND ke.status = 'published'
  GROUP BY ke.id
)
SELECT * FROM direct
UNION ALL
SELECT * FROM shared_tags
ORDER BY weight DESC
LIMIT 20;
```
