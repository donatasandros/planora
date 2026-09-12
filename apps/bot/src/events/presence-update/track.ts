import { createHash } from "node:crypto"
import { claim } from "@workspace/redis"
import type { Client, Presence } from "discord.js"
import {
  type ActiveActivitySessions,
  createActivitySession,
  createSession,
  finishActivitySession,
  finishSessions,
  getActiveSessions,
  getActivityKey,
  getActivityStartTime,
  saveActiveSessions,
} from "@/lib/activity-sessions"
import { getTrackingUser } from "@/lib/bot-users"
import { logger } from "@/lib/logger"

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

export default async function trackPresence(
  _client: Client,
  _oldPresence: Presence | null,
  newPresence: Presence
): Promise<void> {
  const userId = newPresence.userId

  if (!userId) {
    return
  }

  if (newPresence.member?.user.bot === true) {
    return
  }

  const fingerprint = getPresenceFingerprint(newPresence)

  const deduplicationKey = ["presence:event", userId, hash(fingerprint)].join(
    ":"
  )

  const shouldProcess = await claim(
    deduplicationKey,
    PRESENCE_DEDUPLICATION_TTL_SECONDS
  )

  if (!shouldProcess) {
    return
  }

  const user = await getTrackingUser(userId)

  let previousSessions: ActiveActivitySessions = {}

  try {
    previousSessions = await getActiveSessions(userId)
  } catch (err) {
    logger.warn(
      { err, userId },
      "Skipping presence update due to active session state being unavailable"
    )

    return
  }

  if (!user.isTrackingEnabled || user.isBlacklisted) {
    if (Object.keys(previousSessions).length > 0) {
      const endedAt = Math.floor(Date.now() / 1000)

      await finishSessions(previousSessions, endedAt)
      await saveActiveSessions(userId, {})
    }

    return
  }

  const nextSessions: ActiveActivitySessions = {}

  for (const activity of newPresence.activities) {
    const activityKey = getActivityKey(activity)
    const existingSession = previousSessions[activityKey]

    if (existingSession) {
      nextSessions[activityKey] = existingSession
      continue
    }

    const session = createSession(activity, getActivityStartTime(activity))

    await createActivitySession(userId, session)

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

  const endedAt = Math.floor(Date.now() / 1000)

  for (const [activityKey, session] of Object.entries(previousSessions)) {
    if (nextSessions[activityKey]) {
      continue
    }

    const durationSeconds = Math.max(0, endedAt - session.startedAt)

    await finishActivitySession(session.id, endedAt, durationSeconds)

    logger.debug(
      {
        userId,
        activity: session.activityName,
        sessionId: session.id,
        endedAt,
        durationSeconds,
      },
      "Finished activity session"
    )
  }

  await saveActiveSessions(userId, nextSessions)
}
