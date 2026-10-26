import { activitySessionsTable, and, db, eq, isNull } from "@workspace/db"
import { deleteKey, getJsonStrict, setJsonStrict } from "@workspace/redis"
import type { Activity, ChatInputCommandInteraction } from "discord.js"
import { logger } from "@/core/logger"
import { parseActiveSessions } from "@/features/activity/schemas/session"
import {
	enqueueSessionFinish,
	enqueueSessionStart,
} from "@/features/activity/services/session-writes"
import type {
	ActiveActivitySession,
	ActiveActivitySessions,
	CurrentActivity,
} from "@/features/activity/types"
import {
	buildActivitySession,
	getActiveSessionsKey,
	getActivityStartTime,
} from "@/features/activity/utils/activity"

const ACTIVE_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

export async function getCurrentActivities(
	interaction: ChatInputCommandInteraction,
	userId: string
): Promise<CurrentActivity[]> {
	const presence = interaction.guild?.presences.cache.get(userId)

	if (presence) {
		return presence.activities.map((activity) => ({
			activityName: activity.name,
			startedAt:
				activity.timestamps?.start instanceof Date
					? Math.floor(activity.timestamps.start.getTime() / 1000)
					: null,
		}))
	}

	const activeSessions = await getActiveSessions(userId)

	return Object.values(activeSessions).map((session) => ({
		activityName: session.activityName,
		startedAt: session.startedAt,
	}))
}

export async function getActiveSessions(
	userId: string
): Promise<ActiveActivitySessions> {
	const key = getActiveSessionsKey(userId)
	const raw = await getJsonStrict<unknown>(key)

	if (raw === null) {
		return {}
	}

	const parsed = parseActiveSessions(raw)

	if (parsed.kind === "invalid") {
		logger.warn({ userId }, "Discarding invalid active sessions payload")

		await deleteKey(key)

		return {}
	}

	if (parsed.dropped > 0) {
		logger.warn(
			{ userId, dropped: parsed.dropped },
			"Dropped invalid active session entries"
		)
	}

	return parsed.sessions
}

export async function setActiveSessions(
	userId: string,
	sessions: ActiveActivitySessions
): Promise<void> {
	await setJsonStrict(
		getActiveSessionsKey(userId),
		sessions,
		ACTIVE_SESSION_TTL_SECONDS
	)
}

export async function startActivitySession(
	userId: string,
	activity: Activity
): Promise<ActiveActivitySession> {
	const session = buildActivitySession(
		activity,
		getActivityStartTime(activity)
	)

	const inserted = await enqueueSessionStart({
		id: session.id,
		userId,
		activityKey: session.activityKey,
		activityName: session.activityName,
		activityType: session.activityType,
		applicationId: session.applicationId,
		isCustom: session.isCustom,
		startedAt: session.startedAt,
		endedAt: null,
		durationSeconds: 0,
	})

	if (inserted) {
		return session
	}

	logger.debug(
		{ userId, activityKey: session.activityKey },
		"Session insert conflicted; reusing open session"
	)

	const existing = await db
		.select()
		.from(activitySessionsTable)
		.where(
			and(
				eq(activitySessionsTable.userId, userId),
				eq(activitySessionsTable.activityKey, session.activityKey),
				isNull(activitySessionsTable.endedAt)
			)
		)
		.limit(1)

	if (existing.length > 0) {
		const row = existing[0]

		return {
			id: row.id,
			activityKey: row.activityKey,
			activityName: row.activityName,
			activityType: row.activityType,
			applicationId: row.applicationId,
			isCustom: row.isCustom,
			startedAt: row.startedAt,
			lastSeenAt: Math.floor(Date.now() / 1000),
		}
	}

	throw new Error(
		`startActivitySession: no open session for user ${userId} after conflict`
	)
}

export async function finishActivitySession(
	sessionId: string,
	endedAt: number,
	durationSeconds: number
): Promise<void> {
	await enqueueSessionFinish(sessionId, endedAt, Math.max(0, durationSeconds))
}
