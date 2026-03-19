CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"bio" text,
	"role" text DEFAULT 'contributor' NOT NULL,
	"locale" text DEFAULT 'ko' NOT NULL,
	"github_handle" text,
	"website_url" text,
	"reputation" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label_ko" text NOT NULL,
	"label_en" text NOT NULL,
	"label_ja" text NOT NULL,
	"icon" text,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label_ko" text NOT NULL,
	"label_en" text NOT NULL,
	"label_ja" text NOT NULL,
	"color" text,
	"category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"content_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"difficulty_level" text,
	"author_id" uuid NOT NULL,
	"category_id" uuid,
	"title_ko" text NOT NULL,
	"title_en" text,
	"title_ja" text,
	"summary_ko" text,
	"summary_en" text,
	"summary_ja" text,
	"body_ko" text,
	"body_en" text,
	"body_ja" text,
	"read_time_mins" integer,
	"featured_image" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_ko" text,
	"search_en" text,
	"search_ja" text
);
--> statement-breakpoint
CREATE TABLE "knowledge_entry_tags" (
	"entry_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "knowledge_entry_tags_entry_id_tag_id_pk" PRIMARY KEY("entry_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "skill_dependencies" (
	"skill_id" uuid NOT NULL,
	"depends_on_id" uuid NOT NULL,
	"version_range" text,
	"required" boolean DEFAULT true NOT NULL,
	CONSTRAINT "skill_dependencies_skill_id_depends_on_id_pk" PRIMARY KEY("skill_id","depends_on_id")
);
--> statement-breakpoint
CREATE TABLE "skill_security_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"version_id" uuid,
	"level" text NOT NULL,
	"rule" text NOT NULL,
	"message" text NOT NULL,
	"lines" integer[],
	"suggestion" text,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"version" text NOT NULL,
	"body" text NOT NULL,
	"content_hash" text NOT NULL,
	"changelog" text,
	"yanked" boolean DEFAULT false NOT NULL,
	"yanked_reason" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_by" uuid
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"author_id" uuid NOT NULL,
	"category_id" uuid,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"current_version" text NOT NULL,
	"license" text,
	"homepage_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"compatible_min" text,
	"compatible_max" text,
	"triggers" text[] NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"downloads" integer DEFAULT 0 NOT NULL,
	"stars" integer DEFAULT 0 NOT NULL,
	"forks" integer DEFAULT 0 NOT NULL,
	"weekly_downloads" integer[] DEFAULT '{}' NOT NULL,
	"body" text NOT NULL,
	"content_hash" text NOT NULL,
	"security_scanned_at" timestamp with time zone,
	"security_passed" boolean,
	"security_risk_score" integer,
	"search_vec" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_studies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"author_id" uuid NOT NULL,
	"category_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"title_ko" text NOT NULL,
	"title_en" text,
	"title_ja" text,
	"summary_ko" text,
	"summary_en" text,
	"summary_ja" text,
	"body_ko" text,
	"body_en" text,
	"body_ja" text,
	"team_size" integer,
	"project_duration_weeks" integer,
	"industry" text,
	"tech_stack" text[] DEFAULT '{}' NOT NULL,
	"metrics" jsonb DEFAULT '{}' NOT NULL,
	"featured_image" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"search_en" text,
	"search_ko" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_study_tags" (
	"case_study_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "case_study_tags_case_study_id_tag_id_pk" PRIMARY KEY("case_study_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "claude_config_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_id" uuid NOT NULL,
	"heading" text NOT NULL,
	"level" integer NOT NULL,
	"content" text NOT NULL,
	"line_start" integer,
	"line_end" integer,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claude_config_tags" (
	"config_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "claude_config_tags_config_id_tag_id_pk" PRIMARY KEY("config_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "claude_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"author_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"role_type" text,
	"body" text NOT NULL,
	"completeness_score" integer DEFAULT 0 NOT NULL,
	"quality_score" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"stars" integer DEFAULT 0 NOT NULL,
	"forks" integer DEFAULT 0 NOT NULL,
	"search_vec" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_type" text NOT NULL,
	"content_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid,
	"parent_id" uuid,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"body" text NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "edit_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"reviewed_by" uuid,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"field" text NOT NULL,
	"original_body" text NOT NULL,
	"suggested_body" text NOT NULL,
	"summary" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" uuid NOT NULL,
	"following_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"value" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" text NOT NULL,
	"content_id" uuid NOT NULL,
	"model" text NOT NULL,
	"embedding" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"relation_type" text NOT NULL,
	"weight" real DEFAULT 1 NOT NULL,
	"is_manual" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_path_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path_id" uuid NOT NULL,
	"step_number" integer NOT NULL,
	"content_type" text NOT NULL,
	"content_id" uuid NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"notes_ko" text,
	"notes_en" text,
	"notes_ja" text
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"title_ko" text NOT NULL,
	"title_en" text,
	"title_ja" text,
	"description_ko" text,
	"description_en" text,
	"description_ja" text,
	"target_role" text,
	"difficulty_level" text,
	"estimated_hours" integer,
	"is_official" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"content_type" text NOT NULL,
	"content_id" uuid NOT NULL,
	"score" real NOT NULL,
	"reason" text,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_content_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_type" text NOT NULL,
	"content_id" uuid NOT NULL,
	"interaction_type" text NOT NULL,
	"weight" real NOT NULL,
	"session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_learning_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"path_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"time_spent_secs" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" text NOT NULL,
	"content_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"author_id" uuid,
	"edit_suggestion_id" uuid,
	"snapshot" jsonb NOT NULL,
	"diff_patch" jsonb,
	"change_summary" text,
	"change_type" text DEFAULT 'edit' NOT NULL,
	"base_version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"month" date NOT NULL,
	"entries_created" integer DEFAULT 0 NOT NULL,
	"entries_edited" integer DEFAULT 0 NOT NULL,
	"skills_published" integer DEFAULT 0 NOT NULL,
	"case_studies" integer DEFAULT 0 NOT NULL,
	"claude_configs" integer DEFAULT 0 NOT NULL,
	"edits_accepted" integer DEFAULT 0 NOT NULL,
	"edits_rejected" integer DEFAULT 0 NOT NULL,
	"comments_posted" integer DEFAULT 0 NOT NULL,
	"votes_cast" integer DEFAULT 0 NOT NULL,
	"reputation_earned" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_daily_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"content_type" text NOT NULL,
	"content_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"unique_visitors" integer DEFAULT 0 NOT NULL,
	"avg_time_secs" integer DEFAULT 0 NOT NULL,
	"votes_cast" integer DEFAULT 0 NOT NULL,
	"comments_posted" integer DEFAULT 0 NOT NULL,
	"copies" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"bookmarks" integer DEFAULT 0 NOT NULL,
	"installs" integer DEFAULT 0 NOT NULL,
	"bounce_rate" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"user_id" uuid,
	"session_id" text NOT NULL,
	"content_type" text,
	"content_id" uuid,
	"locale" text DEFAULT 'ko' NOT NULL,
	"referrer" text,
	"search_query" text,
	"properties" jsonb DEFAULT '{}' NOT NULL,
	"ip_country" text,
	"user_agent_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_skill_adoption" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"new_installs" integer DEFAULT 0 NOT NULL,
	"total_installs" integer DEFAULT 0 NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"uninstalls" integer DEFAULT 0 NOT NULL,
	"retention_rate" real DEFAULT 0 NOT NULL,
	"version_breakdown" jsonb DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" text NOT NULL,
	"content_id" uuid NOT NULL,
	"votes_score" integer DEFAULT 0 NOT NULL,
	"views_24h" integer DEFAULT 0 NOT NULL,
	"views_7d" integer DEFAULT 0 NOT NULL,
	"views_total" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"bookmarks_count" integer DEFAULT 0 NOT NULL,
	"installs_count" integer DEFAULT 0 NOT NULL,
	"trending_score" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_skill_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"total_members" integer NOT NULL,
	"skills_installed" jsonb NOT NULL,
	"coverage_score" real DEFAULT 0 NOT NULL,
	"categories" jsonb DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trending_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"author_handle" text,
	"author_name" text,
	"raw_metrics" jsonb DEFAULT '{}' NOT NULL,
	"relevance_score" real DEFAULT 0 NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"is_curated" boolean DEFAULT false NOT NULL,
	"curated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name_key" varchar(200) NOT NULL,
	"description_key" varchar(200) NOT NULL,
	"icon_name" varchar(100) NOT NULL,
	"category" text NOT NULL,
	"tier" text NOT NULL,
	"required_value" integer DEFAULT 1 NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"unlocked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "activity_feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" uuid NOT NULL,
	"target_title" varchar(500) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"link_url" varchar(500),
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "trending_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(32) NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"author_name" varchar(255),
	"author_avatar_url" varchar(512),
	"score" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"image_url" varchar(512),
	"published_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "trending_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(32) NOT NULL,
	"display_name" varchar(64) NOT NULL,
	"icon_name" varchar(32) NOT NULL,
	"base_url" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"fetch_interval_minutes" integer DEFAULT 30 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trending_item_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_digest_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_digest" boolean DEFAULT true NOT NULL,
	"digest_frequency" text DEFAULT 'weekly' NOT NULL,
	"preferred_sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_digests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_start" timestamp with time zone NOT NULL,
	"week_end" timestamp with time zone NOT NULL,
	"top_entries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"top_skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"top_contributors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_package_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_package_stars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"author_id" uuid NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"icon_name" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"install_count" integer DEFAULT 0 NOT NULL,
	"star_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"inviter_id" uuid NOT NULL,
	"invitee_email" text NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_team_user_uk" UNIQUE("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"avatar_url" text,
	"owner_id" uuid NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"max_members" integer DEFAULT 10 NOT NULL,
	"settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debt_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debt_item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debt_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debt_item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_debt_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"reporter_id" uuid NOT NULL,
	"assignee_id" uuid,
	"related_entry_id" uuid,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"resolved_at" timestamp with time zone,
	"resolved_by_id" uuid,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"status" text DEFAULT 'registered' NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_entry_tags" ADD CONSTRAINT "knowledge_entry_tags_entry_id_knowledge_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."knowledge_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_entry_tags" ADD CONSTRAINT "knowledge_entry_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_dependencies" ADD CONSTRAINT "skill_dependencies_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_dependencies" ADD CONSTRAINT "skill_dependencies_depends_on_id_skills_id_fk" FOREIGN KEY ("depends_on_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_security_findings" ADD CONSTRAINT "skill_security_findings_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_security_findings" ADD CONSTRAINT "skill_security_findings_version_id_skill_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."skill_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_versions" ADD CONSTRAINT "skill_versions_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_versions" ADD CONSTRAINT "skill_versions_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_tags" ADD CONSTRAINT "case_study_tags_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_tags" ADD CONSTRAINT "case_study_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claude_config_sections" ADD CONSTRAINT "claude_config_sections_config_id_claude_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."claude_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claude_config_tags" ADD CONSTRAINT "claude_config_tags_config_id_claude_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."claude_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claude_config_tags" ADD CONSTRAINT "claude_config_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claude_configs" ADD CONSTRAINT "claude_configs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_suggestions" ADD CONSTRAINT "edit_suggestions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_suggestions" ADD CONSTRAINT "edit_suggestions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_relations" ADD CONSTRAINT "content_relations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_path_id_learning_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_paths"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_cache" ADD CONSTRAINT "recommendation_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_content_interactions" ADD CONSTRAINT "user_content_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_learning_progress" ADD CONSTRAINT "user_learning_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_learning_progress" ADD CONSTRAINT "user_learning_progress_path_id_learning_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_paths"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_learning_progress" ADD CONSTRAINT "user_learning_progress_step_id_learning_path_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."learning_path_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_contributions" ADD CONSTRAINT "analytics_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_skill_adoption" ADD CONSTRAINT "analytics_skill_adoption_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_skill_snapshots" ADD CONSTRAINT "team_skill_snapshots_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trending_content" ADD CONSTRAINT "trending_content_curated_by_users_id_fk" FOREIGN KEY ("curated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_feed" ADD CONSTRAINT "activity_feed_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_trending_item_id_trending_items_id_fk" FOREIGN KEY ("trending_item_id") REFERENCES "public"."trending_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_digest_preferences" ADD CONSTRAINT "user_digest_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_package_items" ADD CONSTRAINT "skill_package_items_package_id_skill_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."skill_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_package_items" ADD CONSTRAINT "skill_package_items_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_package_stars" ADD CONSTRAINT "skill_package_stars_package_id_skill_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."skill_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_package_stars" ADD CONSTRAINT "skill_package_stars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_packages" ADD CONSTRAINT "skill_packages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_comments" ADD CONSTRAINT "debt_comments_debt_item_id_knowledge_debt_items_id_fk" FOREIGN KEY ("debt_item_id") REFERENCES "public"."knowledge_debt_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_comments" ADD CONSTRAINT "debt_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_votes" ADD CONSTRAINT "debt_votes_debt_item_id_knowledge_debt_items_id_fk" FOREIGN KEY ("debt_item_id") REFERENCES "public"."knowledge_debt_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_votes" ADD CONSTRAINT "debt_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_debt_items" ADD CONSTRAINT "knowledge_debt_items_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_debt_items" ADD CONSTRAINT "knowledge_debt_items_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_debt_items" ADD CONSTRAINT "knowledge_debt_items_related_entry_id_knowledge_entries_id_fk" FOREIGN KEY ("related_entry_id") REFERENCES "public"."knowledge_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_debt_items" ADD CONSTRAINT "knowledge_debt_items_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_uk" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uk" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_uk" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_uk" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_entries_slug_uk" ON "knowledge_entries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "knowledge_entries_status_idx" ON "knowledge_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_entries_type_idx" ON "knowledge_entries" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX "knowledge_entries_author_idx" ON "knowledge_entries" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "knowledge_entries_category_idx" ON "knowledge_entries" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "knowledge_entries_published_idx" ON "knowledge_entries" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "ke_status_published_idx" ON "knowledge_entries" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "skill_deps_depends_on_idx" ON "skill_dependencies" USING btree ("depends_on_id");--> statement-breakpoint
CREATE INDEX "skill_findings_skill_idx" ON "skill_security_findings" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_findings_version_idx" ON "skill_security_findings" USING btree ("version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_versions_uk" ON "skill_versions" USING btree ("skill_id","version");--> statement-breakpoint
CREATE INDEX "skill_versions_skill_idx" ON "skill_versions" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_slug_uk" ON "skills" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "skills_author_idx" ON "skills" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "skills_status_idx" ON "skills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "skills_category_idx" ON "skills" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "skills_status_downloads_idx" ON "skills" USING btree ("status","downloads");--> statement-breakpoint
CREATE UNIQUE INDEX "case_studies_slug_uk" ON "case_studies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "case_studies_status_idx" ON "case_studies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "case_studies_author_idx" ON "case_studies" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "case_studies_category_idx" ON "case_studies" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "case_studies_published_idx" ON "case_studies" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "config_sections_config_idx" ON "claude_config_sections" USING btree ("config_id");--> statement-breakpoint
CREATE UNIQUE INDEX "claude_configs_slug_uk" ON "claude_configs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "claude_configs_author_idx" ON "claude_configs" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "claude_configs_status_idx" ON "claude_configs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "claude_configs_template_idx" ON "claude_configs" USING btree ("is_template");--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_uk" ON "bookmarks" USING btree ("user_id","content_type","content_id");--> statement-breakpoint
CREATE INDEX "bookmarks_user_idx" ON "bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comments_target_idx" ON "comments" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "comments_author_idx" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "edit_suggestions_target_idx" ON "edit_suggestions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "edit_suggestions_status_idx" ON "edit_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "edit_suggestions_author_idx" ON "edit_suggestions" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_uk" ON "follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE INDEX "follows_follower_idx" ON "follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "follows_following_idx" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_user_target_uk" ON "votes" USING btree ("user_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "votes_target_idx" ON "votes" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_embeddings_uk" ON "content_embeddings" USING btree ("content_type","content_id","model");--> statement-breakpoint
CREATE INDEX "embeddings_content_idx" ON "content_embeddings" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_relations_uk" ON "content_relations" USING btree ("source_type","source_id","target_type","target_id","relation_type");--> statement-breakpoint
CREATE INDEX "content_relations_source_idx" ON "content_relations" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "content_relations_target_idx" ON "content_relations" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "content_relations_type_idx" ON "content_relations" USING btree ("relation_type");--> statement-breakpoint
CREATE UNIQUE INDEX "path_steps_uk" ON "learning_path_steps" USING btree ("path_id","step_number");--> statement-breakpoint
CREATE INDEX "path_steps_path_idx" ON "learning_path_steps" USING btree ("path_id");--> statement-breakpoint
CREATE INDEX "learning_paths_author_idx" ON "learning_paths" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "learning_paths_role_idx" ON "learning_paths" USING btree ("target_role");--> statement-breakpoint
CREATE INDEX "learning_paths_status_idx" ON "learning_paths" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reco_user_score_idx" ON "recommendation_cache" USING btree ("user_id","content_type","score");--> statement-breakpoint
CREATE INDEX "reco_expires_idx" ON "recommendation_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "interactions_user_idx" ON "user_content_interactions" USING btree ("user_id","content_type");--> statement-breakpoint
CREATE INDEX "interactions_content_idx" ON "user_content_interactions" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "interactions_created_idx" ON "user_content_interactions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_progress_uk" ON "user_learning_progress" USING btree ("user_id","path_id","step_id");--> statement-breakpoint
CREATE INDEX "user_progress_user_path_idx" ON "user_learning_progress" USING btree ("user_id","path_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_versions_uk" ON "content_versions" USING btree ("content_type","content_id","version_number");--> statement-breakpoint
CREATE INDEX "content_versions_content_idx" ON "content_versions" USING btree ("content_type","content_id","version_number");--> statement-breakpoint
CREATE INDEX "content_versions_author_idx" ON "content_versions" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "content_versions_date_idx" ON "content_versions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_contrib_uk" ON "analytics_contributions" USING btree ("user_id","month");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_daily_uk" ON "analytics_daily_content" USING btree ("date","content_type","content_id","locale");--> statement-breakpoint
CREATE INDEX "analytics_daily_date_idx" ON "analytics_daily_content" USING btree ("date");--> statement-breakpoint
CREATE INDEX "analytics_daily_type_idx" ON "analytics_daily_content" USING btree ("content_type","date");--> statement-breakpoint
CREATE INDEX "events_user_idx" ON "analytics_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "events_content_idx" ON "analytics_events" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "events_type_idx" ON "analytics_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "events_session_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_adoption_uk" ON "analytics_skill_adoption" USING btree ("skill_id","week_start");--> statement-breakpoint
CREATE INDEX "skill_adoption_week_idx" ON "analytics_skill_adoption" USING btree ("week_start");--> statement-breakpoint
CREATE UNIQUE INDEX "content_scores_uk" ON "content_scores" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "scores_trending_idx" ON "content_scores" USING btree ("content_type","trending_score");--> statement-breakpoint
CREATE UNIQUE INDEX "team_snapshots_uk" ON "team_skill_snapshots" USING btree ("team_id","week_start");--> statement-breakpoint
CREATE UNIQUE INDEX "trending_content_source_uk" ON "trending_content" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "trending_score_idx" ON "trending_content" USING btree ("relevance_score");--> statement-breakpoint
CREATE INDEX "trending_expires_idx" ON "trending_content" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "achievements_slug_uk" ON "achievements" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "achievements_category_idx" ON "achievements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "achievements_tier_idx" ON "achievements" USING btree ("tier");--> statement-breakpoint
CREATE UNIQUE INDEX "user_achievements_uk" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE INDEX "user_achievements_user_idx" ON "user_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_achievements_achievement_idx" ON "user_achievements" USING btree ("achievement_id");--> statement-breakpoint
CREATE INDEX "activity_feed_actor_idx" ON "activity_feed" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "activity_feed_created_idx" ON "activity_feed" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_feed_action_idx" ON "activity_feed" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "activity_feed_public_idx" ON "activity_feed" USING btree ("is_public","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "trending_items_source_external_uk" ON "trending_items" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "trending_items_source_idx" ON "trending_items" USING btree ("source");--> statement-breakpoint
CREATE INDEX "trending_items_score_idx" ON "trending_items" USING btree ("score");--> statement-breakpoint
CREATE INDEX "trending_items_published_idx" ON "trending_items" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "trending_sources_name_uk" ON "trending_sources" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "user_bookmarks_uk" ON "user_bookmarks" USING btree ("user_id","trending_item_id");--> statement-breakpoint
CREATE INDEX "user_bookmarks_user_idx" ON "user_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_bookmarks_item_idx" ON "user_bookmarks" USING btree ("trending_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_digest_prefs_user_uk" ON "user_digest_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "weekly_digests_week_idx" ON "weekly_digests" USING btree ("week_start");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_package_items_uk" ON "skill_package_items" USING btree ("package_id","skill_id");--> statement-breakpoint
CREATE INDEX "skill_package_items_pkg_idx" ON "skill_package_items" USING btree ("package_id");--> statement-breakpoint
CREATE INDEX "skill_package_items_skill_idx" ON "skill_package_items" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_package_stars_uk" ON "skill_package_stars" USING btree ("package_id","user_id");--> statement-breakpoint
CREATE INDEX "skill_package_stars_pkg_idx" ON "skill_package_stars" USING btree ("package_id");--> statement-breakpoint
CREATE INDEX "skill_package_stars_user_idx" ON "skill_package_stars" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_packages_slug_uk" ON "skill_packages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "skill_packages_author_idx" ON "skill_packages" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "skill_packages_public_idx" ON "skill_packages" USING btree ("is_public");--> statement-breakpoint
CREATE UNIQUE INDEX "team_invites_token_uk" ON "team_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "team_invites_team_id_idx" ON "team_invites" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_invites_invitee_email_idx" ON "team_invites" USING btree ("invitee_email");--> statement-breakpoint
CREATE INDEX "team_members_team_id_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_members_user_id_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_slug_uk" ON "teams" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "teams_owner_id_idx" ON "teams" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "debt_comments_item_idx" ON "debt_comments" USING btree ("debt_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "debt_votes_item_user_uk" ON "debt_votes" USING btree ("debt_item_id","user_id");--> statement-breakpoint
CREATE INDEX "debt_votes_item_idx" ON "debt_votes" USING btree ("debt_item_id");--> statement-breakpoint
CREATE INDEX "debt_items_status_idx" ON "knowledge_debt_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "debt_items_category_idx" ON "knowledge_debt_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "debt_items_priority_idx" ON "knowledge_debt_items" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "debt_items_reporter_idx" ON "knowledge_debt_items" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "debt_items_assignee_idx" ON "knowledge_debt_items" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "debt_items_created_idx" ON "knowledge_debt_items" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_skills_uk" ON "user_skills" USING btree ("user_id","skill_id");--> statement-breakpoint
CREATE INDEX "user_skills_user_idx" ON "user_skills" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_skills_skill_idx" ON "user_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "user_skills_status_idx" ON "user_skills" USING btree ("user_id","status");