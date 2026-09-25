import { discordTimestamp } from "@/shared/utils/discord"
import { formatTime } from "@/shared/utils/time"

type ActivityRowOptions = {
	durationSeconds?: number | null
	timestamp?: number | null
}

export function escapeMarkdown(value: string): string {
	return value
		.replaceAll("\\", "\\\\")
		.replaceAll("`", "\\`")
		.replaceAll("*", "\\*")
		.replaceAll("_", "\\_")
}

export function formatActivityRow(
	activityName: string,
	options: ActivityRowOptions = {}
): string {
	const name = `\`${escapeMarkdown(activityName)}\``
	const time = options.durationSeconds
		? `- ${formatTime(options.durationSeconds)}`
		: ""
	const date = options.timestamp
		? `- ${discordTimestamp(options.timestamp)}`
		: "- Unknown"

	return `**•** ${name} ${time} ${date}`
}
