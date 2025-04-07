import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";

import { db } from "~/db";
import { activitiesTable } from "~/db/schemas";
import { getCurrentUser } from "~/features/auth/functions/get-current-user";

export const fetchRecentActivity = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("User not found");
    }

    const recentActivity = await db
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.user_id, user.discordId ?? user.id))
      .orderBy(desc(activitiesTable.end_time))
      .limit(10);

    return recentActivity;
  },
);

export const recentActivityQueryOptions = queryOptions({
  queryKey: ["recent-activity"],
  queryFn: fetchRecentActivity,
  staleTime: 60 * 1_000,
});
