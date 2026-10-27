import { formatTime } from "@/shared/utils/time"
import { discordTimestamp } from "@/shared/utils/timestamps"

type ActivityRowOptions = {
	durationSeconds?: number | null
	timestamp?: number | null
}

export function formatActivityRow(
	activityName: string,
	options: ActivityRowOptions = {}
): string {
	const name = `\`${activityName.replaceAll("`", "'")}\``
	const time = options.durationSeconds
		? `- ${formatTime(options.durationSeconds)}`
		: ""
	const date = options.timestamp
		? `- ${discordTimestamp(options.timestamp)}`
		: "- now"

	return ["**•**", name, time, date].filter(Boolean).join(" ")
}
