import {
  acquireLock,
  deleteKey,
  getJson,
  redis,
  releaseLock,
} from "@workspace/redis"
import {
  type ActiveActivitySessions,
  finishActivitySession,
  saveActiveSessions,
} from "@/lib/activity-sessions"
import { logger } from "@/lib/logger"

const SWEEP_INTERVAL_MS = 3 * 60 * 1000 // 3 minutes
const SWEEP_LOCK_TTL_SECONDS = 2 * 60 // 2 minutes
const SWEEP_LOCK_KEY = "activity:sweep:lock"

const STALE_SESSION_SECONDS = 15 * 60 // 15 minutes
const ACTIVE_SESSION_PATTERN = "activity:active:*"

async function sweepStaleSessions(): Promise<void> {
  const lockToken = await acquireLock(SWEEP_LOCK_KEY, SWEEP_LOCK_TTL_SECONDS)

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

        const entries = Object.entries(sessions)

        const staleEntries = entries.filter(
          ([_, session]) => now - session.lastSeenAt > STALE_SESSION_SECONDS
        )

        if (staleEntries.length === 0) {
          continue
        }

        const activeEntries = entries.filter(
          ([_, session]) => now - session.lastSeenAt <= STALE_SESSION_SECONDS
        )

        for (const [_, session] of staleEntries) {
          const duration = Math.max(0, session.lastSeenAt - session.startedAt)

          await finishActivitySession(session.id, session.lastSeenAt, duration)

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
          await saveActiveSessions(userId, Object.fromEntries(activeEntries))
        } else {
          await deleteKey(key)
        }
      }
    }
  } finally {
    await releaseLock(SWEEP_LOCK_KEY, lockToken)
  }
}

export function startSessionSweeperWorker(): NodeJS.Timeout {
  const interval = setInterval(() => {
    void sweepStaleSessions().catch((err) => {
      logger.error({ err }, "Activity session sweep failed")
    })
  }, SWEEP_INTERVAL_MS)

  interval.unref()

  void sweepStaleSessions().catch((err) => {
    logger.error({ err }, "Initial activity session sweep failed")
  })

  return interval
}
