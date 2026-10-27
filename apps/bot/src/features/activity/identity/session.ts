import { randomUUID } from "node:crypto"
import type { Activity } from "discord.js"
import {
	getActivityIdentity,
	hashActivityIdentity,
} from "@/features/activity/identity/activity-key"
import type { ActiveActivitySession } from "@/features/activity/types"

export function getActivityStartTime(activity: Activity): number {
	const timestamp = activity.timestamps?.start

	if (timestamp instanceof Date) {
		return Math.floor(timestamp.getTime() / 1000)
	}

	return Math.floor(Date.now() / 1000)
}

export function buildActivitySession(
	activity: Activity,
	startedAt: number
): ActiveActivitySession {
	const identity = getActivityIdentity(activity)

	return {
		id: randomUUID(),
		activityKey: hashActivityIdentity(identity),
		activityName: identity.name,
		activityType: identity.type,
		applicationId: identity.applicationId,
		isCustom: identity.isCustom,
		startedAt,
		lastSeenAt: Math.floor(Date.now() / 1000),
	}
}
