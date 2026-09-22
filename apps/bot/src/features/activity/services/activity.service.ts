import { randomUUID } from "node:crypto"
import {
   activitySessionsTable,
   and,
   count,
   type DB,
   db,
   desc,
   eq,
   isNotNull,
   lt,
   max,
   or,
   sum,
} from "@workspace/db"
import { type RedisService, redisService } from "@workspace/redis"
import {
   type Activity,
   ActivityType,
   type ChatInputCommandInteraction,
} from "discord.js"
import { ACTIVITY_REDIS_KEYS } from "@/features/activity/constants"
import type {
   ActiveActivitySession,
   ActiveActivitySessions,
   CurrentActivity,
   HistoryPage,
   PastActivity,
} from "@/features/activity/types"
import { ITEMS_PER_PAGE } from "@/shared/constants/pagination"
import type { PaginationCursor } from "@/shared/utils/pagination"

export class ActivityService {
   constructor(
      private readonly db: DB,
      private readonly redis: RedisService
   ) {}

   private readonly ACTIVE_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

   public getActiveSessionsKey(userId: string): string {
      return `${ACTIVITY_REDIS_KEYS.ACTIVE_SESSION_PREFIX}${userId}`
   }

   public getActivityKey(activity: Activity): string {
      return [activity.type, activity.applicationId ?? "", activity.name].join(
         ":"
      )
   }

   public getActivityStartTime(activity: Activity): number {
      const timestamp = activity.timestamps?.start

      if (timestamp instanceof Date) {
         return Math.floor(timestamp.getTime() / 1000)
      }

      return Math.floor(Date.now() / 1000)
   }

   public isCustomActivity(activity: Activity): boolean {
      return activity.type === ActivityType.Custom
   }

   public async getCurrentActivities(
      interaction: ChatInputCommandInteraction,
      userId: string
   ): Promise<CurrentActivity[]> {
      const presence = interaction.guild?.presences.cache.get(userId)

      if (presence) {
         return presence.activities.map((activity) => {
            const startedAt = activity.timestamps?.start

            return {
               activityName: activity.name,
               startedAt:
                  startedAt instanceof Date
                     ? Math.floor(startedAt.getTime() / 1000)
                     : null,
            }
         })
      }

      const activeSessions = await this.getActiveSessions(userId)

      return Object.values(activeSessions).map((session) => ({
         activityName: session.activityName,
         startedAt: session.startedAt,
      }))
   }

   public async getPastActivities(userId: string): Promise<PastActivity[]> {
      const totalDuration = sum(activitySessionsTable.durationSeconds)

      return this.db
         .select({
            activityName: activitySessionsTable.activityName,
            timePlayed: totalDuration.mapWith(Number),
            lastPlayed: max(activitySessionsTable.endedAt),
         })
         .from(activitySessionsTable)
         .where(
            and(
               eq(activitySessionsTable.userId, userId),
               isNotNull(activitySessionsTable.endedAt)
            )
         )
         .groupBy(activitySessionsTable.activityName)
         .orderBy(desc(totalDuration))
   }

   public async getActiveSessions(
      userId: string
   ): Promise<ActiveActivitySessions> {
      return (
         (await this.redis.getJsonStrict<ActiveActivitySessions>(
            this.getActiveSessionsKey(userId)
         )) ?? {}
      )
   }

   public async setActiveSessions(
      userId: string,
      sessions: ActiveActivitySessions
   ): Promise<void> {
      await this.redis.setJson(
         this.getActiveSessionsKey(userId),
         sessions,
         this.ACTIVE_SESSION_TTL_SECONDS
      )
   }

   public async insertSession(
      userId: string,
      session: ActiveActivitySession
   ): Promise<void> {
      await this.db
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

   public async finishSession(
      sessionId: string,
      endedAt: number,
      durationSeconds: number
   ): Promise<void> {
      await this.db
         .update(activitySessionsTable)
         .set({
            endedAt,
            durationSeconds: Math.max(0, durationSeconds),
         })
         .where(eq(activitySessionsTable.id, sessionId))
   }

   public buildSession(
      activity: Activity,
      startedAt: number
   ): ActiveActivitySession {
      return {
         id: randomUUID(),
         activityKey: this.getActivityKey(activity),
         activityName: activity.name,
         activityType: activity.type,
         applicationId: activity.applicationId ?? null,
         isCustom: this.isCustomActivity(activity),
         startedAt,
         lastSeenAt: Math.floor(Date.now() / 1000),
      }
   }

   public async getSessionHistoryPage(
      userId: string,
      cursor: PaginationCursor | null
   ): Promise<HistoryPage> {
      const userCondition = eq(activitySessionsTable.userId, userId)
      const completedCondition = isNotNull(activitySessionsTable.endedAt)
      const baseCondition = and(userCondition, completedCondition)

      const cursorCondition = cursor
         ? or(
              lt(activitySessionsTable.startedAt, cursor.startedAt),
              and(
                 eq(activitySessionsTable.startedAt, cursor.startedAt),
                 lt(activitySessionsTable.id, cursor.id)
              )
           )
         : undefined

      const whereCondition = cursorCondition
         ? and(baseCondition, cursorCondition)
         : baseCondition

      let totalPages: number | undefined

      if (!cursor) {
         const [result] = await this.db
            .select({
               total: count(),
            })
            .from(activitySessionsTable)
            .where(baseCondition)

         const totalSessions = Number(result?.total ?? 0)

         totalPages = Math.ceil(totalSessions / ITEMS_PER_PAGE)
      }

      const rows = await this.db
         .select({
            id: activitySessionsTable.id,
            activityName: activitySessionsTable.activityName,
            activityKey: activitySessionsTable.activityKey,
            startedAt: activitySessionsTable.startedAt,
            endedAt: activitySessionsTable.endedAt,
            durationSeconds: activitySessionsTable.durationSeconds,
            isCustom: activitySessionsTable.isCustom,
         })
         .from(activitySessionsTable)
         .where(whereCondition)
         .orderBy(
            desc(activitySessionsTable.startedAt),
            desc(activitySessionsTable.id)
         )
         .limit(ITEMS_PER_PAGE + 1)

      const hasNextPage = rows.length > ITEMS_PER_PAGE
      const sessions = rows.slice(0, ITEMS_PER_PAGE)
      const lastSession = sessions.at(-1)

      return {
         sessions,
         nextCursor:
            hasNextPage && lastSession
               ? {
                    startedAt: lastSession.startedAt,
                    id: lastSession.id,
                 }
               : null,
         totalPages,
      }
   }
}

export const activityService = new ActivityService(db, redisService)
