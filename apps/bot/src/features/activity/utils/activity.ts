import { randomUUID } from "node:crypto"
import { type Activity, ActivityType } from "discord.js"
import { ACTIVITY_REDIS_KEYS } from "@/features/activity/constants"
import type { ActiveActivitySession } from "@/features/activity/types"

export function getActiveSessionsKey(userId: string): string {
	return `${ACTIVITY_REDIS_KEYS.ACTIVE_SESSION_PREFIX}${userId}`
}

export function getActivityKey(activity: Activity): string {
	return [activity.type, activity.applicationId ?? "", activity.name].join(":")
}

export function getActivityStartTime(activity: Activity): number {
	const timestamp = activity.timestamps?.start

	if (timestamp instanceof Date) {
		return Math.floor(timestamp.getTime() / 1000)
	}

	return Math.floor(Date.now() / 1000)
}

export function isCustomActivity(activity: Activity): boolean {
	return activity.type === ActivityType.Custom
}

export function buildActivitySession(
	activity: Activity,
	startedAt: number
): ActiveActivitySession {
	return {
		id: randomUUID(),
		activityKey: getActivityKey(activity),
		activityName: activity.name,
		activityType: activity.type,
		applicationId: activity.applicationId ?? null,
		isCustom: isCustomActivity(activity),
		startedAt,
		lastSeenAt: Math.floor(Date.now() / 1000),
	}
}
