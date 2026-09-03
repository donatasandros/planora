import { createChildLogger } from "@workspace/logger"
import Redis from "ioredis"

const globalForRedis = globalThis as unknown as { redis?: Redis }

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL as string, {
    maxRetriesPerRequest: 2,
    lazyConnect: true,
  })

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis
}

const logger = createChildLogger("redis")

redis.on("error", (err) => {
  logger.error({ err }, "Redis connection error")
})

export async function claim(key: string, ttlSeconds: number) {
  try {
    const result = await redis.set(key, "1", "EX", ttlSeconds, "NX")

    return result === "OK"
  } catch (err) {
    logger.warn(
      { err, key },
      "Redis claim failed; continuing without deduplication"
    )

    return true
  }
}

export async function getJson<T>(key: string) {
  try {
    const value = await redis.get(key)

    if (!value) {
      return null
    }

    return JSON.parse(value) as T
  } catch (err) {
    logger.warn({ err, key }, "Redis JSON read failed")

    return null
  }
}

export async function setJson(key: string, value: unknown, ttlSeconds: number) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds)
  } catch (err) {
    logger.warn({ err, key }, "Redis JSON write failed")
  }
}

export async function deleteKey(key: string) {
  try {
    await redis.del(key)
  } catch (err) {
    logger.warn({ err, key }, "Redis key deletion failed")
  }
}
