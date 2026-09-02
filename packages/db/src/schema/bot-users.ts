import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const botUsersTable = sqliteTable("bot_users", {
  id: text("id").primaryKey(),
  isTrackingEnabled: integer("is_tracking_enabled", { mode: "boolean" })
    .default(true)
    .notNull(),
  isProfilePrivate: integer("is_profile_private", { mode: "boolean" })
    .default(false)
    .notNull(),
  isBlacklisted: integer("is_blacklisted", { mode: "boolean" })
    .default(false)
    .notNull(),
  timezone: text("timezone").default("UTC").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date())
    .notNull(),
})
