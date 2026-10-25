import { MessageFlags, type RepliableInteraction } from "discord.js"

export const INTERACTION_ERROR_MESSAGE = "Something went wrong"

export async function replyError(
	interaction: RepliableInteraction
): Promise<void> {
	try {
		if (interaction.deferred || interaction.replied) {
			await interaction.followUp({
				content: INTERACTION_ERROR_MESSAGE,
				flags: MessageFlags.Ephemeral,
			})
		} else {
			await interaction.reply({
				content: INTERACTION_ERROR_MESSAGE,
				flags: MessageFlags.Ephemeral,
			})
		}
	} catch {}
}
