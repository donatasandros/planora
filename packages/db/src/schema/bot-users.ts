import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const botUsersTable = pgTable("bot_users", {
  id: text("id").primaryKey(),
  isTrackingEnabled: boolean("is_tracking_enabled").default(true).notNull(),
  isProfilePrivate: boolean("is_profile_private").default(false).notNull(),
  isBlacklisted: boolean("is_blacklisted").default(false).notNull(),
  timezone: text("timezone").default("UTC").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
})
