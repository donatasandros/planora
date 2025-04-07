import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("md:px-6", className)}
      classNames={{
        months:
          "flex flex-col md:divide-x divide-y md:flex-row divide-gray-200 dark:divide-gray-800 md:*:first:pr-6 md:*:last:pr-0 md:space-x-6",
        month: "space-y-4.5 py-5 px-6 md:px-0",
        caption: "flex justify-center relative items-center",
        caption_label: "text-sm font-semibold text-gray-700 dark:text-gray-300",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "tertiary", size: "icon_sm" }),
          "size-8 text-gray-400 hover:bg-transparent hover:text-gray-500 dark:text-gray-600 dark:hover:bg-transparent dark:hover:text-gray-500",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-gray-700 dark:text-gray-300 flex items-center justify-center size-10 font-medium text-sm",
        row: "flex w-full mt-1 first:mt-0",
        cell: cn(
          "relative flex size-10 items-center justify-center p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gray-50 dark:[&:has([aria-selected])]:bg-gray-800 [&:has([aria-selected].day-range-end)]:rounded-r-full",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-full [&:has(>.day-range-start)]:rounded-l-full first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full"
            : "[&:has([aria-selected])]:rounded-full",
        ),
        day: cn(
          buttonVariants({ variant: "tertiary" }),
          "size-10 rounded-full p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_start: "day-range-start bg-brand-600! text-white!",
        day_range_end: "day-range-end bg-brand-600! text-white!",
        day_selected:
          "bg-transparent font-medium! hover:text-white!  hover:bg-brand-700! dark:hover:bg-brand-500!",
        day_today:
          "not-aria-selected:bg-gray-50! font-medium! dark:bg-gray-800!",
        day_outside: "day-outside text-gray-500! dark:text-gray-500!",
        day_disabled: "text-gray-500 dark:text-gray-500",
        day_range_middle: "",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn(className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn(className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
