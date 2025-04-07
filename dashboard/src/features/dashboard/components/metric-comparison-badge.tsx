import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/utils";

interface MetricComparisonBadgeProps extends React.HTMLProps<HTMLDivElement> {
  value: number;
}

export function MetricComparisonBadge({
  value,
  className,
  ...props
}: MetricComparisonBadgeProps) {
  return (
    <div
      className={cn(
        "flex h-6 items-center gap-x-1 rounded-md border border-gray-300 bg-white px-2 py-0.5 shadow-xs dark:border-gray-700 dark:bg-gray-950",
        className,
      )}
      {...props}
    >
      {value > 0 ? (
        <ArrowUpIcon className="text-success-600 dark:text-success-400 size-3" />
      ) : value < 0 ? (
        <ArrowDownIcon className="text-error-600 dark:text-error-400 size-3" />
      ) : (
        <ArrowRightIcon className="size-3 text-gray-600 dark:text-gray-400" />
      )}
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {Math.abs(value)}%
      </p>
    </div>
  );
}
