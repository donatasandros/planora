import { botUsersTable, type DB, db, eq } from "@workspace/db"
import { type RedisService, redisService } from "@workspace/redis"
import { logger } from "@/core/logger"
import { USER_REDIS_KEYS, type User } from "@/features/system"

export class UserService {
   constructor(
      private readonly db: DB,
      private readonly redis: RedisService
   ) {}

   private readonly USER_CACHE_TTL_SECONDS = 60
   private readonly USER_REGISTRATION_CLAIM_TTL_SECONDS = 60 * 60 * 24

   private async registerUserEventually(userId: string): Promise<void> {
      const registrationClaimKey = USER_REDIS_KEYS.REGISTRATION(userId)

      const shouldRegister = await this.redis.claim(
         registrationClaimKey,
         this.USER_REGISTRATION_CLAIM_TTL_SECONDS
      )

      if (!shouldRegister) {
         return
      }

      try {
         await this.db
            .insert(botUsersTable)
            .values({ id: userId })
            .onConflictDoNothing()
      } catch (err) {
         await this.redis.deleteKey(registrationClaimKey)

         logger.error({ err, userId }, "Failed to lazily register user")
      }
   }

   public async invalidateUserCache(userId: string): Promise<void> {
      await this.redis.deleteKey(USER_REDIS_KEYS.CACHE(userId))
   }

   public async getUser(userId: string): Promise<User> {
      const cacheKey = USER_REDIS_KEYS.CACHE(userId)
      const cached = await this.redis.getJson<User>(cacheKey)

      if (cached) {
         return cached
      }

      try {
         const [user] = await this.db
            .select({
               id: botUsersTable.id,
               isTrackingEnabled: botUsersTable.isTrackingEnabled,
               isBlacklisted: botUsersTable.isBlacklisted,
            })
            .from(botUsersTable)
            .where(eq(botUsersTable.id, userId))
            .limit(1)

         if (user) {
            await this.redis.setJson(
               cacheKey,
               user,
               this.USER_CACHE_TTL_SECONDS
            )

            return user
         }

         const defaultUser: User = {
            id: userId,
            isTrackingEnabled: true,
            isBlacklisted: false,
         }

         await this.redis.setJson(
            cacheKey,
            defaultUser,
            this.USER_CACHE_TTL_SECONDS
         )

         void this.registerUserEventually(userId)

         return defaultUser
      } catch (err) {
         logger.error({ err, userId }, "Failed to load bot user")

         return {
            id: userId,
            isTrackingEnabled: true,
            isBlacklisted: false,
         }
      }
   }
}

export const userService = new UserService(db, redisService)
