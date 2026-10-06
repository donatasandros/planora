import {
	bigint,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core"

export const activityTotalsTable = pgTable(
	"activity_totals",
	{
		userId: text("user_id").notNull(),
		activityKey: text("activity_key").notNull(),
		activityName: text("activity_name").notNull(),
		activityType: integer("activity_type").notNull(),
		applicationId: text("application_id"),
		totalSeconds: bigint("total_seconds", { mode: "number" })
			.notNull()
			.default(0),
		sessionCount: integer("session_count").notNull().default(0),
		lastPlayed: bigint("last_played", {
			mode: "number",
		}),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "date",
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [
		primaryKey({
			name: "activity_totals_pkey",
			columns: [table.userId, table.activityKey],
		}),
	]
)
