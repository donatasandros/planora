import {
	type APIEmbed,
	type ChatInputCommandInteraction,
	type Client,
	EmbedBuilder,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js"
import { logger } from "@/core/logger"
import { getActivityTotals } from "@/features/activity/services/history"
import { getCurrentActivities } from "@/features/activity/services/sessions"
import type { ActivityTotal, CurrentActivity } from "@/features/activity/types"
import { formatActivityRow } from "@/features/activity/utils/formatting"
import { resolveProfileVisibility } from "@/features/system"
import { COLORS } from "@/shared/constants/colors"
import { ITEMS_PER_PAGE } from "@/shared/constants/pagination"
import { splitIntoChunks } from "@/shared/utils/array"
import paginate from "@/shared/utils/pagination"
import { formatTime } from "@/shared/utils/time"

export const data = new SlashCommandBuilder()
	.setName("activity")
	.setDescription("View user activity statistics.")
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("The user to check activity for")
			.setRequired(false)
	)

function buildActivityPages(
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
		ITEMS_PER_PAGE - firstPageLines.length
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
		[...firstPageActivities.map((activity) => activity.activityName)].join(
			" "
		),
	]

	const remainingActivities = pastActivities.slice(firstPageActivities.length)

	for (const activityChunk of splitIntoChunks(
		remainingActivities,
		ITEMS_PER_PAGE
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

export async function execute(
	_client: Client,
	interaction: ChatInputCommandInteraction
) {
	const user = interaction.options.getUser("user") ?? interaction.user
	const visibility = await resolveProfileVisibility(
		interaction.user.id,
		user.id,
		{
			isDirectMessage: interaction.guild === null,
		}
	)

	if (!visibility.allowed) {
		return interaction.reply({
			content:
				visibility.reason === "private"
					? `${user.username}'s profile is private.`
					: "Could not verify access to this profile, please try again later.",
			flags: MessageFlags.Ephemeral,
		})
	}

	await interaction.deferReply({
		flags: visibility.ephemeral ? MessageFlags.Ephemeral : undefined,
	})

	try {
		const [pastActivities, currentActivities] = await Promise.all([
			getActivityTotals(user.id),
			getCurrentActivities(interaction, user.id),
		])

		const { embeds, searchTerms } = buildActivityPages(
			user.username,
			pastActivities,
			currentActivities
		)

		await paginate({
			interaction,
			embeds,
			search: {
				terms: searchTerms,
				title: "Search activity",
				label: "Activity name",
				placeholder: "e.g. Minecraft",
				notFoundMessage: "Activity not found.",
			},
		})
	} catch (err) {
		logger.error(
			{ err, userId: user.id },
			"Failed to load activity statistics"
		)

		await interaction.editReply({
			content: "Failed to load activity statistics.",
			embeds: [],
			components: [],
		})
	}
}
