CREATE TABLE "activity_sessions" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"activity_key" text NOT NULL,
	"activity_name" text NOT NULL,
	"activity_type" integer NOT NULL,
	"application_id" text,
	"is_custom" boolean DEFAULT false NOT NULL,
	"started_at" bigint NOT NULL,
	"ended_at" bigint,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_totals" (
	"user_id" text,
	"activity_key" text,
	"activity_name" text NOT NULL,
	"activity_type" integer NOT NULL,
	"application_id" text,
	"total_seconds" bigint DEFAULT 0 NOT NULL,
	"session_count" integer DEFAULT 0 NOT NULL,
	"last_played" bigint,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_totals_pkey" PRIMARY KEY("user_id","activity_key")
);
--> statement-breakpoint
CREATE TABLE "bot_users" (
	"id" text PRIMARY KEY,
	"is_tracking_enabled" boolean DEFAULT true NOT NULL,
	"is_profile_private" boolean DEFAULT false NOT NULL,
	"is_blacklisted" boolean DEFAULT false NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "activity_sessions_user_activity_name_idx" ON "activity_sessions" ("user_id","activity_name");--> statement-breakpoint
CREATE INDEX "activity_sessions_user_started_idx" ON "activity_sessions" ("user_id","started_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE ("ended_at" is not null);--> statement-breakpoint
CREATE UNIQUE INDEX "activity_sessions_open_user_activity_ux" ON "activity_sessions" ("user_id","activity_key") WHERE ("ended_at" is null);