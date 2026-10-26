import type { Activity } from "discord.js"
import { partitionStaleSessions } from "@/features/activity/sweeper/partition-sessions"
import { reconcileSessions } from "@/features/activity/tracking/reconcile"
import type { ActiveActivitySessions } from "@/features/activity/types"

export type PlannedFinish = {
	id: string
	endedAt: number
	durationSeconds: number
}

export type UserSweepPlan = {
	refreshed: number
	finish: PlannedFinish[]
	keep: ActiveActivitySessions
}

export function planUserSweep({
	sessions,
	activities,
	trackCustom,
	now,
	staleSeconds,
}: {
	sessions: ActiveActivitySessions
	activities: Activity[] | undefined
	trackCustom: boolean
	now: number
	staleSeconds: number
}): UserSweepPlan {
	const { stale, active } = partitionStaleSessions(sessions, now, staleSeconds)

	if (stale.length === 0) {
		return {
			refreshed: 0,
			finish: [],
			keep: sessions,
		}
	}

	const { kept, ended } = reconcileSessions({
		previous: Object.fromEntries(stale),
		activities: activities ?? [],
		trackCustom,
		now,
	})

	const keep: ActiveActivitySessions = { ...active }

	for (const session of kept) {
		keep[session.activityKey] = session
	}

	return {
		refreshed: kept.length,
		finish: ended.map((session) => ({
			id: session.id,
			endedAt: session.lastSeenAt,
			durationSeconds: Math.max(0, session.lastSeenAt - session.startedAt),
		})),
		keep,
	}
}
