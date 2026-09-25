import {
	acquireLock,
	deleteKey,
	getJson,
	releaseLock,
	scanKeys,
} from "@workspace/redis"
import { logger } from "@/core/logger"
import { ACTIVITY_REDIS_KEYS } from "@/features/activity/constants"
import {
	finishActivitySession,
	setActiveSessions,
} from "@/features/activity/services/sessions"
import type {
	ActiveActivitySessions,
	SessionSweeper,
} from "@/features/activity/types"

const SWEEP_INTERVAL_MS = 3 * 60 * 1000 // 3 minutes
const SWEEP_LOCK_TTL_SECONDS = 2 * 60 // 2 minutes

const STALE_SESSION_SECONDS = 15 * 60 // 15 minutes
const ACTIVE_SESSION_PATTERN = `${ACTIVITY_REDIS_KEYS.ACTIVE_SESSION_PREFIX}*`

async function sweepStaleSessions(): Promise<void> {
	const lockToken = await acquireLock(
		ACTIVITY_REDIS_KEYS.SWEEP_LOCK,
		SWEEP_LOCK_TTL_SECONDS
	)

	if (!lockToken) {
		return
	}

	try {
		const now = Math.floor(Date.now() / 1000)

		for await (const keys of scanKeys(ACTIVE_SESSION_PATTERN, 100)) {
			for (const key of keys) {
				const userId = key.replace(
					ACTIVITY_REDIS_KEYS.ACTIVE_SESSION_PREFIX,
					""
				)
				const sessions = await getJson<ActiveActivitySessions>(key)

				if (!sessions) {
					continue
				}

				const entries = Object.entries(sessions)

				const staleEntries = entries.filter(
					([_, session]) =>
						now - session.lastSeenAt > STALE_SESSION_SECONDS
				)

				if (staleEntries.length === 0) {
					continue
				}

				const activeEntries = entries.filter(
					([_, session]) =>
						now - session.lastSeenAt <= STALE_SESSION_SECONDS
				)

				for (const [_, session] of staleEntries) {
					const duration = Math.max(
						0,
						session.lastSeenAt - session.startedAt
					)

					await finishActivitySession(
						session.id,
						session.lastSeenAt,
						duration
					)

					logger.debug(
						{
							userId,
							sessionId: session.id,
							activity: session.activityName,
						},
						"Sweep stale activity session"
					)
				}

				if (activeEntries.length > 0) {
					await setActiveSessions(
						userId,
						Object.fromEntries(activeEntries)
					)
				} else {
					await deleteKey(key)
				}
			}
		}
	} finally {
		await releaseLock(ACTIVITY_REDIS_KEYS.SWEEP_LOCK, lockToken)
	}
}

export function startSessionSweeperWorker(): SessionSweeper {
	let inFlight: Promise<void> | undefined
	let stopped = false

	function run(initial: boolean = false): void {
		if (inFlight || stopped) {
			return
		}

		inFlight = sweepStaleSessions()
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
