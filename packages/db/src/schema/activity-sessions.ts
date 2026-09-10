import { sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const activitySessionsTable = sqliteTable(
  "activity_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    activityKey: text("activity_key").notNull(),
    activityName: text("activity_name").notNull(),
    activityType: integer("activity_type").notNull(),
    applicationId: text("application_id"),
    isCustom: integer("is_custom", { mode: "boolean" })
      .notNull()
      .default(false),
    startedAt: integer("started_at", { mode: "number" }).notNull(),
    endedAt: integer("ended_at", { mode: "number" }),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("activity_sessions_user_activity_name_idx").on(
      table.userId,
      table.activityName
    ),
  ]
)
