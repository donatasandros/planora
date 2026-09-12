import {
  acquireLock,
  deleteKey,
  getJson,
  getJsonStrict,
  redis,
  releaseLock,
} from "@workspace/redis"
import {
  type ActiveActivitySessions,
  finishSessions,
  updateActivitySessionDuration,
} from "@/lib/activity-sessions"
import { logger } from "@/lib/logger"

const RECONCILIATION_INTERVAL_MS = 60_000
const RECONCILIATION_LOCK_TTL_SECONDS = 120
const RECONCILIATION_LOCK_KEY = "activity:reconciliation:lock"

const ACTIVE_SESSION_PATTERN = "activity:active:*"

function calculateDurationSeconds(startedAt: number, now: number): number {
  return Math.max(0, now - startedAt)
}

async function recoverStaleSessions(): Promise<void> {
  const lockToken = await acquireLock(
    RECONCILIATION_LOCK_KEY,
    RECONCILIATION_LOCK_TTL_SECONDS
  )

  if (!lockToken) {
    return
  }

  try {
    const stream = redis.scanStream({
      match: ACTIVE_SESSION_PATTERN,
      count: 100,
    })

    const endedAt = Math.floor(Date.now() / 1000)

    for await (const keys of stream) {
      for (const key of keys as string[]) {
        const sessions = await getJsonStrict<ActiveActivitySessions>(key)

        if (sessions && Object.keys(sessions).length > 0) {
          await finishSessions(sessions, endedAt)
        }

        await deleteKey(key)

        logger.info(
          { key, sessionCount: sessions ? Object.keys(sessions).length : 0 },
          "Recovered stale activity sessions after startup"
        )
      }
    }
  } finally {
    await releaseLock(RECONCILIATION_LOCK_KEY, lockToken)
  }
}

async function reconcileActiveSessions(): Promise<void> {
  const lockToken = await acquireLock(
    RECONCILIATION_LOCK_KEY,
    RECONCILIATION_LOCK_TTL_SECONDS
  )

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
    await releaseLock(RECONCILIATION_LOCK_KEY, lockToken)
  }
}

export function startActivityReconciliationWorker(): NodeJS.Timeout {
  const interval = setInterval(() => {
    void reconcileActiveSessions().catch((err) => {
      logger.error({ err }, "Activity reconciliation failed")
    })
  }, RECONCILIATION_INTERVAL_MS)

  interval.unref()

  void recoverStaleSessions()
    .then(() => reconcileActiveSessions())
    .catch((err) => {
      logger.error({ err }, "Initial activity session recovery failed")
    })

  return interval
}
