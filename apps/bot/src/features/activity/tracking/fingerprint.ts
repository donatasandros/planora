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
