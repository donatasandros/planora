import { createHash } from "node:crypto"
import { redisService } from "@workspace/redis"
import { ActivityType, Events, type Presence } from "discord.js"
import { logger } from "@/core/logger"
import { defineEvent } from "@/core/utils/define-event"
import {
   ACTIVITY_REDIS_KEYS,
   type ActiveActivitySessions,
   activityService,
   TRACK_CUSTOM_ACTIVITIES,
} from "@/features/activity"
import { userService } from "@/features/system"

const USER_ACTIVITY_LOCK_TTL_SECONDS = 30
const PRESENCE_DEDUPLICATION_TTL_SECONDS = 10

function getPresenceFingerprint(presence: Presence): string {
   const activities = presence.activities
      .map((activity) => ({
         type: activity.type,
         name: activity.name,
         applicationId: activity.applicationId ?? null,
         url: activity.url ?? null,
         details: activity.details ?? null,
         state: activity.state ?? null,
      }))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))

   return JSON.stringify({
      status: presence.status,
      activities,
   })
}

function hash(value: string): string {
   return createHash("sha256").update(value).digest("hex")
}

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

      const deduplicationKey = [
         "presence:event",
         userId,
         hash(fingerprint),
      ].join(":")

      const shouldProcess = await redisService.claim(
         deduplicationKey,
         PRESENCE_DEDUPLICATION_TTL_SECONDS
      )

      if (!shouldProcess) {
         return
      }

      const lockKey = ACTIVITY_REDIS_KEYS.USER_LOCK(userId)
      const lockToken = await redisService.acquireLock(
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
         const user = await userService.getUser(userId)
         const previousSessions =
            await activityService.getActiveSessions(userId)
         const activeSessionsKey = activityService.getActiveSessionsKey(userId)
         const now = Math.floor(Date.now() / 1000)

         if (!user.isTrackingEnabled || user.isBlacklisted) {
            if (Object.keys(previousSessions).length > 0) {
               for (const session of Object.values(previousSessions)) {
                  const duration = Math.max(0, now - session.startedAt)
                  await activityService.finishSession(session.id, now, duration)
               }

               await redisService.deleteKey(activeSessionsKey)
            }

            return
         }

         const nextSessions: ActiveActivitySessions = {}

         for (const activity of newPresence.activities) {
            if (
               !TRACK_CUSTOM_ACTIVITIES &&
               activity.type === ActivityType.Custom
            ) {
               continue
            }

            const activityKey = activityService.getActivityKey(activity)
            const existingSession = previousSessions[activityKey]

            if (existingSession) {
               nextSessions[activityKey] = {
                  ...existingSession,
                  lastSeenAt: now,
               }
               continue
            }

            const session = activityService.buildSession(
               activity,
               activityService.getActivityStartTime(activity)
            )

            await activityService.insertSession(userId, session)

            nextSessions[activityKey] = session

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

         for (const [activityKey, session] of Object.entries(
            previousSessions
         )) {
            if (nextSessions[activityKey]) {
               continue
            }

            const durationSeconds = Math.max(0, now - session.startedAt)

            await activityService.finishSession(
               session.id,
               now,
               durationSeconds
            )

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
            await activityService.setActiveSessions(userId, nextSessions)
         } else {
            await redisService.deleteKey(activeSessionsKey)
         }
      } finally {
         await redisService.releaseLock(lockKey, lockToken)
      }
   },
})
