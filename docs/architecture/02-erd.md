# Entity Relationship Diagram (Text-Based)

## Notation Key

```
[Entity]          — table
PK id             — primary key
FK xxx_id         — foreign key
UK xxx            — unique key / unique constraint
IX xxx            — index
GIN xxx           — GIN index (for jsonb / tsvector)
→                 — references (many-to-one unless labeled)
↔                 — many-to-many (via junction table)
```

---

## Core Entities

```
┌─────────────────────────────────────────────────────────────────┐
│ users                                                           │
├─────────────────────────────────────────────────────────────────┤
│ PK  id              uuid         DEFAULT gen_random_uuid()      │
│ UK  username        text         NOT NULL                       │
│ UK  email           text         NOT NULL                       │
│     display_name    text                                        │
│     avatar_url      text                                        │
│     bio             text                                        │
│     role            text         DEFAULT 'contributor'          │
│                     -- 'admin' | 'moderator' | 'contributor'    │
│                     -- | 'viewer'                               │
│     locale          text         DEFAULT 'ko'                   │
│                     -- 'ko' | 'en' | 'ja'                       │
│     github_handle   text                                        │
│     website_url     text                                        │
│     reputation      integer      DEFAULT 0                      │
│     is_verified     boolean      DEFAULT false                  │
│     created_at      timestamptz  DEFAULT now()                  │
│     updated_at      timestamptz  DEFAULT now()                  │
│                                                                 │
│ IX  users_username_idx  ON username                             │
│ IX  users_role_idx      ON role                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ tags                                                            │
├─────────────────────────────────────────────────────────────────┤
│ PK  id          uuid  DEFAULT gen_random_uuid()                 │
│ UK  slug        text  NOT NULL  -- 'typescript', 'testing'      │
│     label_ko    text  NOT NULL  -- localized display labels     │
│     label_en    text  NOT NULL                                  │
│     label_ja    text  NOT NULL                                  │
│     color       text            -- Tailwind color class         │
│     category    text            -- 'language'|'tool'|'concept'  │
│     created_at  timestamptz  DEFAULT now()                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ categories                                                      │
├─────────────────────────────────────────────────────────────────┤
│ PK  id          uuid                                            │
│ UK  slug        text  NOT NULL                                  │
│     label_ko    text  NOT NULL                                  │
│     label_en    text  NOT NULL                                  │
│     label_ja    text  NOT NULL                                  │
│ FK  parent_id   uuid  → categories(id)  -- allows nesting       │
│     icon        text  -- Lucide icon name                       │
│     sort_order  integer  DEFAULT 0                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Knowledge Entries

```
┌─────────────────────────────────────────────────────────────────┐
│ knowledge_entries                                               │
├─────────────────────────────────────────────────────────────────┤
│ PK  id               uuid    DEFAULT gen_random_uuid()          │
│ UK  slug             text    NOT NULL                           │
│     content_type     text    NOT NULL                           │
│                      -- 'article'|'tip'|'workflow'|'tutorial'   │
│     status           text    DEFAULT 'draft'                    │
│                      -- 'draft'|'pending'|'published'|'archived'│
│     difficulty_level text                                       │
│                      -- 'beginner'|'intermediate'|'advanced'    │
│ FK  author_id        uuid    → users(id)                        │
│ FK  category_id      uuid    → categories(id)                   │
│                                                                 │
│     -- Localized content stored as jsonb for flexibility        │
│     title_ko         text    NOT NULL                           │
│     title_en         text                                       │
│     title_ja         text                                       │
│     summary_ko       text                                       │
│     summary_en       text                                       │
│     summary_ja       text                                       │
│                                                                 │
│     -- Latest body stored directly; history in versions table   │
│     body_ko          text                                       │
│     body_en          text                                       │
│     body_ja          text                                       │
│                                                                 │
│     -- Metadata                                                 │
│     read_time_mins   integer                                    │
│     featured_image   text                                       │
│     is_featured      boolean  DEFAULT false                     │
│     is_pinned        boolean  DEFAULT false                     │
│     published_at     timestamptz                                │
│     created_at       timestamptz  DEFAULT now()                 │
│     updated_at       timestamptz  DEFAULT now()                 │
│                                                                 │
│     -- Full-text search vectors (generated columns)             │
│     search_ko        tsvector  GENERATED ALWAYS AS (            │
│                        to_tsvector('simple',                    │
│                          coalesce(title_ko,'') || ' ' ||        │
│                          coalesce(summary_ko,'') || ' ' ||      │
│                          coalesce(body_ko,''))                  │
│                        ) STORED                                 │
│     search_en        tsvector  GENERATED ALWAYS AS (            │
│                        to_tsvector('english',                   │
│                          coalesce(title_en,'') || ' ' ||        │
│                          coalesce(summary_en,'') || ' ' ||      │
│                          coalesce(body_en,''))                  │
│                        ) STORED                                 │
│     search_ja        tsvector  GENERATED ALWAYS AS (            │
│                        to_tsvector('simple',                    │
│                          coalesce(title_ja,'') || ' ' ||        │
│                          coalesce(summary_ja,'') || ' ' ||      │
│                          coalesce(body_ja,''))                  │
│                        ) STORED                                 │
│                                                                 │
│ GIN knowledge_entries_search_ko_idx  ON search_ko               │
│ GIN knowledge_entries_search_en_idx  ON search_en               │
│ GIN knowledge_entries_search_ja_idx  ON search_ja               │
│ IX  knowledge_entries_status_idx     ON status                  │
│ IX  knowledge_entries_type_idx       ON content_type            │
│ IX  knowledge_entries_author_idx     ON author_id               │
│ IX  knowledge_entries_category_idx   ON category_id             │
│ IX  knowledge_entries_published_idx  ON published_at DESC       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ knowledge_entry_tags  (junction)                                │
├─────────────────────────────────────────────────────────────────┤
│ FK  entry_id  uuid  → knowledge_entries(id)  ON DELETE CASCADE  │
│ FK  tag_id    uuid  → tags(id)               ON DELETE CASCADE  │
│ PK  (entry_id, tag_id)                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Skills

```
┌─────────────────────────────────────────────────────────────────┐
│ skills                                                          │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                uuid    DEFAULT gen_random_uuid()         │
│ UK  slug              text    NOT NULL  -- 'typescript-guard'   │
│ FK  author_id         uuid    → users(id)                       │
│ FK  category_id       uuid    → categories(id)                  │
│     name              text    NOT NULL                          │
│     description       text    NOT NULL                          │
│     current_version   text    NOT NULL  -- semver '1.2.3'       │
│     license           text              -- SPDX 'MIT'           │
│     homepage          text                                      │
│     status            text    DEFAULT 'draft'                   │
│                       -- 'draft'|'published'|'deprecated'|      │
│                       -- 'yanked'                               │
│     compatible_min    text              -- ClaudeCodeVersion    │
│     compatible_max    text                                      │
│     triggers          text[]  NOT NULL  -- array of patterns    │
│     tags              text[]  DEFAULT '{}'                      │
│                                                                 │
│     -- Aggregated metrics (updated by background job)           │
│     downloads         integer  DEFAULT 0                        │
│     stars             integer  DEFAULT 0                        │
│     forks             integer  DEFAULT 0                        │
│     weekly_downloads  integer[]  DEFAULT '{}'                   │
│                       -- ring buffer, last 12 weeks             │
│                                                                 │
│     -- Security scan result (denormalized for fast queries)     │
│     security_scanned_at  timestamptz                            │
│     security_passed      boolean                                │
│     security_risk_score  integer                                │
│                                                                 │
│     -- Full body of latest version                              │
│     body              text    NOT NULL                          │
│     content_hash      text    NOT NULL  -- SHA-256              │
│                                                                 │
│     -- Search                                                   │
│     search_vec        tsvector  GENERATED ALWAYS AS (           │
│                         to_tsvector('english',                  │
│                           name || ' ' || description ||         │
│                           ' ' || array_to_string(tags,' '))     │
│                         ) STORED                                │
│                                                                 │
│     published_at      timestamptz                               │
│     created_at        timestamptz  DEFAULT now()                │
│     updated_at        timestamptz  DEFAULT now()                │
│                                                                 │
│ GIN skills_search_idx   ON search_vec                           │
│ GIN skills_triggers_idx ON triggers  USING gin                  │
│ GIN skills_tags_idx     ON tags      USING gin                  │
│ IX  skills_author_idx   ON author_id                            │
│ IX  skills_status_idx   ON status                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ skill_versions                                                  │
├─────────────────────────────────────────────────────────────────┤
│ PK  id           uuid                                           │
│ FK  skill_id     uuid    → skills(id)  ON DELETE CASCADE        │
│     version      text    NOT NULL  -- semver                    │
│     body         text    NOT NULL  -- full markdown at version  │
│     content_hash text    NOT NULL                               │
│     changelog    text                                           │
│     yanked       boolean  DEFAULT false                         │
│     yanked_reason text                                          │
│     published_at timestamptz  DEFAULT now()                     │
│     published_by uuid    → users(id)                            │
│ UK  (skill_id, version)                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ skill_dependencies  (junction)                                  │
├─────────────────────────────────────────────────────────────────┤
│ FK  skill_id      uuid  → skills(id)  ON DELETE CASCADE         │
│ FK  depends_on_id uuid  → skills(id)  ON DELETE RESTRICT        │
│     version_range text  -- semver range '^1.0.0'                │
│     required      boolean  DEFAULT true                         │
│ PK  (skill_id, depends_on_id)                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ skill_security_findings                                         │
├─────────────────────────────────────────────────────────────────┤
│ PK  id           uuid                                           │
│ FK  skill_id     uuid    → skills(id)  ON DELETE CASCADE        │
│ FK  version_id   uuid    → skill_versions(id)  ON DELETE CASCADE│
│     level        text    -- 'critical'|'high'|'medium'|'low'    │
│     rule         text    NOT NULL                               │
│     message      text    NOT NULL                               │
│     lines        integer[]                                      │
│     suggestion   text                                           │
│     scanned_at   timestamptz  DEFAULT now()                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## CLAUDE.md Configurations

```
┌─────────────────────────────────────────────────────────────────┐
│ claude_configs                                                  │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                uuid                                      │
│ UK  slug              text    NOT NULL                          │
│ FK  author_id         uuid    → users(id)                       │
│     title             text    NOT NULL                          │
│     description       text                                      │
│     role_type         text                                      │
│                       -- 'backend'|'frontend'|'devops'|         │
│                       -- 'fullstack'|'data'|'mobile'|'other'    │
│     body              text    NOT NULL  -- full CLAUDE.md text  │
│     completeness_score integer  DEFAULT 0  -- 0-100             │
│     quality_score     integer  DEFAULT 0   -- 0-100             │
│     status            text    DEFAULT 'draft'                   │
│     is_template       boolean  DEFAULT false                    │
│     stars             integer  DEFAULT 0                        │
│     forks             integer  DEFAULT 0                        │
│                                                                 │
│     search_vec        tsvector  GENERATED ALWAYS AS (           │
│                         to_tsvector('english',                  │
│                           title || ' ' || coalesce(description,'')│
│                           || ' ' || body)                       │
│                         ) STORED                                │
│                                                                 │
│     published_at      timestamptz                               │
│     created_at        timestamptz  DEFAULT now()                │
│     updated_at        timestamptz  DEFAULT now()                │
│                                                                 │
│ GIN claude_configs_search_idx  ON search_vec                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ claude_config_sections  (parsed sections for analysis)          │
├─────────────────────────────────────────────────────────────────┤
│ PK  id           uuid                                           │
│ FK  config_id    uuid    → claude_configs(id)  ON DELETE CASCADE│
│     heading      text    NOT NULL                               │
│     level        integer  NOT NULL  -- h1=1, h2=2, etc.         │
│     content      text    NOT NULL                               │
│     line_start   integer                                        │
│     line_end     integer                                        │
│     sort_order   integer                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ claude_config_tags  (junction)                                  │
├─────────────────────────────────────────────────────────────────┤
│ FK  config_id  uuid  → claude_configs(id)  ON DELETE CASCADE    │
│ FK  tag_id     uuid  → tags(id)            ON DELETE CASCADE    │
│ PK  (config_id, tag_id)                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Case Studies

```
┌─────────────────────────────────────────────────────────────────┐
│ case_studies                                                    │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                uuid                                      │
│ UK  slug              text    NOT NULL                          │
│ FK  author_id         uuid    → users(id)                       │
│ FK  category_id       uuid    → categories(id)                  │
│     status            text    DEFAULT 'draft'                   │
│                       -- 'draft'|'pending_review'|'published'|  │
│                       -- 'archived'                             │
│                                                                 │
│     -- Localized fields                                         │
│     title_ko          text    NOT NULL                          │
│     title_en          text                                      │
│     title_ja          text                                      │
│     summary_ko        text                                      │
│     summary_en        text                                      │
│     summary_ja        text                                      │
│     body_ko           text                                      │
│     body_en           text                                      │
│     body_ja           text                                      │
│                                                                 │
│     -- Structured metrics (queryable)                           │
│     team_size         integer                                   │
│     project_duration_weeks  integer                             │
│     industry          text                                      │
│     tech_stack        text[]  DEFAULT '{}'                      │
│                                                                 │
│     -- Outcome metrics (stored as jsonb for flexibility)        │
│     metrics           jsonb   DEFAULT '{}'                      │
│     -- Example:                                                 │
│     -- { "velocity_increase": 40,                               │
│     --   "bugs_reduced_pct": 30,                                │
│     --   "time_saved_hrs_week": 8,                              │
│     --   "cost_savings_usd": 12000 }                            │
│                                                                 │
│     featured_image    text                                      │
│     is_featured       boolean  DEFAULT false                    │
│                                                                 │
│     search_en         tsvector  GENERATED ALWAYS AS (           │
│                         to_tsvector('english',                  │
│                           coalesce(title_en,'') || ' ' ||       │
│                           coalesce(summary_en,'') || ' ' ||     │
│                           coalesce(body_en,''))                 │
│                         ) STORED                                │
│     search_ko         tsvector  GENERATED ALWAYS AS (           │
│                         to_tsvector('simple',                   │
│                           coalesce(title_ko,'') || ' ' ||       │
│                           coalesce(summary_ko,'') || ' ' ||     │
│                           coalesce(body_ko,''))                 │
│                         ) STORED                                │
│                                                                 │
│     published_at      timestamptz                               │
│     created_at        timestamptz  DEFAULT now()                │
│     updated_at        timestamptz  DEFAULT now()                │
│                                                                 │
│ GIN case_studies_search_en_idx  ON search_en                    │
│ GIN case_studies_search_ko_idx  ON search_ko                    │
│ GIN case_studies_metrics_idx    ON metrics                      │
│ GIN case_studies_stack_idx      ON tech_stack  USING gin        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ case_study_tags  (junction)                                     │
├─────────────────────────────────────────────────────────────────┤
│ FK  case_study_id  uuid  → case_studies(id)  ON DELETE CASCADE  │
│ FK  tag_id         uuid  → tags(id)          ON DELETE CASCADE  │
│ PK  (case_study_id, tag_id)                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Trending Content

```
┌─────────────────────────────────────────────────────────────────┐
│ trending_content                                                │
├─────────────────────────────────────────────────────────────────┤
│ PK  id               uuid                                       │
│     source           text    NOT NULL  -- 'x_api'|'github'|     │
│                               -- 'hacker_news'|'reddit'         │
│     external_id      text    NOT NULL  -- source-specific ID    │
│     url              text    NOT NULL                           │
│     title            text    NOT NULL                           │
│     summary          text                                       │
│     author_handle    text                                       │
│     author_name      text                                       │
│     raw_metrics      jsonb   DEFAULT '{}'                       │
│                      -- { likes, retweets, views, score }       │
│     relevance_score  float   DEFAULT 0                          │
│     fetched_at       timestamptz  DEFAULT now()                 │
│     published_at     timestamptz                                │
│     expires_at       timestamptz                                │
│                      -- TTL for cache eviction                  │
│     is_curated       boolean  DEFAULT false                     │
│                      -- manually promoted by moderator          │
│ FK  curated_by       uuid    → users(id)                        │
│                                                                 │
│ UK  (source, external_id)  -- prevent duplicates on re-fetch    │
│ IX  trending_score_idx     ON relevance_score DESC              │
│ IX  trending_expires_idx   ON expires_at                        │
│ GIN trending_metrics_idx   ON raw_metrics                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ trending_content_tags  (junction)                               │
├─────────────────────────────────────────────────────────────────┤
│ FK  content_id  uuid  → trending_content(id)  ON DELETE CASCADE │
│ FK  tag_id      uuid  → tags(id)              ON DELETE CASCADE │
│ PK  (content_id, tag_id)                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Social / Engagement

```
┌─────────────────────────────────────────────────────────────────┐
│ votes                                                           │
├─────────────────────────────────────────────────────────────────┤
│ PK  id             uuid                                         │
│ FK  user_id        uuid    → users(id)  ON DELETE CASCADE       │
│     target_type    text    NOT NULL                             │
│                    -- 'knowledge_entry'|'skill'|'case_study'|   │
│                    -- 'claude_config'|'comment'                 │
│     target_id      uuid    NOT NULL                             │
│     value          smallint  NOT NULL  -- +1 or -1              │
│     created_at     timestamptz  DEFAULT now()                   │
│                                                                 │
│ UK  (user_id, target_type, target_id)  -- one vote per item     │
│ IX  votes_target_idx  ON (target_type, target_id)               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ comments                                                        │
├─────────────────────────────────────────────────────────────────┤
│ PK  id             uuid                                         │
│ FK  author_id      uuid    → users(id)  ON DELETE SET NULL      │
│ FK  parent_id      uuid    → comments(id)  -- threading         │
│     target_type    text    NOT NULL                             │
│     target_id      uuid    NOT NULL                             │
│     body           text    NOT NULL                             │
│     is_deleted     boolean  DEFAULT false  -- soft delete       │
│     created_at     timestamptz  DEFAULT now()                   │
│     updated_at     timestamptz  DEFAULT now()                   │
│                                                                 │
│ IX  comments_target_idx  ON (target_type, target_id)            │
│ IX  comments_author_idx  ON author_id                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ edit_suggestions                                                │
├─────────────────────────────────────────────────────────────────┤
│ PK  id              uuid                                        │
│ FK  author_id       uuid    → users(id)                         │
│ FK  reviewed_by     uuid    → users(id)                         │
│     target_type     text    NOT NULL                            │
│     target_id       uuid    NOT NULL                            │
│     field           text    NOT NULL  -- 'body_ko', 'title_en'  │
│     original_body   text    NOT NULL  -- snapshot at suggestion  │
│     suggested_body  text    NOT NULL                            │
│     summary         text              -- one-line description   │
│     status          text    DEFAULT 'pending'                   │
│                     -- 'pending'|'accepted'|'rejected'|         │
│                     -- 'superseded'                             │
│     rejection_reason text                                       │
│     created_at      timestamptz  DEFAULT now()                  │
│     reviewed_at     timestamptz                                 │
│                                                                 │
│ IX  edit_suggestions_target_idx  ON (target_type, target_id)    │
│ IX  edit_suggestions_status_idx  ON status                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Relationship Summary

```
users ──< knowledge_entries (author)
users ──< skills (author)
users ──< case_studies (author)
users ──< claude_configs (author)
users ──< votes
users ──< comments
users ──< edit_suggestions (author, reviewer)

knowledge_entries >──< tags  (via knowledge_entry_tags)
skills            >──< tags  (via skills.tags array + separate junction possible)
case_studies      >──< tags  (via case_study_tags)
claude_configs    >──< tags  (via claude_config_tags)
trending_content  >──< tags  (via trending_content_tags)

skills >──< skills  (via skill_dependencies — self-referential many-to-many)
skills ──< skill_versions
skills ──< skill_security_findings

knowledge_entries ──< categories
case_studies      ──< categories
categories ──< categories (parent_id — hierarchical)

comments ──< comments (parent_id — threaded)
```
