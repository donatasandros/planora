import { useNavigate, useSearch } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

import type { DateRange } from "react-day-picker";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

export function OverviewMetricsFilters() {
  const searchParams = useSearch({
    from: "/_protected/dashboard/",
  });
  const navigate = useNavigate();

  const [customRangeFrom, customRangeTo] = searchParams.metrics_cr ?? [];
  const customDateFrom = customRangeFrom
    ? new Date(customRangeFrom)
    : undefined;
  const customDateTo = customRangeTo ? new Date(customRangeTo) : undefined;

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: customDateFrom,
    to: customDateTo,
  });

  const timePresets = [
    { label: "All time", value: "all" },
    { label: "12 months", value: "12m" },
    { label: "30 days", value: "30d" },
    { label: "7 days", value: "7d" },
    { label: "24 hours", value: "24h" },
  ];

  function onTabValueChange(value: string) {
    navigate({
      from: "/dashboard",
      search: (prev) => ({
        ...prev,
        metrics_tf: value,
        metrics_cr: undefined,
      }),
    });

    setDate({
      from: undefined,
      to: undefined,
    });
  }

  return (
    <div className="mb-8 flex flex-row items-start justify-between gap-x-4">
      <Tabs
        value={searchParams.metrics_cr ? "" : searchParams.metrics_tf || "all"}
        onValueChange={onTabValueChange}
        activationMode="manual"
      >
        <TabsList>
          {timePresets.map((preset) => (
            <TabsTrigger key={`metrics-${preset.value}`} value={preset.value}>
              {preset.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="hidden md:block">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              className={cn(
                "w-fit justify-start text-left",
                !date &&
                  "text-gray-500 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-400",
              )}
            >
              <CalendarIcon className="text-gray-400 dark:text-gray-600" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Select dates</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(date) => {
                setDate(date);

                if (date && date.from && date.to) {
                  const from = format(date.from, "yyyy-MM-dd").toString();
                  const to = format(date.to, "yyyy-MM-dd").toString();

                  navigate({
                    from: "/dashboard",
                    search: (prev) => ({
                      ...prev,
                      metrics_tf: undefined,
                      metrics_cr: [from, to] as [string, string],
                    }),
                  });
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
