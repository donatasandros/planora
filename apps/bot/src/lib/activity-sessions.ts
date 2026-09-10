import { randomUUID } from "node:crypto"
import { activitySessionsTable, db, eq } from "@workspace/db"
import { getJson, setJson } from "@workspace/redis"
import { type Activity, ActivityType } from "discord.js"

const ACTIVE_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

export type ActiveActivitySession = {
  id: string
  activityKey: string
  activityName: string
  activityType: number
  applicationId: string | null
  isCustom: boolean
  startedAt: number
}

export type ActiveActivitySessions = Record<string, ActiveActivitySession>

function getActiveSessionsKey(userId: string): string {
  return `activity:active:${userId}`
}

export function getActivityKey(activity: Activity): string {
  return [activity.type, activity.applicationId ?? "", activity.name].join(":")
}

export function isCustomActivity(activity: Activity): boolean {
  return activity.type === ActivityType.Custom
}

export function getActivityStartTime(activity: Activity): number {
  const timestamp = activity.timestamps?.start

  if (timestamp instanceof Date) {
    return Math.floor(timestamp.getTime() / 1000)
  }

  return Math.floor(Date.now() / 1000)
}

export async function getActiveSessions(
  userId: string
): Promise<ActiveActivitySessions> {
  return (
    (await getJson<ActiveActivitySessions>(getActiveSessionsKey(userId))) ?? {}
  )
}

export async function saveActiveSessions(
  userId: string,
  sessions: ActiveActivitySessions
): Promise<void> {
  await setJson(
    getActiveSessionsKey(userId),
    sessions,
    ACTIVE_SESSION_TTL_SECONDS
  )
}

export async function createActivitySession(
  userId: string,
  session: ActiveActivitySession
): Promise<void> {
  await db
    .insert(activitySessionsTable)
    .values({
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
    .onConflictDoNothing()
}

export async function updateActivitySessionDuration(
  sessionId: string,
  durationSeconds: number
): Promise<void> {
  await db
    .update(activitySessionsTable)
    .set({
      durationSeconds: Math.max(0, durationSeconds),
    })
    .where(eq(activitySessionsTable.id, sessionId))
}

export async function finishActivitySession(
  sessionId: string,
  endedAt: number,
  durationSeconds: number
): Promise<void> {
  await db
    .update(activitySessionsTable)
    .set({
      endedAt,
      durationSeconds: Math.max(0, durationSeconds),
    })
    .where(eq(activitySessionsTable.id, sessionId))
}

export function createSession(
  activity: Activity,
  startedAt: number
): ActiveActivitySession {
  return {
    id: randomUUID(),
    activityKey: getActivityKey(activity),
    activityName: activity.name,
    activityType: activity.type,
    applicationId: activity.applicationId ?? null,
    isCustom: isCustomActivity(activity),
    startedAt,
  }
}
