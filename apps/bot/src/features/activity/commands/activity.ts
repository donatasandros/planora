import {
	type ChatInputCommandInteraction,
	type Client,
	SlashCommandBuilder,
} from "discord.js"
import { logger } from "@/core/logger"
import { buildActivityPages } from "@/features/activity/reporting/pages"
import { getActivityTotals } from "@/features/activity/services/history"
import { getCurrentActivities } from "@/features/activity/services/sessions"
import { resolveProfileVisibility } from "@/features/system"
import { viewProfile } from "@/shared/discord/profile-view"
import paginate from "@/shared/pagination"

export const cooldownSeconds = 5

export const data = new SlashCommandBuilder()
	.setName("activity")
	.setDescription("View user activity statistics.")
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("The user to check activity for")
			.setRequired(false)
	)

export async function execute(
	_client: Client,
	interaction: ChatInputCommandInteraction
) {
	const user = interaction.options.getUser("user") ?? interaction.user
	const view = await viewProfile({
		interaction,
		targetUserId: user.id,
		targetUsername: user.username,
		resolveVisibility: resolveProfileVisibility,
	})

	if (view.status === "denied") {
		return
	}

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
