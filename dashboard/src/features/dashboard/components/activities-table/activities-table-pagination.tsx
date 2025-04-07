import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import type { Table } from "@tanstack/react-table";

import { Button } from "~/components/ui/button";

interface ActivitiesTablePaginationProps<TData> {
  table: Table<TData>;
}

export function ActivitiesTablePagination<TData>({
  table,
}: ActivitiesTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between gap-x-3 border-t border-gray-200 px-6 py-3 md:pb-4 dark:border-gray-800">
      <div>
        <Button
          variant="secondary"
          size="sm"
          className="max-md:size-9 max-md:p-2"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="max-md:hidden">Previous</span>
          <ArrowLeftIcon className="md:hidden" />
        </Button>
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Page {table.getState().pagination.pageIndex + 1} of{" "}
        {table.getPageCount()}
      </p>
      <div>
        <Button
          variant="secondary"
          size="sm"
          className="max-md:size-9 max-md:p-2"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span className="max-md:hidden">Next</span>
          <ArrowRightIcon className="md:hidden" />
        </Button>
      </div>
    </div>
  );
}
