import { type APIEmbed, EmbedBuilder } from "discord.js"
import type {
	ActivityTotal,
	CurrentActivity,
	HistorySession,
} from "@/features/activity/types"
import { formatActivityRow } from "@/features/activity/utils/formatting"
import { COLORS } from "@/shared/constants/colors"
import { ACTIVITY_EMBED_ROWS } from "@/shared/constants/pagination"
import { splitIntoChunks } from "@/shared/utils/array"
import { formatTime } from "@/shared/utils/time"

export function buildActivityPages(
	username: string,
	pastActivities: ActivityTotal[],
	currentActivities: CurrentActivity[]
): {
	embeds: APIEmbed[]
	searchTerms: string[]
} {
	const totalTime = pastActivities.reduce(
		(total, activity) => total + (activity.timePlayed ?? 0),
		0
	)

	const currentActivityLines = currentActivities.map((activity) =>
		formatActivityRow(activity.activityName, {
			timestamp: activity.startedAt,
		})
	)

	const firstPageLines: string[] = [
		`**Total time tracked:** ${formatTime(totalTime)}`,
		"",
	]

	if (currentActivityLines.length > 0) {
		firstPageLines.push(
			"**Current activities:**",
			...currentActivityLines,
			""
		)
	}

	firstPageLines.push("**All activities:**")

	const availablePastActivityLines = Math.max(
		0,
		ACTIVITY_EMBED_ROWS - firstPageLines.length
	)

	const firstPageActivities = pastActivities.slice(
		0,
		availablePastActivityLines
	)

	if (firstPageActivities.length > 0) {
		firstPageLines.push(
			...firstPageActivities.map((activity) =>
				formatActivityRow(activity.activityName, {
					durationSeconds: activity.timePlayed,
					timestamp: activity.lastPlayed,
				})
			)
		)
	} else if (pastActivities.length === 0) {
		firstPageLines.push("*No activities tracked.*")
	}

	const embeds: APIEmbed[] = [
		new EmbedBuilder()
			.setColor(COLORS.primary)
			.setTitle(`${username}'s Activity`)
			.setDescription(firstPageLines.join("\n"))
			.toJSON(),
	]

	const searchTerms: string[] = [
		firstPageActivities.map((activity) => activity.activityName).join(" "),
	]

	const remainingActivities = pastActivities.slice(firstPageActivities.length)

	for (const activityChunk of splitIntoChunks(
		remainingActivities,
		ACTIVITY_EMBED_ROWS
	)) {
		embeds.push(
			new EmbedBuilder()
				.setColor(COLORS.primary)
				.setTitle(`${username}'s Activity`)
				.setDescription(
					activityChunk
						.map((activity) =>
							formatActivityRow(activity.activityName, {
								durationSeconds: activity.timePlayed,
								timestamp: activity.lastPlayed,
							})
						)
						.join("\n")
				)
				.toJSON()
		)

		searchTerms.push(
			activityChunk.map((activity) => activity.activityName).join(" ")
		)
	}

	return {
		embeds,
		searchTerms,
	}
}

export function buildHistoryPage(
	username: string,
	sessions: HistorySession[],
	pageIndex: number,
	totalPages?: number
): APIEmbed {
	return new EmbedBuilder()
		.setColor(COLORS.primary)
		.setTitle(`${username}'s Activity History`)
		.setDescription(
			sessions
				.map((session) =>
					formatActivityRow(session.activityName, {
						durationSeconds: session.durationSeconds,
						timestamp: session.endedAt,
					})
				)
				.join("\n")
		)
		.setFooter({
			text: `Page ${pageIndex + 1} / ${totalPages}`,
		})
		.toJSON()
}
