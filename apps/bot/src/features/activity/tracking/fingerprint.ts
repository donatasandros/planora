import { createHash } from "node:crypto"
import type { Presence } from "discord.js"

export function getPresenceFingerprint(presence: Presence): string {
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

export function hashFingerprint(value: string): string {
	return createHash("sha256").update(value).digest("hex")
}

export type FingerprintMemo = {
	isMemoized(userId: string, hash: string): boolean
	remember(userId: string, hash: string): void
}

type MemoEntry = {
	hash: string
	expiresAt: number
}

export function createFingerprintMemo(
	ttlMs: number,
	maxEntries: number,
	now: () => number = Date.now
): FingerprintMemo {
	const entries = new Map<string, MemoEntry>()

	function isMemoized(userId: string, hash: string): boolean {
		const entry = entries.get(userId)

		if (!entry) {
			return false
		}

		if (entry.expiresAt <= now() || entry.hash !== hash) {
			entries.delete(userId)

			return false
		}

		return true
	}

	function remember(userId: string, hash: string): void {
		if (entries.size >= maxEntries) {
			const oldest = entries.keys().next()

			if (!oldest.done) {
				entries.delete(oldest.value)
			}
		}

		entries.set(userId, {
			hash,
			expiresAt: now() + ttlMs,
		})
	}

	return { isMemoized, remember }
}
