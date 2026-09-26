import { db, eq, usersTable } from "@workspace/db"
import { claim, deleteKey, getJson, setJson } from "@workspace/redis"
import { logger } from "@/core/logger"
import { USER_REDIS_KEYS } from "@/features/system/constants"
import type { User, UserResolution } from "@/features/system/types"

const USER_CACHE_TTL_SECONDS = 60
const USER_REGISTRATION_CLAIM_TTL_SECONDS = 24 * 60 * 60 // 24 hours

function createDefaultUser(userId: string): User {
	return {
		id: userId,
		isTrackingEnabled: true,
		isProfilePrivate: false,
		isBlacklisted: false,
	}
}

function isUser(value: unknown): value is User {
	if (!value || typeof value !== "object") {
		return false
	}

	const candidate = value as Record<string, unknown>

	return (
		typeof candidate.id === "string" &&
		typeof candidate.isTrackingEnabled === "boolean" &&
		typeof candidate.isProfilePrivate === "boolean" &&
		typeof candidate.isBlacklisted === "boolean"
	)
}

async function registerUserEventually(userId: string): Promise<void> {
	const registrationClaimKey = USER_REDIS_KEYS.REGISTRATION(userId)

	const shouldRegister = await claim(
		registrationClaimKey,
		USER_REGISTRATION_CLAIM_TTL_SECONDS
	)

	if (!shouldRegister) {
		return
	}

	try {
		await db.insert(usersTable).values({ id: userId }).onConflictDoNothing()
	} catch (err) {
		logger.error({ err, userId }, "Failed to lazily register user")

		await deleteKey(registrationClaimKey)
	}
}

export async function invalidateUserCache(userId: string): Promise<void> {
	await deleteKey(USER_REDIS_KEYS.CACHE(userId))
}

export async function resolveUser(userId: string): Promise<UserResolution> {
	const cacheKey = USER_REDIS_KEYS.CACHE(userId)
	const cached = await getJson<unknown>(cacheKey)

	if (cached !== null) {
		if (isUser(cached)) {
			return { kind: "found", user: cached }
		}

		logger.warn({ userId }, "Discarding invalid cached user record")

		await deleteKey(cacheKey)
	}

	try {
		const [user] = await db
			.select({
				id: usersTable.id,
				isTrackingEnabled: usersTable.isTrackingEnabled,
				isProfilePrivate: usersTable.isProfilePrivate,
				isBlacklisted: usersTable.isBlacklisted,
			})
			.from(usersTable)
			.where(eq(usersTable.id, userId))
			.limit(1)

		if (user) {
			await setJson(cacheKey, user, USER_CACHE_TTL_SECONDS)

			return { kind: "found", user }
		}

		const defaultUser = createDefaultUser(userId)

		await setJson(cacheKey, defaultUser, USER_CACHE_TTL_SECONDS)

		void registerUserEventually(userId)

		return { kind: "absent", user: defaultUser }
	} catch (err) {
		logger.error({ err, userId }, "Failed to resolve user")

		return { kind: "unavailable" }
	}
}
