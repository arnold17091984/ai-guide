# Content Versioning Strategy

## Design Goals

1. Full audit trail — every published change is recoverable
2. Efficient storage — avoid storing full copies of large documents on minor edits
3. Rollback in O(1) — no diff reconstruction required for production reads
4. Conflict resolution — last-writer-wins with optimistic concurrency + manual merge
5. Multi-locale aware — each language field versions independently

---

## Storage Strategy: Hybrid (Full Snapshot + Computed Delta)

Pure delta storage (only store diffs) requires sequential reconstruction, which is slow for deep history and complex for multi-field documents. Pure full-snapshot storage wastes space on large markdown bodies with minor edits.

**Decision: Store full snapshots in the version history table, but compute and cache unified diffs on write for display purposes.**

Rationale:
- Markdown bodies are typically 1–20 KB. At 100 versions each, that is 1–2 MB per entry — well within Postgres storage budget.
- Full snapshots enable O(1) rollback (single row fetch, no diff application).
- Computed diffs (`diff_patch` column) are optional display data, derived from the previous snapshot at write time.
- Postgres `text` compression (TOAST) automatically compresses repeated content.

---

## Schema: Content Version History

```
┌─────────────────────────────────────────────────────────────────┐
│ content_versions                                                │
├─────────────────────────────────────────────────────────────────┤
│ PK  id              uuid                                        │
│     content_type    text    NOT NULL                            │
│                     -- 'knowledge_entry'|'skill'|'case_study'   │
│                     -- |'claude_config'                         │
│     content_id      uuid    NOT NULL                            │
│     version_number  integer  NOT NULL                           │
│                     -- monotonically incrementing per content   │
│ FK  author_id       uuid    → users(id)                         │
│ FK  edit_suggestion_id uuid → edit_suggestions(id)              │
│                     -- NULL if direct edit by author/moderator  │
│                                                                 │
│     -- Snapshot of all mutable localized fields                 │
│     snapshot        jsonb   NOT NULL                            │
│     -- Example for knowledge_entry:                             │
│     -- {                                                        │
│     --   "title_ko": "...", "title_en": "...",                  │
│     --   "body_ko": "...",  "body_en": "...",                   │
│     --   "summary_ko": "...", "category_id": "uuid"             │
│     -- }                                                        │
│                                                                 │
│     -- Unified diff vs previous version (display only)          │
│     diff_patch      text                                        │
│                     -- GNU unified diff format, per-field       │
│                     -- NULL for version_number = 1              │
│                                                                 │
│     change_summary  text                                        │
│                     -- one-line human-readable description      │
│     change_type     text    DEFAULT 'edit'                      │
│                     -- 'create'|'edit'|'revert'|'accept_suggestion'│
│                     -- |'locale_add'|'metadata_update'          │
│                                                                 │
│     -- Optimistic concurrency token                             │
│     base_version    integer                                     │
│                     -- version_number this edit was based on    │
│                     -- used to detect concurrent edit conflicts  │
│                                                                 │
│     created_at      timestamptz  DEFAULT now()                  │
│                                                                 │
│ UK  (content_type, content_id, version_number)                  │
│ IX  versions_content_idx  ON (content_type, content_id,         │
│                                version_number DESC)             │
│ IX  versions_author_idx   ON author_id                          │
│ IX  versions_date_idx     ON created_at DESC                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Versioning Workflow

### Write Path (New Edit)

```
1. Client fetches current content + current_version_number
2. Client edits locally
3. POST /api/content/:id with:
   - payload (changed fields)
   - base_version (optimistic lock token)

4. Server checks: SELECT version_number FROM content_versions
   WHERE content_type = X AND content_id = Y
   ORDER BY version_number DESC LIMIT 1

5a. IF current_version = base_version (no conflict):
    - Compute unified diff vs snapshot[current_version]
    - INSERT INTO content_versions (snapshot, diff_patch, version_number = current+1)
    - UPDATE knowledge_entries SET field = new_value, updated_at = now()
    - COMMIT

5b. IF current_version > base_version (conflict detected):
    - Return 409 Conflict with current snapshot + diff
    - Client performs manual merge or force-overwrite
```

### Rollback

```sql
-- Restore content to a specific version
-- Step 1: fetch target snapshot
SELECT snapshot
FROM content_versions
WHERE content_type = 'knowledge_entry'
  AND content_id = $content_id
  AND version_number = $target_version;

-- Step 2: apply fields from snapshot back to live table
UPDATE knowledge_entries
SET
  title_ko   = snapshot->>'title_ko',
  title_en   = snapshot->>'title_en',
  body_ko    = snapshot->>'body_ko',
  body_en    = snapshot->>'body_en',
  updated_at = now()
WHERE id = $content_id;

-- Step 3: create a new version record with change_type = 'revert'
INSERT INTO content_versions (
  content_type, content_id, version_number, author_id,
  snapshot, change_type, change_summary
)
VALUES (
  'knowledge_entry', $content_id, $next_version, $user_id,
  $snapshot_from_step1, 'revert',
  'Reverted to version ' || $target_version
);
```

---

## Conflict Resolution

Two contributors edit the same entry simultaneously.

**Detection**: `base_version` mismatch on save.

**Resolution options exposed to the client**:

| Option | Behavior |
|--------|----------|
| `force` | Overwrite with new content, increment version |
| `merge` | Server returns both versions as a 3-way diff; client merges manually |
| `abandon` | Discard local changes, reload current version |

**Merge diff format** (returned in 409 response):

```json
{
  "conflict": true,
  "base_version": 5,
  "current_version": 6,
  "fields": {
    "body_en": {
      "base": "...original text...",
      "current": "...concurrent edit...",
      "yours": "...your edit..."
    }
  }
}
```

The client renders a side-by-side diff editor (e.g., `@monaco-editor/react` with `diffEditor` mode).

---

## Version Retention Policy

| Age | Action |
|-----|--------|
| < 30 days | Keep all versions |
| 30–365 days | Keep every 5th version (thin out minor edits) |
| > 365 days | Keep: version 1, any `revert` versions, last 10 versions |

Thinning is a background job — it never deletes the current version or any `revert` checkpoint.

```sql
-- Identify versions eligible for thinning
DELETE FROM content_versions
WHERE created_at BETWEEN now() - interval '365 days'
                     AND now() - interval '30 days'
  AND change_type = 'edit'
  AND version_number % 5 != 0  -- keep every 5th
  AND version_number != (
    SELECT MAX(version_number) FROM content_versions cv2
    WHERE cv2.content_type = content_versions.content_type
      AND cv2.content_id = content_versions.content_id
  );
```
