import { createFileRoute, useRouteContext } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { OverviewMetrics } from "~/features/dashboard/components/overview-metrics";
import { RecentActivities } from "~/features/dashboard/components/recent-activities";
import { TimeSpentChart } from "~/features/dashboard/components/time-spent-chart";
import {
  metricsQueryOptions,
  timeSpentQueryOptions,
} from "~/features/dashboard/queries/metrics";
import { overviewParamsSchema } from "~/features/dashboard/schemas";
import { getInitials } from "~/utils/get-initials";

export const Route = createFileRoute("/_protected/dashboard/")({
  validateSearch: overviewParamsSchema,
  loaderDeps: ({ search: { metrics_tf, metrics_cr, chart_tf } }) => ({
    metrics_tf,
    metrics_cr,
    chart_tf,
  }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      await context.queryClient.ensureQueryData(
        metricsQueryOptions({
          metrics_tf: deps.metrics_tf
            ? deps.metrics_tf
            : deps.metrics_cr
              ? undefined
              : "all",
          metrics_cr: deps.metrics_cr,
        }),
      ),
      await context.queryClient.ensureQueryData(
        timeSpentQueryOptions({
          chart_tf: deps.chart_tf || "12m",
        }),
      ),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useRouteContext({
    from: "/_protected",
  });

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-4 md:px-8">
      <section className="mb-5">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-x-3 md:gap-x-4">
            <Avatar className="size-14">
              <AvatarImage src={user.image as string} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                Welcome back, {user.name}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date().toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </section>
      <OverviewMetrics />
      <TimeSpentChart />
      <RecentActivities />
    </div>
  );
}
