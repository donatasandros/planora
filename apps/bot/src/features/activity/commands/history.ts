import {
	type ChatInputCommandInteraction,
	type Client,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js"
import { logger } from "@/core/logger"
import { buildHistoryPage } from "@/features/activity/reporting/pages"
import { getActivityHistoryPage } from "@/features/activity/services/history"
import type { HistorySession } from "@/features/activity/types"
import { resolveProfileVisibility } from "@/features/system"
import { COLORS } from "@/shared/constants/colors"
import { viewProfile } from "@/shared/discord/profile-view"
import paginate from "@/shared/pagination"

export const data = new SlashCommandBuilder()
	.setName("history")
	.setDescription("View activity session history.")
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("The user whose activity history you want to view")
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
		await paginate<HistorySession>({
			mode: "cursor",
			interaction,
			loadPage: async (cursor) => {
				const page = await getActivityHistoryPage(user.id, cursor)

				return {
					items: page.sessions,
					nextCursor: page.nextCursor,
				}
			},
			renderPage: (sessions, pageIndex) =>
				buildHistoryPage(user.username, sessions, pageIndex),
			emptyEmbed: new EmbedBuilder()
				.setColor(COLORS.primary)
				.setTitle(`${user.username}'s Activity History`)
				.setDescription("No completed activity sessions found.")
				.toJSON(),
		})
	} catch (err) {
		logger.error(
			{
				err,
				userId: user.id,
			},
			"Failed to load activity history"
		)

		await interaction.editReply({
			content: "Failed to load activity history.",
			embeds: [],
			components: [],
		})
	}
}
