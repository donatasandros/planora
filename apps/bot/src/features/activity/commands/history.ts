import {
	type APIEmbed,
	type ChatInputCommandInteraction,
	type Client,
	EmbedBuilder,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js"
import { logger } from "@/core/logger"
import { getActivityHistoryPage } from "@/features/activity/services/history"
import type { HistorySession } from "@/features/activity/types"
import { formatActivityRow } from "@/features/activity/utils/formatting"
import { resolveProfileVisibility } from "@/features/system"
import { COLORS } from "@/shared/constants/colors"
import paginate from "@/shared/utils/pagination"

export const data = new SlashCommandBuilder()
	.setName("history")
	.setDescription("View activity session history.")
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("The user whose activity history you want to view")
			.setRequired(false)
	)

function buildHistoryEmbed(
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
		await paginate<HistorySession>({
			mode: "cursor",
			interaction,
			loadPage: async (cursor) => {
				const page = await getActivityHistoryPage(user.id, cursor)

				return {
					items: page.sessions,
					nextCursor: page.nextCursor,
					totalPages: page.totalPages,
				}
			},
			renderPage: (sessions, pageIndex, totalPages) =>
				buildHistoryEmbed(user.username, sessions, pageIndex, totalPages),
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
