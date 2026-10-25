import type {
	ActiveActivitySession,
	ActiveActivitySessions,
} from "@/features/activity/types"

export type SessionPartition = {
	stale: [string, ActiveActivitySession][]
	active: ActiveActivitySessions
}

export function partitionStaleSessions(
	sessions: ActiveActivitySessions,
	now: number,
	staleSeconds: number
): SessionPartition {
	const stale: [string, ActiveActivitySession][] = []
	const active: ActiveActivitySessions = {}

	for (const [key, session] of Object.entries(sessions)) {
		if (now - session.lastSeenAt > staleSeconds) {
			stale.push([key, session])
		} else {
			active[key] = session
		}
	}

	return { stale, active }
}
