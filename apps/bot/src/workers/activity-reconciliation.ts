import { acquireLock, getJson, redis, releaseLock } from "@workspace/redis"
import {
  type ActiveActivitySessions,
  updateActivitySessionDuration,
} from "@/lib/activity-sessions"
import { logger } from "@/lib/logger"

const RECONCILIATION_INTERVAL_MS = 60_000
const RECONCILIATION_LOCK_TTL_SECONDS = 120

const ACTIVE_SESSION_PATTERN = "activity:active:*"

function calculateDurationSeconds(startedAt: number, now: number): number {
  return Math.max(0, now - startedAt)
}

async function reconcileActiveSessions(): Promise<void> {
  const lockKey = "activity:reconciliation:lock"

  const lockToken = await acquireLock(lockKey, RECONCILIATION_LOCK_TTL_SECONDS)

  if (!lockToken) {
    return
  }

  try {
    const stream = redis.scanStream({
      match: ACTIVE_SESSION_PATTERN,
      count: 100,
    })

    const now = Math.floor(Date.now() / 1000)

    for await (const keys of stream) {
      for (const key of keys as string[]) {
        const userId = key.replace("activity:active:", "")

        const sessions = await getJson<ActiveActivitySessions>(key)

        if (!sessions) {
          continue
        }

        for (const session of Object.values(sessions)) {
          const durationSeconds = calculateDurationSeconds(
            session.startedAt,
            now
          )

          await updateActivitySessionDuration(session.id, durationSeconds)
        }

        logger.debug(
          {
            userId,
            sessionCount: Object.keys(sessions).length,
          },
          "Reconciled active activity sessions"
        )
      }
    }
  } finally {
    await releaseLock(lockKey, lockToken)
  }
}

export function startActivityReconciliationWorker(): NodeJS.Timeout {
  const interval = setInterval(() => {
    void reconcileActiveSessions().catch((err) => {
      logger.error({ err }, "Activity reconciliation failed")
    })
  }, RECONCILIATION_INTERVAL_MS)

  interval.unref()

  void reconcileActiveSessions().catch((err) => {
    logger.error({ err }, "Initial activity reconciliation failed")
  })

  return interval
}
