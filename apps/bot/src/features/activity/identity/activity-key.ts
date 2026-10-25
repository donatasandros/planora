import { createHash } from "node:crypto"
import { type Activity, ActivityType } from "discord.js"

export type ActivityIdentity = {
	type: number
	applicationId: string | null
	name: string
	isCustom: boolean
}

export function getActivityIdentity(activity: Activity): ActivityIdentity {
	return {
		type: activity.type,
		applicationId: activity.applicationId ?? null,
		name: activity.name,
		isCustom: activity.type === ActivityType.Custom,
	}
}

export function hashActivityIdentity(identity: ActivityIdentity): string {
	return createHash("sha256").update(JSON.stringify(identity)).digest("hex")
}

export function getActivityKey(activity: Activity): string {
	return hashActivityIdentity(getActivityIdentity(activity))
}
