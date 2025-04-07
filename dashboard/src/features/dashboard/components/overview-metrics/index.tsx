import { OverviewMetricsCards } from "~/features/dashboard/components/overview-metrics/overview-metrics-cards";
import { OverviewMetricsFilters } from "~/features/dashboard/components/overview-metrics/overview-metrics-filters";

export function OverviewMetrics() {
  return (
    <section>
      <OverviewMetricsFilters />
      <OverviewMetricsCards />
    </section>
  );
}
