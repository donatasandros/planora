import { paginateCursor } from "@/shared/pagination/cursor-paginator"
import { paginateStatic } from "@/shared/pagination/static-paginator"
import type { PaginateParams } from "@/shared/pagination/types"

export type { PaginationCursor } from "@/shared/pagination/types"

export default async function paginate<T>(params: PaginateParams<T>) {
	if (params.mode === "cursor") {
		return paginateCursor(params)
	}

	return paginateStatic(params)
}
