import {
	acquireLock,
	deleteKeyStrict,
	getJson,
	releaseLock,
	setJson,
} from "@workspace/redis"
import { Events } from "discord.js"
import { logger } from "@/core/logger"
import { defineEvent } from "@/core/utils/define-event"
import {
	ACTIVITY_REDIS_KEYS,
	TRACK_CUSTOM_ACTIVITIES,
} from "@/features/activity/constants"
import {
	finishActivitySession,
	getActiveSessions,
	setActiveSessions,
	startActivitySession,
} from "@/features/activity/services/sessions"
import {
	getPresenceFingerprint,
	hashFingerprint,
} from "@/features/activity/tracking/fingerprint"
import {
	createLastFingerprintStore,
	isDuplicatePresence,
} from "@/features/activity/tracking/last-fingerprint"
import { reconcileSessions } from "@/features/activity/tracking/reconcile"
import type { ActiveActivitySessions } from "@/features/activity/types"
import { getActiveSessionsKey } from "@/features/activity/utils/activity"
import { resolveUser } from "@/features/system"

const USER_ACTIVITY_LOCK_TTL_SECONDS = 30

const lastFingerprint = createLastFingerprintStore({
	get: getJson,
	set: setJson,
})

export const trackPresenceListener = defineEvent(Events.PresenceUpdate, {
	priority: 50,
	async execute(_client, _oldPresence, newPresence) {
		const userId = newPresence.userId

		if (!userId) {
			return
		}

		if (newPresence.member?.user.bot === true) {
			return
		}

		const fingerprint = getPresenceFingerprint(newPresence)
		const fingerprintHash = hashFingerprint(fingerprint)

		const lastProcessedHash = await lastFingerprint.read(userId)

		if (isDuplicatePresence(lastProcessedHash, fingerprintHash)) {
			return
		}

		const lockKey = ACTIVITY_REDIS_KEYS.USER_LOCK(userId)
		const lockToken = await acquireLock(
			lockKey,
			USER_ACTIVITY_LOCK_TTL_SECONDS
		)

		if (!lockToken) {
			logger.debug(
				{ userId },
				"Skipped presence update because user is locked"
			)

			return
		}

		try {
			const [userResolution, previousSessions] = await Promise.all([
				resolveUser(userId),
				getActiveSessions(userId),
			])

			if (userResolution.kind === "unavailable") {
				logger.warn(
					{ userId },
					"Skipping presence update, user state is unknown"
				)

				return
			}

			const user = userResolution.user
			const activeSessionsKey = getActiveSessionsKey(userId)
			const now = Math.floor(Date.now() / 1000)

			if (!user.isTrackingEnabled || user.isBlacklisted) {
				if (Object.keys(previousSessions).length > 0) {
					for (const session of Object.values(previousSessions)) {
						const duration = Math.max(0, now - session.startedAt)
						await finishActivitySession(session.id, now, duration)
					}

					await deleteKeyStrict(activeSessionsKey)
				}

				await lastFingerprint.commit(userId, fingerprintHash)

				return
			}

			const { started, kept, ended } = reconcileSessions({
				previous: previousSessions,
				activities: newPresence.activities,
				trackCustom: TRACK_CUSTOM_ACTIVITIES,
				now,
			})
			const nextSessions: ActiveActivitySessions = {}

			for (const session of kept) {
				nextSessions[session.activityKey] = session
			}

			for (const activity of started) {
				const session = await startActivitySession(userId, activity)

				nextSessions[session.activityKey] = session

				logger.debug(
					{
						userId,
						activity: session.activityName,
						sessionId: session.id,
						startedAt: session.startedAt,
					},
					"Started activity session"
				)
			}

			for (const session of ended) {
				const durationSeconds = Math.max(0, now - session.startedAt)

				await finishActivitySession(session.id, now, durationSeconds)

				logger.debug(
					{
						userId,
						activity: session.activityName,
						sessionId: session.id,
						endedAt: now,
						durationSeconds,
					},
					"Finished activity session"
				)
			}

			if (Object.keys(nextSessions).length > 0) {
				await setActiveSessions(userId, nextSessions)
			} else {
				await deleteKeyStrict(activeSessionsKey)
			}

			await lastFingerprint.commit(userId, fingerprintHash)
		} finally {
			await releaseLock(lockKey, lockToken)
		}
	},
})
