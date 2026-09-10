import { botUsersTable, db, eq } from "@workspace/db"
import { claim, deleteKey, getJson, setJson } from "@workspace/redis"
import { logger } from "@/lib/logger"

const USER_CACHE_TTL_SECONDS = 60
const USER_REGISTRATION_CLAIM_TTL_SECONDS = 60 * 60 * 24

export type TrackingUser = {
  id: string
  isTrackingEnabled: boolean
  isBlacklisted: boolean
}

function getUserCacheKey(userId: string): string {
  return `bot:user:${userId}`
}

export async function invalidateBotUserCache(userId: string): Promise<void> {
  await deleteKey(getUserCacheKey(userId))
}

async function registerUserEventually(userId: string): Promise<void> {
  const registrationClaimKey = `bot:user:registration:${userId}`

  const shouldRegister = await claim(
    registrationClaimKey,
    USER_REGISTRATION_CLAIM_TTL_SECONDS
  )

  if (!shouldRegister) {
    return
  }

  try {
    await db.insert(botUsersTable).values({ id: userId }).onConflictDoNothing()
  } catch (err) {
    await deleteKey(registrationClaimKey)

    logger.error({ err, userId }, "Failed to lazily register bot user")
  }
}

export async function getTrackingUser(userId: string): Promise<TrackingUser> {
  const cacheKey = getUserCacheKey(userId)

  const cached = await getJson<TrackingUser>(cacheKey)

  if (cached) {
    return cached
  }

  try {
    const [user] = await db
      .select({
        id: botUsersTable.id,
        isTrackingEnabled: botUsersTable.isTrackingEnabled,
        isBlacklisted: botUsersTable.isBlacklisted,
      })
      .from(botUsersTable)
      .where(eq(botUsersTable.id, userId))
      .limit(1)

    if (user) {
      await setJson(cacheKey, user, USER_CACHE_TTL_SECONDS)

      return user
    }

    const defaultUser: TrackingUser = {
      id: userId,
      isTrackingEnabled: true,
      isBlacklisted: false,
    }

    await setJson(cacheKey, defaultUser, USER_CACHE_TTL_SECONDS)

    void registerUserEventually(userId)

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
