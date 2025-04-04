import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { secondsToHours } from "date-fns";
import { ClockIcon, Gamepad2Icon, HourglassIcon } from "lucide-react";

import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { MetricComparisonBadge } from "~/features/dashboard/components/metric-comparison-badge";
import { metricsQueryOptions } from "~/features/dashboard/queries/metrics";

export function OverviewMetricsCards() {
  const searchParams = useSearch({
    from: "/_protected/dashboard/",
  });

  const { data } = useSuspenseQuery(
    metricsQueryOptions({
      metrics_tf: searchParams.metrics_tf
        ? searchParams.metrics_tf
        : searchParams.metrics_cr
          ? undefined
          : "all",
      metrics_cr: searchParams.metrics_cr,
    }),
  );

  return (
    <ScrollArea>
      <div className="flex w-full items-center gap-x-4 md:gap-x-5">
        <div className="flex min-w-[256px] flex-1 flex-col gap-5 rounded-xl border border-gray-200 bg-white p-4 shadow-xs md:p-5 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex size-12 items-center justify-center rounded-[10px] border border-gray-300 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-950">
            <Gamepad2Icon className="size-6 text-gray-700 dark:text-gray-300" />
          </div>
          <div className="w-full space-y-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Total activites
            </p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
                {data.totalActivities}
              </p>
              {(searchParams.metrics_tf && searchParams.metrics_tf !== "all") ||
              searchParams.metrics_cr ? (
                <MetricComparisonBadge
                  value={data.comparison.totalActivities}
                />
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex min-w-[256px] flex-1 flex-col gap-5 rounded-xl border border-gray-200 bg-white p-4 shadow-xs md:p-5 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex size-12 items-center justify-center rounded-[10px] border border-gray-300 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-950">
            <ClockIcon className="size-6 text-gray-700 dark:text-gray-300" />
          </div>
          <div className="w-full space-y-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Total tracked (hours)
            </p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
                {secondsToHours(data.totalTimeSpent)}
              </p>
              {(searchParams.metrics_tf && searchParams.metrics_tf !== "all") ||
              searchParams.metrics_cr ? (
                <MetricComparisonBadge value={data.comparison.totalTimeSpent} />
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex min-w-[256px] flex-1 flex-col gap-5 rounded-xl border border-gray-200 bg-white p-4 shadow-xs md:p-5 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex size-12 items-center justify-center rounded-[10px] border border-gray-300 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-950">
            <HourglassIcon className="size-6 text-gray-700 dark:text-gray-300" />
          </div>
          <div className="w-full space-y-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Longest session (hours)
            </p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
                {secondsToHours(data.longestSession)}
              </p>
              {(searchParams.metrics_tf && searchParams.metrics_tf !== "all") ||
              searchParams.metrics_cr ? (
                <MetricComparisonBadge value={data.comparison.longestSession} />
              ) : null}
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </div>
    </ScrollArea>
  );
}
