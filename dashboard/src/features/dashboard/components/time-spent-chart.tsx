import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { secondsToHours } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import type { ChartConfig } from "~/components/ui/chart";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { timeSpentQueryOptions } from "~/features/dashboard/queries/metrics";

const chartConfig = {
  totalTimeSpent: {
    label: "Total time spent",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function TimeSpentChart() {
  const searchParams = useSearch({
    from: "/_protected/dashboard/",
  });
  const navigate = useNavigate();

  const { data } = useSuspenseQuery(
    timeSpentQueryOptions({
      chart_tf: searchParams.chart_tf || "12m",
    }),
  );

  function onTabValueChange(value: string) {
    navigate({
      from: "/dashboard",
      search: (prev) => ({
        ...prev,
        chart_tf: value,
      }),
    });
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 md:mb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Time spent
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track your session time over the past week, month, or year.
          </p>
        </div>
        <Tabs
          value={searchParams.chart_tf || "12m"}
          onValueChange={onTabValueChange}
        >
          <TabsList>
            <TabsTrigger value="12m">12 months</TabsTrigger>
            <TabsTrigger value="30d">30 days</TabsTrigger>
            <TabsTrigger value="7d">7 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <ChartContainer
        config={chartConfig}
        className="h-[240px] w-full md:h-[360px]"
      >
        <LineChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickMargin={8}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const date = new Date(value);

              const chartTf = searchParams.chart_tf || "12m";

              switch (chartTf) {
                case "12m":
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    year: "2-digit",
                  });
                case "30d":
                  return date.toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                  });
                case "7d":
                  return date.toLocaleDateString("en-US", {
                    weekday: "long",
                  });
                default:
                  return date.toLocaleDateString("en-US");
              }
            }}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                className="min-w-none"
                formatter={(value, _, item) => {
                  const date = new Date(item.payload.date);
                  const hours = secondsToHours(Number(value));

                  const chartTf = searchParams.chart_tf || "12m";

                  let dateText = "";

                  switch (chartTf) {
                    case "12m":
                      dateText = date.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      });
                      break;
                    case "30d":
                      dateText = date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      break;
                    case "7d":
                      dateText = date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        weekday: "short",
                      });
                      break;
                    default:
                      return date.toLocaleDateString("en-US");
                  }

                  return (
                    <div className="flex flex-col gap-y-0.5">
                      <p className="font-semibold text-white">
                        {hours} hour
                        {hours === 1 ? "" : "s"}
                      </p>
                      <p>{dateText}</p>
                    </div>
                  );
                }}
              />
            }
          />
          <Line
            dataKey="totalTimeSpent"
            type="linear"
            stroke="var(--color-totalTimeSpent)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </section>
  );
}
