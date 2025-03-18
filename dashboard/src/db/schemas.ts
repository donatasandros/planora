import { bigint, integer, pgTable, text } from "drizzle-orm/pg-core";

export const activitiesTable = pgTable("activities", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: text().notNull(),
  name: text().notNull(),
  start_time: bigint({ mode: "number" }).notNull(),
  end_time: bigint({ mode: "number" }).notNull(),
  total_time: bigint({ mode: "number" }).notNull().default(0),
});

export const usersTable = pgTable("users", {
  id: text().primaryKey(),
  username: text().notNull(),
  avatar: text().notNull(),
});
