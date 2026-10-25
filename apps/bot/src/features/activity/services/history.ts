import {
	activitySessionsTable,
	activityTotalsTable,
	and,
	db,
	desc,
	eq,
	isNotNull,
	lt,
	or,
} from "@workspace/db"
import type { ActivityTotal, HistoryPage } from "@/features/activity/types"
import { HISTORY_PAGE_SIZE } from "@/shared/constants/pagination"
import type { PaginationCursor } from "@/shared/pagination"

export async function getActivityTotals(
	userId: string
): Promise<ActivityTotal[]> {
	return db
		.select({
			activityName: activityTotalsTable.activityName,
			timePlayed: activityTotalsTable.totalSeconds,
			lastPlayed: activityTotalsTable.lastPlayed,
		})
		.from(activityTotalsTable)
		.where(eq(activityTotalsTable.userId, userId))
		.orderBy(desc(activityTotalsTable.totalSeconds))
}

export async function getActivityHistoryPage(
	userId: string,
	cursor: PaginationCursor | null
): Promise<HistoryPage> {
	const userCondition = eq(activitySessionsTable.userId, userId)
	const completedCondition = isNotNull(activitySessionsTable.endedAt)
	const baseCondition = and(userCondition, completedCondition)

	const cursorCondition = cursor
		? or(
				lt(activitySessionsTable.startedAt, cursor.startedAt),
				and(
					eq(activitySessionsTable.startedAt, cursor.startedAt),
					lt(activitySessionsTable.id, cursor.id)
				)
			)
		: undefined

	const whereCondition = cursorCondition
		? and(baseCondition, cursorCondition)
		: baseCondition

	const rows = await db
		.select({
			id: activitySessionsTable.id,
			activityName: activitySessionsTable.activityName,
			activityKey: activitySessionsTable.activityKey,
			startedAt: activitySessionsTable.startedAt,
			endedAt: activitySessionsTable.endedAt,
			durationSeconds: activitySessionsTable.durationSeconds,
			isCustom: activitySessionsTable.isCustom,
		})
		.from(activitySessionsTable)
		.where(whereCondition)
		.orderBy(
			desc(activitySessionsTable.startedAt),
			desc(activitySessionsTable.id)
		)
		.limit(HISTORY_PAGE_SIZE + 1)

	const hasNextPage = rows.length > HISTORY_PAGE_SIZE
	const sessions = rows.slice(0, HISTORY_PAGE_SIZE)
	const lastSession = sessions.at(-1)

	return {
		sessions,
		nextCursor:
			hasNextPage && lastSession
				? { startedAt: lastSession.startedAt, id: lastSession.id }
				: null,
	}
}
