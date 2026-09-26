import { db, usersTable } from "@workspace/db"
import {
	type ChatInputCommandInteraction,
	type Client,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js"
import { logger } from "@/core/logger"
import {
	invalidateUserCache,
	resolveUser,
} from "@/features/system/services/users"

export const data = new SlashCommandBuilder()
	.setName("privacy")
	.setDescription("Control who can see your activity data.")
	.addStringOption((option) =>
		option
			.setName("visibility")
			.setDescription("Who can see your activity data")
			.addChoices(
				{
					name: "Public",
					value: "public",
				},
				{
					name: "Private",
					value: "private",
				}
			)
			.setRequired(false)
	)

export async function execute(
	_client: Client,
	interaction: ChatInputCommandInteraction
) {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral })

	const userId = interaction.user.id
	const requested = interaction.options.getString("visibility")

	try {
		if (requested === null) {
			const resolution = await resolveUser(userId)

			if (resolution.kind === "unavailable") {
				await interaction.editReply({
					content: "Couldn't reach the database, please try again later.",
				})

				return
			}

			const current = resolution.user.isProfilePrivate ? "Private" : "Public"

			await interaction.editReply({
				content:
					`Your activity data is currently **${current}**.\n` +
					"Use `/privacy visibility:Public` or `/privacy visibility:Private` to change it.",
			})

			return
		}

		const isProfilePrivate = requested === "private"

		await db
			.insert(usersTable)
			.values({ id: userId, isProfilePrivate })
			.onConflictDoUpdate({
				target: usersTable.id,
				set: { isProfilePrivate },
			})

		await invalidateUserCache(userId)

		await interaction.editReply({
			content: isProfilePrivate
				? "Your profile is now **private**. Nobody else can view your activity data."
				: "Your profile is now **public**.",
		})
	} catch (err) {
		logger.error({ err, userId }, "Failed to update privacy settings")

		await interaction.editReply({
			content:
				"An error occurred while updating your privacy settings. Please try again later.",
		})
	}
}
