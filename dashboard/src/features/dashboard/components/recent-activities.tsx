import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { buttonVariants } from "~/components/ui/button";
import { ActivitiesTable } from "~/features/dashboard/components/activities-table";
import { columns } from "~/features/dashboard/components/activities-table/activities-table-columns";
import { recentActivityQueryOptions } from "~/features/dashboard/queries/activities";

export function RecentActivities() {
  const { data } = useSuspenseQuery(recentActivityQueryOptions);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Recent activities
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Stay updated on your recent activity, including session duration and
            time spent.
          </p>
        </div>
        <div>
          <Link
            to="/dashboard"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            View all
          </Link>
        </div>
      </div>
      <ActivitiesTable columns={columns} data={data} disablePagination={true} />
    </section>
  );
}
