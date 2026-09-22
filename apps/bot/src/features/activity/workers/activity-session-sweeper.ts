import { redisService } from "@workspace/redis"
import { logger } from "@/core/logger"
import { ACTIVITY_REDIS_KEYS } from "@/features/activity/constants"
import { activityService } from "@/features/activity/services/activity.service"
import type { ActiveActivitySessions } from "@/features/activity/types"

const SWEEP_INTERVAL_MS = 3 * 60 * 1000 // 3 minutes
const SWEEP_LOCK_TTL_SECONDS = 2 * 60 // 2 minutes

const STALE_SESSION_SECONDS = 15 * 60 // 15 minutes
const ACTIVE_SESSION_PATTERN = `${ACTIVITY_REDIS_KEYS.ACTIVE_SESSION_PREFIX}*`

async function sweepStaleSessions(): Promise<void> {
   const lockToken = await redisService.acquireLock(
      ACTIVITY_REDIS_KEYS.SWEEP_LOCK,
      SWEEP_LOCK_TTL_SECONDS
   )

   if (!lockToken) {
      return
   }

   try {
      const stream = redisService.client.scanStream({
         match: ACTIVE_SESSION_PATTERN,
         count: 100,
      })

      const now = Math.floor(Date.now() / 1000)

      for await (const keys of stream) {
         for (const key of keys as string[]) {
            const userId = key.replace(
               ACTIVITY_REDIS_KEYS.ACTIVE_SESSION_PREFIX,
               ""
            )
            const sessions =
               await redisService.getJson<ActiveActivitySessions>(key)

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

               await activityService.finishSession(
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
               await activityService.setActiveSessions(
                  userId,
                  Object.fromEntries(activeEntries)
               )
            } else {
               await redisService.deleteKey(key)
            }
         }
      }
   } finally {
      await redisService.releaseLock(ACTIVITY_REDIS_KEYS.SWEEP_LOCK, lockToken)
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
