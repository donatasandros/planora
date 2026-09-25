import { randomUUID } from "node:crypto"
import { env } from "@workspace/env"
import { createChildLogger } from "@workspace/logger"
import Redis from "ioredis"

const logger = createChildLogger("redis")

const globalForRedis = globalThis as unknown as { redis?: Redis }
const redis =
	globalForRedis.redis ??
	new Redis(env.REDIS_URL, {
		maxRetriesPerRequest: 2,
		lazyConnect: true,
	})

if (env.NODE_ENV !== "production") {
	globalForRedis.redis = redis
}

redis.on("error", (err) => {
	logger.error({ err }, "Redis connection error")
})

export async function claim(key: string, ttlSeconds: number): Promise<boolean> {
	try {
		const result = await redis.set(key, "1", "EX", ttlSeconds, "NX")

		return result === "OK"
	} catch (err) {
		logger.warn({ err, key }, "Redis claim failed")

		return true
	}
}

export async function getJson<T>(key: string): Promise<T | null> {
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

export async function getJsonStrict<T>(key: string): Promise<T | null> {
	const value = await redis.get(key)

	if (!value) {
		return null
	}

	return JSON.parse(value) as T
}

export async function setJson(
	key: string,
	value: unknown,
	ttlSeconds: number
): Promise<void> {
	try {
		await redis.set(key, JSON.stringify(value), "EX", ttlSeconds)
	} catch (err) {
		logger.warn({ err, key }, "Redis JSON write failed")
	}
}

export async function deleteKey(key: string): Promise<void> {
	try {
		await redis.del(key)
	} catch (err) {
		logger.warn({ err, key }, "Redis key deletion failed")
	}
}

export async function acquireLock(
	key: string,
	ttlSeconds: number
): Promise<string | null> {
	const token = randomUUID()

	try {
		const result = await redis.set(key, token, "EX", ttlSeconds, "NX")

		return result === "OK" ? token : null
	} catch (err) {
		logger.warn({ err, key }, "Failed to acquire Redis lock")

		return null
	}
}

export async function releaseLock(key: string, token: string): Promise<void> {
	try {
		await redis.eval(
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
		logger.warn({ err, key }, "Failed to release Redis lock")
	}
}

export async function* scanKeys(
	pattern: string,
	count: number
): AsyncIterable<string[]> {
	const stream = redis.scanStream({
		match: pattern,
		count,
	})

	for await (const keys of stream) {
		yield keys as string[]
	}
}

let closePromise: Promise<void> | undefined

export function closeRedis(): Promise<void> {
	closePromise ??= (async () => {
		if (redis.status === "wait" || redis.status === "end") {
			redis.disconnect()
			return
		}

		try {
			await redis.quit()
		} catch (err) {
			logger.error({ err }, "Redis graceful shutdown failed")

			redis.disconnect()
		}
	})()

	return closePromise
}
