import { ACTIVITY_REDIS_KEYS } from "@/features/activity/constants"

export const LAST_FINGERPRINT_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

type FingerprintStoreDeps = {
	get: <T>(key: string) => Promise<T | null>
	set: (key: string, value: unknown, ttlSeconds: number) => Promise<void>
}

type StoredFingerprint = { hash: string }

export function createLastFingerprintStore({ get, set }: FingerprintStoreDeps) {
	return {
		async read(userId: string): Promise<string | null> {
			const stored = await get<StoredFingerprint>(
				ACTIVITY_REDIS_KEYS.LAST_FINGERPRINT(userId)
			)

			return typeof stored?.hash === "string" ? stored.hash : null
		},

		async commit(userId: string, hash: string): Promise<void> {
			await set(
				ACTIVITY_REDIS_KEYS.LAST_FINGERPRINT(userId),
				{ hash },
				LAST_FINGERPRINT_TTL_SECONDS
			)
		},
	}
}

export function isDuplicatePresence(
	lastHash: string | null,
	incomingHash: string
): boolean {
	return lastHash === incomingHash
}
