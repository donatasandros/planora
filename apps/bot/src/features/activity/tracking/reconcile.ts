import { type Activity, ActivityType } from "discord.js"
import { getActivityKey } from "@/features/activity/identity/activity-key"
import type {
	ActiveActivitySession,
	ActiveActivitySessions,
} from "@/features/activity/types"

type ReconcileInput = {
	previous: ActiveActivitySessions
	activities: Activity[]
	trackCustom: boolean
	now: number
}

export type ReconcileResult = {
	started: Activity[]
	kept: ActiveActivitySession[]
	ended: ActiveActivitySession[]
}

export function reconcileSessions(input: ReconcileInput): ReconcileResult {
	const started: Activity[] = []
	const kept: ActiveActivitySession[] = []
	const currentKeys = new Set<string>()

	for (const activity of input.activities) {
		if (!input.trackCustom && activity.type === ActivityType.Custom) {
			continue
		}

		const activityKey = getActivityKey(activity)
		const existingSession = input.previous[activityKey]

		currentKeys.add(activityKey)

		if (existingSession) {
			kept.push({
				...existingSession,
				lastSeenAt: input.now,
			})
			continue
		}

		started.push(activity)
	}

	const ended = Object.entries(input.previous)
		.filter(([activityKey]) => !currentKeys.has(activityKey))
		.map(([, session]) => session)

	return { started, kept, ended }
}
