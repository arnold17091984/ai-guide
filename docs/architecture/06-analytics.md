# Analytics Data Model

## Design Approach

Analytics data is write-heavy and append-only. It must not slow down content reads. The strategy:

1. **Raw events** land in an `analytics_events` table — insert-only, partitioned by month
2. **Aggregate tables** are updated by background jobs (Supabase Edge Functions / pg cron)
3. **Materialized views** serve dashboard queries
4. **No external analytics service** required at launch (Plausible/PostHog can be added later without schema changes)

---

## Raw Events Table (Partitioned)

```
┌─────────────────────────────────────────────────────────────────┐
│ analytics_events  (PARTITIONED BY RANGE created_at)            │
├─────────────────────────────────────────────────────────────────┤
│ PK  id              uuid    DEFAULT gen_random_uuid()           │
│     event_type      text    NOT NULL                            │
│                     -- 'page_view'|'content_view'|'search'|     │
│                     -- 'vote'|'comment'|'skill_install'|        │
│                     -- 'skill_download'|'copy_code'|'share'|    │
│                     -- 'bookmark'|'learning_path_start'|        │
│                     -- 'learning_path_complete'                 │
│ FK  user_id         uuid    → users(id)  NULL = anonymous       │
│     session_id      text    NOT NULL  -- UUID, cookie-based     │
│     content_type    text              -- target content type     │
│     content_id      uuid              -- target content id       │
│     locale          text    NOT NULL  DEFAULT 'ko'              │
│     referrer        text                                        │
│     search_query    text              -- for 'search' events    │
│     properties      jsonb   DEFAULT '{}'                        │
│                     -- flexible extra props per event type:     │
│                     -- page_view:    { path, title }            │
│                     -- skill_install:{ version, method }        │
│                     -- search:       { result_count, clicked }  │
│     ip_country      text              -- 2-letter country code  │
│     user_agent_hash text              -- hashed, not raw UA     │
│     created_at      timestamptz  DEFAULT now()  NOT NULL        │
│                                                                 │
│ IX  events_user_idx     ON (user_id, created_at DESC)           │
│ IX  events_content_idx  ON (content_type, content_id)           │
│ IX  events_type_idx     ON (event_type, created_at DESC)        │
│ IX  events_session_idx  ON session_id                           │
│                                                                 │
│ -- Monthly partitions (auto-created by pg_partman or migration) │
│ -- analytics_events_2026_03                                     │
│ -- analytics_events_2026_04  etc.                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Daily Aggregate: Page / Content Views

```
┌─────────────────────────────────────────────────────────────────┐
│ analytics_daily_content                                         │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                uuid                                      │
│     date              date    NOT NULL                          │
│     content_type      text    NOT NULL                          │
│     content_id        uuid    NOT NULL                          │
│     locale            text    NOT NULL                          │
│     views             integer  DEFAULT 0                        │
│     unique_visitors   integer  DEFAULT 0                        │
│     avg_time_secs     integer  DEFAULT 0                        │
│     votes_cast        integer  DEFAULT 0                        │
│     comments_posted   integer  DEFAULT 0                        │
│     copies            integer  DEFAULT 0  -- code copy clicks   │
│     shares            integer  DEFAULT 0                        │
│     bookmarks         integer  DEFAULT 0                        │
│     installs          integer  DEFAULT 0  -- skills only        │
│     bounce_rate       float    DEFAULT 0                        │
│                                                                 │
│ UK  (date, content_type, content_id, locale)                    │
│ IX  analytics_daily_content_date_idx  ON date DESC              │
│ IX  analytics_daily_content_type_idx  ON (content_type, date)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Contribution Analytics

```
┌─────────────────────────────────────────────────────────────────┐
│ analytics_contributions                                         │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                uuid                                      │
│ FK  user_id           uuid    → users(id)                       │
│     month             date    NOT NULL  -- first day of month   │
│     entries_created   integer  DEFAULT 0                        │
│     entries_edited    integer  DEFAULT 0                        │
│     skills_published  integer  DEFAULT 0                        │
│     case_studies      integer  DEFAULT 0                        │
│     claude_configs    integer  DEFAULT 0                        │
│     edits_accepted    integer  DEFAULT 0                        │
│     edits_rejected    integer  DEFAULT 0                        │
│     comments_posted   integer  DEFAULT 0                        │
│     votes_cast        integer  DEFAULT 0                        │
│     reputation_earned integer  DEFAULT 0                        │
│                                                                 │
│ UK  (user_id, month)                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Team Knowledge Level Tracking

```
┌─────────────────────────────────────────────────────────────────┐
│ teams                                                           │
├─────────────────────────────────────────────────────────────────┤
│ PK  id              uuid                                        │
│ UK  slug            text    NOT NULL                            │
│     name            text    NOT NULL                            │
│ FK  owner_id        uuid    → users(id)                         │
│     description     text                                        │
│     is_public       boolean  DEFAULT false                      │
│     created_at      timestamptz  DEFAULT now()                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ team_members                                                    │
├─────────────────────────────────────────────────────────────────┤
│ FK  team_id         uuid  → teams(id)  ON DELETE CASCADE        │
│ FK  user_id         uuid  → users(id)  ON DELETE CASCADE        │
│     role            text  DEFAULT 'member'                      │
│                     -- 'owner'|'admin'|'member'                 │
│     joined_at       timestamptz  DEFAULT now()                  │
│ PK  (team_id, user_id)                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ team_skill_snapshots                                            │
│ (weekly snapshot of team's collective skill coverage)           │
├─────────────────────────────────────────────────────────────────┤
│ PK  id               uuid                                       │
│ FK  team_id          uuid    → teams(id)  ON DELETE CASCADE     │
│     week_start       date    NOT NULL  -- Monday of the week    │
│     total_members    integer  NOT NULL                          │
│     skills_installed jsonb   NOT NULL                           │
│                      -- { skill_slug: { count, versions } }     │
│     coverage_score   float   DEFAULT 0                          │
│                      -- % of recommended skills covered         │
│     categories       jsonb   DEFAULT '{}'                       │
│                      -- { category_slug: member_count }         │
│                                                                 │
│ UK  (team_id, week_start)                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Skill Adoption Rates

```
┌─────────────────────────────────────────────────────────────────┐
│ analytics_skill_adoption                                        │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                uuid                                      │
│ FK  skill_id          uuid    → skills(id)                      │
│     week_start        date    NOT NULL                          │
│     new_installs      integer  DEFAULT 0                        │
│     total_installs    integer  DEFAULT 0                        │
│     active_users      integer  DEFAULT 0                        │
│                       -- users with installs who also had       │
│                       -- a content_view in same week            │
│     uninstalls        integer  DEFAULT 0                        │
│     retention_rate    float    DEFAULT 0                        │
│                       -- % still active after 4 weeks           │
│     version_breakdown jsonb    DEFAULT '{}'                     │
│                       -- { "1.0.0": 45, "1.1.0": 120 }          │
│                                                                 │
│ UK  (skill_id, week_start)                                      │
│ IX  adoption_week_idx  ON week_start DESC                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Materialized Dashboard Views

### Platform-level KPIs (refreshed hourly)

```sql
CREATE MATERIALIZED VIEW dashboard_kpis AS
SELECT
  -- Content counts
  (SELECT COUNT(*) FROM knowledge_entries WHERE status = 'published') AS published_entries,
  (SELECT COUNT(*) FROM skills          WHERE status = 'published') AS published_skills,
  (SELECT COUNT(*) FROM case_studies    WHERE status = 'published') AS published_case_studies,
  (SELECT COUNT(*) FROM claude_configs  WHERE status = 'published') AS published_configs,

  -- User activity (last 30 days)
  (SELECT COUNT(DISTINCT user_id)
   FROM analytics_events
   WHERE created_at >= now() - interval '30 days'
     AND user_id IS NOT NULL) AS mau,

  (SELECT COUNT(DISTINCT user_id)
   FROM analytics_events
   WHERE created_at >= now() - interval '1 day') AS dau,

  -- Content engagement (last 7 days)
  (SELECT SUM(views) FROM analytics_daily_content
   WHERE date >= current_date - 7) AS weekly_views,

  -- Top contributors
  (SELECT COUNT(*) FROM users WHERE reputation > 100) AS active_contributors,

  NOW() AS computed_at;

CREATE UNIQUE INDEX ON dashboard_kpis((1));  -- single-row view
```

### Search effectiveness (refreshed daily)

```sql
CREATE MATERIALIZED VIEW search_analytics AS
SELECT
  date_trunc('day', created_at)::date AS day,
  COUNT(*) AS total_searches,
  COUNT(*) FILTER (
    WHERE (properties->>'result_count')::int = 0
  ) AS zero_results,
  AVG((properties->>'result_count')::float) AS avg_results,
  COUNT(*) FILTER (
    WHERE properties->>'clicked' IS NOT NULL
  ) AS searches_with_click,
  COUNT(*) * 1.0 / NULLIF(
    COUNT(*) FILTER (WHERE properties->>'clicked' IS NOT NULL), 0
  ) AS click_through_rate
FROM analytics_events
WHERE event_type = 'search'
  AND created_at >= now() - interval '90 days'
GROUP BY 1
ORDER BY 1 DESC;
```
