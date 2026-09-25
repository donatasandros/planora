import {
	activitySessionsTable,
	and,
	count,
	db,
	desc,
	eq,
	isNotNull,
	lt,
	max,
	or,
	sum,
} from "@workspace/db"
import type { ActivityTotal, HistoryPage } from "@/features/activity/types"
import { ITEMS_PER_PAGE } from "@/shared/constants/pagination"
import type { PaginationCursor } from "@/shared/utils/pagination"

export async function getActivityTotals(
	userId: string
): Promise<ActivityTotal[]> {
	const totalDuration = sum(activitySessionsTable.durationSeconds)

	return db
		.select({
			activityName: activitySessionsTable.activityName,
			timePlayed: totalDuration.mapWith(Number),
			lastPlayed: max(activitySessionsTable.endedAt),
		})
		.from(activitySessionsTable)
		.where(
			and(
				eq(activitySessionsTable.userId, userId),
				isNotNull(activitySessionsTable.endedAt)
			)
		)
		.groupBy(activitySessionsTable.activityName)
		.orderBy(desc(totalDuration))
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

	let totalPages: number | undefined

	if (!cursor) {
		const [result] = await db
			.select({ total: count() })
			.from(activitySessionsTable)
			.where(baseCondition)

		const totalSessions = Number(result?.total ?? 0)

		totalPages = Math.ceil(totalSessions / ITEMS_PER_PAGE)
	}

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
		.limit(ITEMS_PER_PAGE + 1)

	const hasNextPage = rows.length > ITEMS_PER_PAGE
	const sessions = rows.slice(0, ITEMS_PER_PAGE)
	const lastSession = sessions.at(-1)

	return {
		sessions,
		nextCursor:
			hasNextPage && lastSession
				? { startedAt: lastSession.startedAt, id: lastSession.id }
				: null,
		totalPages,
	}
}
