import {
	acquireLock,
	deleteKeyStrict,
	releaseLock,
	scanKeys,
} from "@workspace/redis"
import type { Client } from "discord.js"
import { logger } from "@/core/logger"
import {
	ACTIVITY_REDIS_KEYS,
	TRACK_CUSTOM_ACTIVITIES,
} from "@/features/activity/constants"
import {
	findOpenSessions,
	finishActivitySession,
	getActiveSessions,
	setActiveSessions,
} from "@/features/activity/services/sessions"
import { recoverOrphanedSessions } from "@/features/activity/sweeper/orphan-recovery"
import { partitionStaleSessions } from "@/features/activity/sweeper/partition-sessions"
import { planUserSweep } from "@/features/activity/sweeper/plan-user-sweep"
import { createPresenceLookup } from "@/features/activity/tracking/presence-lookup"
import type {
	ActiveActivitySessions,
	SessionSweeper,
} from "@/features/activity/types"

const SWEEP_INTERVAL_MS = 3 * 60 * 1000 // 3 minutes
const SWEEP_LOCK_TTL_SECONDS = 2 * 60 // 2 minutes
const SWEEP_USER_LOCK_TTL_SECONDS = 30

const STALE_SESSION_SECONDS = 15 * 60 // 15 minutes
const ACTIVE_SESSION_PATTERN = `${ACTIVITY_REDIS_KEYS.ACTIVE_SESSION_PREFIX}*`

async function readActiveSessions(
	userId: string
): Promise<ActiveActivitySessions | null> {
	try {
		return await getActiveSessions(userId)
	} catch (err) {
		logger.warn(
			{
				err,
				userId,
			},
			"Skipped user after failing to read active sessions"
		)

		return null
	}
}

async function sweepStaleSessions(
	client: Client,
	{ deferUnknown }: { deferUnknown: boolean }
): Promise<void> {
	const presenceFor = createPresenceLookup(client)

	const lockToken = await acquireLock(
		ACTIVITY_REDIS_KEYS.SWEEP_LOCK,
		SWEEP_LOCK_TTL_SECONDS
	)

	if (!lockToken) {
		return
	}

	try {
		for await (const keys of scanKeys(ACTIVE_SESSION_PATTERN, 100)) {
			for (const key of keys) {
				const userId = key.replace(
					ACTIVITY_REDIS_KEYS.ACTIVE_SESSION_PREFIX,
					""
				)
				const userLockKey = ACTIVITY_REDIS_KEYS.USER_LOCK(userId)

				const snapshot = await readActiveSessions(userId)

				if (!snapshot) {
					continue
				}

				const now = Math.floor(Date.now() / 1000)

				const snapshotPartition = partitionStaleSessions(
					snapshot,
					now,
					STALE_SESSION_SECONDS
				)

				if (snapshotPartition.stale.length === 0) {
					continue
				}

				const userLockToken = await acquireLock(
					userLockKey,
					SWEEP_USER_LOCK_TTL_SECONDS
				)

				if (!userLockToken) {
					logger.debug(
						{ userId },
						"Skipped sweeping user because lock could not be acquired"
					)
					continue
				}

				try {
					const sessions = await readActiveSessions(userId)

					if (!sessions) {
						continue
					}

					const plan = planUserSweep({
						sessions,
						activities: presenceFor(userId)?.activities,
						trackCustom: TRACK_CUSTOM_ACTIVITIES,
						now,
						staleSeconds: STALE_SESSION_SECONDS,
						deferUnknown,
					})

					if (
						plan.refreshed === 0 &&
						plan.finish.length === 0 &&
						Object.keys(plan.deferred).length === 0
					) {
						continue
					}

					const nextSessions: ActiveActivitySessions = {
						...plan.keep,
						...plan.deferred,
					}

					for (const item of plan.finish) {
						await finishActivitySession(
							item.id,
							item.endedAt,
							item.durationSeconds
						)

						logger.debug(
							{ userId, sessionId: item.id },
							"Sweep stale activity session"
						)
					}

					if (Object.keys(nextSessions).length > 0) {
						await setActiveSessions(userId, nextSessions)
					} else {
						await deleteKeyStrict(key)
					}
				} finally {
					await releaseLock(userLockKey, userLockToken)
				}
			}
		}

		const recovery = await recoverOrphanedSessions({
			findOpenSessions,
			getActiveSessions,
			finishSession: (input) =>
				finishActivitySession(
					input.id,
					input.endedAt,
					input.durationSeconds
				),
			acquireUserLock: async (userId) =>
				acquireLock(
					ACTIVITY_REDIS_KEYS.USER_LOCK(userId),
					SWEEP_USER_LOCK_TTL_SECONDS
				),
			releaseUserLock: (userId, token) =>
				releaseLock(ACTIVITY_REDIS_KEYS.USER_LOCK(userId), token),
			now: Math.floor(Date.now() / 1000),
		})

		if (recovery.recovered > 0 || recovery.usersDegraded > 0) {
			logger.warn(recovery, "Recovered orphaned activity sessions")
		}
	} finally {
		await releaseLock(ACTIVITY_REDIS_KEYS.SWEEP_LOCK, lockToken)
	}
}

export function startSessionSweeperWorker(client: Client): SessionSweeper {
	let inFlight: Promise<void> | undefined
	let stopped = false

	function run(initial: boolean = false): void {
		if (inFlight || stopped) {
			return
		}

		inFlight = sweepStaleSessions(client, { deferUnknown: initial })
			.catch((err) => {
				logger.error(
					{ err },
					initial
						? "Initial activity session sweep failed"
						: "Activity session sweep failed"
				)
			})
			.finally(() => {
				inFlight = undefined
			})
	}

	const interval = setInterval(() => {
		run()
	}, SWEEP_INTERVAL_MS)

	interval.unref()

	void run(true)

	return {
		stop: async () => {
			stopped = true
			clearInterval(interval)
			await inFlight
		},
	}
}
