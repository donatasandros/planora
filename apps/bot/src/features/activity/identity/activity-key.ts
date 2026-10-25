import type { Activity } from "discord.js"

export function getActivityKey(activity: Activity): string {
	return [activity.type, activity.applicationId ?? "", activity.name].join(":")
}
