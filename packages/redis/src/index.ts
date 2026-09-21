import { randomUUID } from "node:crypto"
import { env } from "@workspace/env"
import { createChildLogger } from "@workspace/logger"
import Redis from "ioredis"

const globalForRedis = globalThis as unknown as { redis?: Redis }

const redisClient =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    lazyConnect: true,
  })

if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redisClient
}

export class RedisService {
  private logger = createChildLogger("redis")

  constructor(public readonly client: Redis) {
    this.client.on("error", (err) => {
      this.logger.error({ err }, "Redis connection error")
    })
  }

  async claim(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.set(key, "1", "EX", ttlSeconds, "NX")

      return result === "OK"
    } catch (err) {
      this.logger.warn(
        { err, key },
        "Redis claim failed; continuing without deduplication"
      )

      return true
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)

      if (!value) {
        return null
      }

      return JSON.parse(value) as T
    } catch (err) {
      this.logger.warn({ err, key }, "Redis JSON read failed")

      return null
    }
  }

  async getJsonStrict<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key)

    if (!value) {
      return null
    }

    return JSON.parse(value) as T
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds: number
  ): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds)
    } catch (err) {
      this.logger.warn({ err, key }, "Redis JSON write failed")
    }
  }

  async deleteKey(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (err) {
      this.logger.warn({ err, key }, "Redis key deletion failed")
    }
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<string | null> {
    const token = randomUUID()

    try {
      const result = await this.client.set(key, token, "EX", ttlSeconds, "NX")

      return result === "OK" ? token : null
    } catch (err) {
      this.logger.warn({ err, key }, "Failed to acquire Redis lock")

      return null
    }
  }

  async releaseLock(key: string, token: string): Promise<void> {
    try {
      await this.client.eval(
        `
      	if redis.call("get", KEYS[1]) == ARGV[1] then
       		return redis.call("del", KEYS[1])
      	end

        return 0
      `,
        1,
        key,
        token
      )
    } catch (err) {
      this.logger.warn({ err, key }, "Failed to release Redis lock")
    }
  }
}

export const redisService = new RedisService(redisClient)
