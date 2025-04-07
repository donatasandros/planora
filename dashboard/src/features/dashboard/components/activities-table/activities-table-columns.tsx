import {
  formatDistanceToNow,
  formatDuration,
  fromUnixTime,
  intervalToDuration,
} from "date-fns";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  CopyIcon,
  MoreVerticalIcon,
} from "lucide-react";

import type { ColumnDef } from "@tanstack/react-table";
import type { InferSelectModel } from "drizzle-orm";
import type { activitiesTable } from "~/db/schemas";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { getInitials } from "~/utils/get-initials";

export type Activity = InferSelectModel<typeof activitiesTable>;

export const columns: Array<ColumnDef<Activity>> = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="size-5 **:[&>svg]:size-3.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        className="size-5 **:[&>svg]:size-3.5"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    size: 44,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-x-3">
        <Avatar>
          <AvatarImage src="" />
          <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium whitespace-nowrap">{row.original.name}</p>
          <p className="font-medium whitespace-nowrap text-gray-600 dark:text-gray-400">
            Game
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "start_time",
    header: ({ column }) => {
      return (
        <button
          className="flex cursor-pointer items-center gap-1 [&>svg]:size-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Start time
          {!column.getIsSorted() && <ChevronsUpDownIcon />}
          {column.getIsSorted() === "desc" && <ArrowDownIcon />}
          {column.getIsSorted() === "asc" && <ArrowUpIcon />}
        </button>
      );
    },
    cell: ({ row }) => {
      return (
        <span className="whitespace-nowrap text-gray-600 dark:text-gray-400">
          {formatDistanceToNow(fromUnixTime(row.original.start_time), {
            addSuffix: true,
          })}
        </span>
      );
    },
    size: 220,
  },
  {
    accessorKey: "end_time",
    header: ({ column }) => {
      return (
        <button
          className="flex cursor-pointer items-center gap-1 [&>svg]:size-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          End time
          {!column.getIsSorted() && <ChevronsUpDownIcon />}
          {column.getIsSorted() === "desc" && <ArrowDownIcon />}
          {column.getIsSorted() === "asc" && <ArrowUpIcon />}
        </button>
      );
    },
    cell: ({ row }) => {
      return (
        <span className="whitespace-nowrap text-gray-600 dark:text-gray-400">
          {formatDistanceToNow(fromUnixTime(row.original.end_time), {
            addSuffix: true,
          })}
        </span>
      );
    },
    size: 220,
  },
  {
    accessorKey: "total_time",
    header: ({ column }) => {
      return (
        <button
          className="flex cursor-pointer items-center gap-1 [&>svg]:size-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total time
          {!column.getIsSorted() && <ChevronsUpDownIcon />}
          {column.getIsSorted() === "desc" && <ArrowDownIcon />}
          {column.getIsSorted() === "asc" && <ArrowUpIcon />}
        </button>
      );
    },
    cell: ({ row }) => {
      const duration = intervalToDuration({
        start: 0,
        end: row.original.total_time * 1000,
      });
      return (
        <span className="whitespace-nowrap text-gray-600 dark:text-gray-400">
          {formatDuration(duration, {
            format: ["hours", "minutes", "seconds"],
            zero: true,
          })}
        </span>
      );
    },
    size: 220,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const activity = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="cursor-pointer text-gray-400">
              <span className="sr-only">Open menu</span>
              <MoreVerticalIcon className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup className="py-1">
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(String(activity.id))
                }
              >
                <CopyIcon />
                Copy ID
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 50,
  },
];
