# Search & Discovery Architecture

## Search Stack

No external search service is required at initial scale. The full stack runs inside Supabase (PostgreSQL):

| Layer | Technology | Use Case |
|-------|-----------|---------|
| Keyword search | `tsvector` + GIN index | Full-text, multilingual |
| Semantic search | `pgvector` + HNSW index | Conceptual similarity, "more like this" |
| Faceted filtering | B-Tree indexes | Category, difficulty, language, rating |
| Trending/scoring | Materialized view | Hot content surfacing |
| Autocomplete | `pg_trgm` trigram index | Prefix + fuzzy matching on titles |

This defers the need for Elasticsearch/Typesense until content exceeds ~500k rows — far beyond initial scope.

---

## Full-Text Search Design

### Multilingual Strategy

Korean and Japanese lack word boundaries — tokenization via `'simple'` dictionary treats the whole string as a bag of characters. English uses the `'english'` dictionary for stemming (search/searching/searched all match).

| Locale | Dictionary | Notes |
|--------|-----------|-------|
| `ko` | `simple` | No stemming; character n-gram via pg_trgm for fuzzy |
| `en` | `english` | Stemming enabled |
| `ja` | `simple` | Same as Korean — no boundary tokenization |

**Generated `tsvector` columns** (defined in ERD) are updated automatically on INSERT/UPDATE via Postgres generated column mechanism — no trigger maintenance required.

### Multi-Table Unified Search

A single search query fans out across all content types, then results are merged and re-ranked by score.

```sql
-- Unified search across all content types (locale = 'en')
-- $1 = tsquery string, e.g. 'typescript & testing'
-- $2 = optional category_id filter
-- $3 = optional difficulty filter

SELECT
  'knowledge_entry'            AS content_type,
  ke.id                        AS content_id,
  ke.slug,
  ke.title_en                  AS title,
  ke.summary_en                AS summary,
  ke.difficulty_level,
  ke.published_at,
  ts_rank(ke.search_en, query) AS rank,
  ts_headline('english', ke.body_en, query,
    'MaxWords=25, MinWords=10, ShortWord=3') AS excerpt
FROM knowledge_entries ke,
     to_tsquery('english', $1) query
WHERE ke.search_en @@ query
  AND ke.status = 'published'
  AND ($2::uuid IS NULL OR ke.category_id = $2)
  AND ($3::text IS NULL OR ke.difficulty_level = $3)

UNION ALL

SELECT
  'skill'                       AS content_type,
  s.id,
  s.slug,
  s.name,
  s.description,
  NULL                          AS difficulty_level,
  s.published_at,
  ts_rank(s.search_vec, query)  AS rank,
  ts_headline('english', s.body, query,
    'MaxWords=25, MinWords=10') AS excerpt
FROM skills s,
     to_tsquery('english', $1) query
WHERE s.search_vec @@ query
  AND s.status = 'published'

UNION ALL

SELECT
  'case_study'                  AS content_type,
  cs.id,
  cs.slug,
  cs.title_en,
  cs.summary_en,
  NULL,
  cs.published_at,
  ts_rank(cs.search_en, query)  AS rank,
  ts_headline('english', cs.body_en, query,
    'MaxWords=25, MinWords=10') AS excerpt
FROM case_studies cs,
     to_tsquery('english', $1) query
WHERE cs.search_en @@ query
  AND cs.status = 'published'

ORDER BY rank DESC
LIMIT 20 OFFSET $4;
```

### Autocomplete (Trigram Fuzzy)

```sql
-- Required: CREATE EXTENSION pg_trgm;
-- Required: CREATE INDEX ON knowledge_entries USING gin (title_en gin_trgm_ops);

SELECT slug, title_en, content_type
FROM (
  SELECT slug, title_en, 'knowledge_entry' AS content_type,
         similarity(title_en, $1) AS sim
  FROM knowledge_entries
  WHERE title_en % $1  -- trigram similarity threshold (default 0.3)
    AND status = 'published'

  UNION ALL

  SELECT slug, name AS title_en, 'skill' AS content_type,
         similarity(name, $1) AS sim
  FROM skills
  WHERE name % $1 AND status = 'published'
) results
ORDER BY sim DESC
LIMIT 10;
```

---

## Faceted Search Data Model

Facets are pre-aggregated counts for filter UI (left sidebar). They are computed as a materialized view refreshed every 10 minutes.

```sql
CREATE MATERIALIZED VIEW search_facets AS
SELECT
  'category'  AS facet_type,
  c.slug      AS facet_value,
  c.label_en  AS facet_label,
  COUNT(ke.id) AS count
FROM categories c
LEFT JOIN knowledge_entries ke
  ON ke.category_id = c.id AND ke.status = 'published'
GROUP BY c.slug, c.label_en

UNION ALL

SELECT
  'difficulty'  AS facet_type,
  ke.difficulty_level,
  ke.difficulty_level,
  COUNT(*)
FROM knowledge_entries ke
WHERE ke.status = 'published'
GROUP BY ke.difficulty_level

UNION ALL

SELECT
  'content_type'  AS facet_type,
  ke.content_type,
  ke.content_type,
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

CREATE UNIQUE INDEX ON search_facets(facet_type, facet_value);
```

---

## Trending / Popular Content Scoring

### Scoring Formula

```
score = (votes_score * 4)
      + (views_24h * 0.1)
      + (views_7d * 0.02)
      + (comments_count * 2)
      + (installs_count * 5)    -- for skills
      + (bookmarks_count * 3)
      - age_penalty

age_penalty = LOG(1 + hours_since_published) * 0.5
```

This is a simplified Hacker News-style score. The `installs_count` bonus reflects that skill adoption is a stronger signal than passive viewing.

### Score Table

```
┌─────────────────────────────────────────────────────────────────┐
│ content_scores                                                  │
├─────────────────────────────────────────────────────────────────┤
│ PK  id              uuid                                        │
│     content_type    text  NOT NULL                              │
│     content_id      uuid  NOT NULL                              │
│     votes_score     integer  DEFAULT 0  -- SUM of vote.value    │
│     views_24h       integer  DEFAULT 0                          │
│     views_7d        integer  DEFAULT 0                          │
│     views_total     integer  DEFAULT 0                          │
│     comments_count  integer  DEFAULT 0                          │
│     bookmarks_count integer  DEFAULT 0                          │
│     installs_count  integer  DEFAULT 0  -- skills only          │
│     trending_score  float    DEFAULT 0  -- computed formula     │
│     updated_at      timestamptz  DEFAULT now()                  │
│                                                                 │
│ UK  (content_type, content_id)                                  │
│ IX  scores_trending_idx  ON (content_type, trending_score DESC) │
└─────────────────────────────────────────────────────────────────┘
```

Score is recomputed by a Supabase Edge Function (cron) every 15 minutes:

```sql
UPDATE content_scores cs
SET
  trending_score = (
    (cs.votes_score * 4)
    + (cs.views_24h * 0.1)
    + (cs.views_7d * 0.02)
    + (cs.comments_count * 2)
    + (cs.bookmarks_count * 3)
    - (LN(1 + EXTRACT(EPOCH FROM (now() - src.published_at)) / 3600) * 0.5)
  ),
  updated_at = now()
FROM (
  SELECT id, published_at, 'knowledge_entry' AS content_type
  FROM knowledge_entries WHERE status = 'published'
) src
WHERE cs.content_type = src.content_type
  AND cs.content_id = src.id;
```

---

## Recommendation Algorithm Data Requirements

### Three-signal blend

```
final_score(content) =
  0.4 * collaborative_score(user, content)    -- CF
  + 0.4 * semantic_score(viewed_history, content)  -- pgvector
  + 0.2 * graph_score(content_relations, content)  -- graph proximity
```

**Collaborative score** — computed offline, stored in `recommendation_cache`:
```sql
-- Users who interacted with the same content (simple item-based CF)
SELECT
  i2.content_id,
  i2.content_type,
  SUM(i1.weight * i2.weight) / COUNT(DISTINCT i2.user_id) AS cf_score
FROM user_content_interactions i1
JOIN user_content_interactions i2
  ON i1.user_id = i2.user_id
  AND i1.content_type != i2.content_id  -- different content
WHERE i1.user_id = $user_id
GROUP BY i2.content_id, i2.content_type
ORDER BY cf_score DESC
LIMIT 50;
```

**Semantic score** — pgvector ANN query:
```sql
SELECT content_id, content_type,
       1 - (embedding <=> $user_centroid) AS similarity
FROM content_embeddings
WHERE content_type = 'knowledge_entry'
ORDER BY embedding <=> $user_centroid
LIMIT 20;
-- $user_centroid = average of embeddings of recently viewed items
```

**Graph score** — from `content_relations` with `weight` column, traversed 1-hop.
