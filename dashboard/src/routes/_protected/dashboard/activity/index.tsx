import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CloudDownloadIcon, PlusIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { ActivitiesTable } from "~/features/dashboard/components/activities-table";
import { columns } from "~/features/dashboard/components/activities-table/activities-table-columns";
import { activityQueryOptions } from "~/features/dashboard/queries/activities";

export const Route = createFileRoute("/_protected/dashboard/activity/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(activityQueryOptions);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useSuspenseQuery(activityQueryOptions);

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-4 md:px-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-0.5 md:space-y-1">
          <div className="flex items-center gap-x-2">
            <h1 className="text-xl font-semibold text-gray-900 md:text-2xl dark:text-gray-50">
              Activity log
            </h1>
            <div className="rounded-md border border-gray-300 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
              {data.length} sessions
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Review your entire session history, including time spent and
            application details.
          </p>
        </div>
        <div className="flex items-center gap-x-3">
          <Button variant="secondary">
            <CloudDownloadIcon />
            Export
          </Button>
          <Button>
            <PlusIcon />
            Add session
          </Button>
        </div>
      </section>
      <section>
        <ActivitiesTable columns={columns} data={data} />
      </section>
    </div>
  );
}
