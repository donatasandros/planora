import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const activitySessionsTable = pgTable(
  "activity_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    activityKey: text("activity_key").notNull(),
    activityName: text("activity_name").notNull(),
    activityType: integer("activity_type").notNull(),
    applicationId: text("application_id"),
    isCustom: boolean("is_custom").notNull().default(false),
    startedAt: bigint("started_at", {
      mode: "number",
    }).notNull(),
    endedAt: bigint("ended_at", {
      mode: "number",
    }),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activity_sessions_user_activity_name_idx").on(
      table.userId,
      table.activityName
    ),
    index("activity_sessions_user_history_idx").on(
      table.userId,
      table.endedAt,
      table.startedAt,
      table.id
    ),
  ]
)
