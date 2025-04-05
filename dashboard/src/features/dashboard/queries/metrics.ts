import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  getUnixTime,
  startOfDay,
  startOfMonth,
  subDays,
  subHours,
  subMonths,
} from "date-fns";
import { and, countDistinct, eq, gte, lte, max, sql, sum } from "drizzle-orm";

import type { z } from "zod";

import { db } from "~/db";
import { activitiesTable } from "~/db/schemas";
import { getCurrentUser } from "~/features/auth/functions/get-current-user";
import { calculateDeltaDifference } from "~/features/dashboard/helpers/calculate-delta-difference";
import { overviewParamsSchema } from "~/features/dashboard/schemas";

const fetchMetricsSchema = overviewParamsSchema.pick({
  metrics_tf: true,
  metrics_cr: true,
});

function getFilterTimestamps(
  timeFilter: z.infer<typeof fetchMetricsSchema>["metrics_tf"],
  customRange?: z.infer<typeof fetchMetricsSchema>["metrics_cr"],
) {
  const now = new Date();
  const currentTimestamp = getUnixTime(now);

  if (timeFilter) {
    let currentFrom = 0;
    const currentTo = currentTimestamp;

    let comparisonFrom = 0;
    let comparisonTo = 0;

    switch (timeFilter) {
      case "all":
        currentFrom = 0;
        comparisonFrom = 0;
        comparisonTo = 0;
        break;
      case "12m":
        currentFrom = getUnixTime(subMonths(now, 12));
        comparisonFrom = getUnixTime(subMonths(now, 12 * 2));
        comparisonTo = currentFrom;
        break;
      case "30d":
        currentFrom = getUnixTime(subDays(now, 30));
        comparisonFrom = getUnixTime(subDays(now, 30 * 2));
        comparisonTo = currentFrom;
        break;
      case "7d":
        currentFrom = getUnixTime(subDays(now, 7));
        comparisonFrom = getUnixTime(subDays(now, 7 * 2));
        comparisonTo = currentFrom;
        break;
      case "24h":
        currentFrom = getUnixTime(subHours(now, 24));
        comparisonFrom = getUnixTime(subHours(now, 24 * 2));
        comparisonTo = currentFrom;
        break;
      default:
        throw new Error(`Unknown time filter: ${timeFilter}`);
    }

    return {
      currentFrom,
      currentTo,
      comparisonFrom,
      comparisonTo,
    };
  }

  if (!customRange) {
    throw new Error("Neither timeFilter nor customRange provided");
  }

  const [from, to] = customRange;
  const fromDate = subDays(new Date(from), 1);
  const toDate = addDays(new Date(to), 1);

  const currentFrom = getUnixTime(fromDate);
  const currentTo = getUnixTime(toDate);

  const daysDifference = differenceInDays(toDate, fromDate) + 1;

  const comparisonFrom = getUnixTime(subDays(fromDate, daysDifference));
  const comparisonTo = currentFrom;

  return {
    currentFrom,
    currentTo,
    comparisonFrom,
    comparisonTo,
  };
}

export const fetchMetrics = createServerFn({ method: "GET" })
  .validator(fetchMetricsSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("User not found");
    }

    const timestamps = getFilterTimestamps(data.metrics_tf, data.metrics_cr);

    async function queryMetrics(from: number, to: number) {
      const [metrics] = await db
        .select({
          totalActivities: countDistinct(activitiesTable.name),
          totalTimeSpent: sum(activitiesTable.total_time),
          longestSession: max(activitiesTable.total_time),
        })
        .from(activitiesTable)
        .where(
          and(
            eq(activitiesTable.user_id, user!.discordId ?? user!.id),
            and(
              gte(activitiesTable.start_time, from),
              lte(activitiesTable.end_time, to),
            ),
          ),
        );

      return {
        ...metrics,
        totalTimeSpent: Number(metrics.totalTimeSpent) || 0,
        longestSession: Number(metrics.longestSession) || 0,
      };
    }

    const [currentMetrics, comparisonMetrics] = await Promise.all([
      await queryMetrics(timestamps.currentFrom, timestamps.currentTo),
      await queryMetrics(timestamps.comparisonFrom, timestamps.comparisonTo),
    ]);

    return {
      ...currentMetrics,
      comparison: {
        totalActivities: calculateDeltaDifference(
          currentMetrics.totalActivities,
          comparisonMetrics.totalActivities,
        ),
        totalTimeSpent: calculateDeltaDifference(
          currentMetrics.totalTimeSpent,
          comparisonMetrics.totalTimeSpent,
        ),
        longestSession: calculateDeltaDifference(
          currentMetrics.longestSession,
          comparisonMetrics.longestSession,
        ),
      },
    };
  });

export const metricsQueryOptions = (data: z.infer<typeof fetchMetricsSchema>) =>
  queryOptions({
    queryKey: ["metrics", data.metrics_tf || data.metrics_cr],
    queryFn: () =>
      fetchMetrics({
        data,
      }),
    staleTime: 60 * 1_000,
  });

const fetchTimeSpentSchema = overviewParamsSchema.pick({
  chart_tf: true,
});

export const fetchTimeSpent = createServerFn({ method: "GET" })
  .validator(fetchTimeSpentSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("User not found");
    }

    const chartTf = data.chart_tf || "12m";

    const config = {
      "12m": {
        trunc: "month",
        range: eachMonthOfInterval({
          start: subMonths(startOfMonth(new Date()), 11),
          end: startOfMonth(new Date()),
        }),
        formatKey: (date: Date) => format(date, "yyyy-MM"),
      },
      "30d": {
        trunc: "day",
        range: eachDayOfInterval({
          start: subDays(startOfDay(new Date()), 29),
          end: startOfDay(new Date()), // today
        }),
        formatKey: (date: Date) => format(date, "yyyy-MM-dd"),
      },
      "7d": {
        trunc: "day",
        range: eachDayOfInterval({
          start: subDays(startOfDay(new Date()), 6),
          end: startOfDay(new Date()), // today
        }),
        formatKey: (date: Date) => format(date, "yyyy-MM-dd"),
      },
    } as const;

    const { trunc, range, formatKey } = config[chartTf];

    const loxas = await db
      .select({
        date: sql<Date>`DATE_TRUNC(${sql.raw(`'${trunc}'`)}, TO_TIMESTAMP(start_time))`,
        totalTimeSpent: sum(activitiesTable.total_time),
      })
      .from(activitiesTable)
      .where(eq(activitiesTable.user_id, user.discordId ?? user.id))
      .groupBy(
        sql`DATE_TRUNC(${sql.raw(`'${trunc}'`)}, TO_TIMESTAMP(start_time))`,
      )
      .orderBy(
        sql`DATE_TRUNC(${sql.raw(`'${trunc}'`)}, TO_TIMESTAMP(start_time))`,
      );

    // Index and fill gaps
    const indexed = Object.fromEntries(
      loxas.map((d) => [formatKey(new Date(d.date)), Number(d.totalTimeSpent)]),
    );

    const filled = range.map((date) => ({
      date, // raw Date object
      totalTimeSpent: indexed[formatKey(date)] ?? 0,
    }));

    return filled;
  });

export const timeSpentQueryOptions = (
  data: z.infer<typeof fetchTimeSpentSchema>,
) =>
  queryOptions({
    queryKey: ["timeSpent", data.chart_tf],
    queryFn: () => fetchTimeSpent({ data }),
    staleTime: 60 * 1_000,
  });
