import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  real,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

// ============================================================
// content_relations
// ============================================================
// Knowledge graph edges. Polymorphic on both source and target.
// relation_type drives traversal semantics (prerequisites, etc.)

export const contentRelations = pgTable(
  "content_relations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    // 'knowledge_entry' | 'skill' | 'case_study' | 'claude_config'
    sourceType: text("source_type").notNull(),
    sourceId: uuid("source_id").notNull(),

    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),

    // 'prerequisite' | 'related' | 'builds_upon' | 'contradicts'
    // | 'implements' | 'mentions'
    relationType: text("relation_type").notNull(),

    // 0.0–1.0 confidence/strength. Manual edges default to 1.0.
    weight: real("weight").notNull().default(1.0),

    // false = algorithm-inferred, true = author/moderator curated
    isManual: boolean("is_manual").notNull().default(false),

    createdBy: uuid("created_by").references(() => users.id),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("content_relations_uk").on(
      t.sourceType,
      t.sourceId,
      t.targetType,
      t.targetId,
      t.relationType,
    ),
    index("content_relations_source_idx").on(t.sourceType, t.sourceId),
    index("content_relations_target_idx").on(t.targetType, t.targetId),
    index("content_relations_type_idx").on(t.relationType),
  ],
);

// ============================================================
// learning_paths
// ============================================================
// Curated sequences of content for structured skill development.

export const learningPaths = pgTable(
  "learning_paths",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),

    titleKo: text("title_ko").notNull(),
    titleEn: text("title_en"),
    titleJa: text("title_ja"),

    descriptionKo: text("description_ko"),
    descriptionEn: text("description_en"),
    descriptionJa: text("description_ja"),

    // 'backend' | 'frontend' | 'devops' | 'fullstack' | 'data' | 'mobile'
    targetRole: text("target_role"),

    // 'beginner' | 'intermediate' | 'advanced'
    difficultyLevel: text("difficulty_level"),

    estimatedHours: integer("estimated_hours"),

    // Official paths created by platform maintainers
    isOfficial: boolean("is_official").notNull().default(false),

    // 'draft' | 'published' | 'archived'
    status: text("status").notNull().default("draft"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("learning_paths_author_idx").on(t.authorId),
    index("learning_paths_role_idx").on(t.targetRole),
    index("learning_paths_status_idx").on(t.status),
  ],
);

// ============================================================
// learning_path_steps
// ============================================================

export const learningPathSteps = pgTable(
  "learning_path_steps",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    pathId: uuid("path_id")
      .notNull()
      .references(() => learningPaths.id, { onDelete: "cascade" }),

    stepNumber: integer("step_number").notNull(),

    // 'knowledge_entry' | 'skill' | 'case_study' | 'claude_config'
    contentType: text("content_type").notNull(),
    contentId: uuid("content_id").notNull(),

    isRequired: boolean("is_required").notNull().default(true),

    notesKo: text("notes_ko"),
    notesEn: text("notes_en"),
    notesJa: text("notes_ja"),
  },
  (t) => [
    uniqueIndex("path_steps_uk").on(t.pathId, t.stepNumber),
    index("path_steps_path_idx").on(t.pathId),
  ],
);

// ============================================================
// user_learning_progress
// ============================================================

export const userLearningProgress = pgTable(
  "user_learning_progress",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    pathId: uuid("path_id")
      .notNull()
      .references(() => learningPaths.id),

    stepId: uuid("step_id")
      .notNull()
      .references(() => learningPathSteps.id),

    // 'not_started' | 'in_progress' | 'completed'
    status: text("status").notNull().default("not_started"),

    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    timeSpentSecs: integer("time_spent_secs").notNull().default(0),
  },
  (t) => [
    uniqueIndex("user_progress_uk").on(t.userId, t.pathId, t.stepId),
    index("user_progress_user_path_idx").on(t.userId, t.pathId),
  ],
);

// ============================================================
// content_embeddings
// ============================================================
// Vector embeddings for semantic similarity search.
// Requires: CREATE EXTENSION vector; (pgvector)
// The `embedding` column type is declared as text here;
// the raw SQL migration changes it to vector(1536).
// The HNSW index is also applied in the raw migration.

export const contentEmbeddings = pgTable(
  "content_embeddings",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    contentType: text("content_type").notNull(),
    contentId: uuid("content_id").notNull(),

    // Model identifier e.g. 'text-embedding-3-small'
    model: text("model").notNull(),

    // Declared as text; ALTER TABLE in migration changes to vector(1536)
    embedding: text("embedding").notNull(),

    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("content_embeddings_uk").on(
      t.contentType,
      t.contentId,
      t.model,
    ),
    index("embeddings_content_idx").on(t.contentType, t.contentId),
  ],
);

// ============================================================
// user_content_interactions
// ============================================================
// Signal table for collaborative filtering and embedding centroid.

export const userContentInteractions = pgTable(
  "user_content_interactions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    contentType: text("content_type").notNull(),
    contentId: uuid("content_id").notNull(),

    // 'view' | 'vote' | 'bookmark' | 'share' | 'copy'
    // | 'install' | 'fork' | 'complete'
    interactionType: text("interaction_type").notNull(),

    // Interaction weights:
    //   view=0.1, vote=0.5, bookmark=0.7, install=1.0, complete=1.0
    weight: real("weight").notNull(),

    sessionId: text("session_id"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("interactions_user_idx").on(t.userId, t.contentType),
    index("interactions_content_idx").on(t.contentType, t.contentId),
    index("interactions_created_idx").on(t.createdAt),
  ],
);

// ============================================================
// recommendation_cache
// ============================================================
// Pre-computed recommendation scores. Refreshed by cron job.
// userId = null means anonymous / global recommendations.

export const recommendationCache = pgTable(
  "recommendation_cache",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),

    contentType: text("content_type").notNull(),
    contentId: uuid("content_id").notNull(),

    score: real("score").notNull(),

    // 'similar_to_viewed' | 'popular_in_role' | 'next_in_path' | 'trending'
    reason: text("reason"),

    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [
    index("reco_user_score_idx").on(t.userId, t.contentType, t.score),
    index("reco_expires_idx").on(t.expiresAt),
  ],
);

export type ContentRelation = typeof contentRelations.$inferSelect;
export type NewContentRelation = typeof contentRelations.$inferInsert;
export type LearningPath = typeof learningPaths.$inferSelect;
export type NewLearningPath = typeof learningPaths.$inferInsert;
export type LearningPathStep = typeof learningPathSteps.$inferSelect;
export type UserLearningProgress = typeof userLearningProgress.$inferSelect;
export type ContentEmbedding = typeof contentEmbeddings.$inferSelect;
export type UserContentInteraction = typeof userContentInteractions.$inferSelect;
