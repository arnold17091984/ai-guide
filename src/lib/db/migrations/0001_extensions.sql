-- ============================================================
-- Migration 0001: PostgreSQL Extensions
-- ============================================================
-- Run once on a fresh Supabase project. Most extensions are
-- already available; this makes them active in the public schema.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgvector: semantic similarity search on content_embeddings
CREATE EXTENSION IF NOT EXISTS "vector";

-- pg_trgm: trigram fuzzy matching for autocomplete
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- pg_cron: scheduled jobs for score refresh, cache eviction, etc.
-- Note: pg_cron is available in Supabase but must be enabled via
-- Dashboard → Extensions → pg_cron (requires project restart)
-- CREATE EXTENSION IF NOT EXISTS "pg_cron";
