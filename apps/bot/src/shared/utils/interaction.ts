import { MessageFlags, type RepliableInteraction } from "discord.js"

export async function replyInteractionError(
	interaction: RepliableInteraction
): Promise<void> {
	try {
		const content = "Something went wrong"

		if (interaction.deferred || interaction.replied) {
			await interaction.followUp({ content, flags: MessageFlags.Ephemeral })
		} else {
			await interaction.reply({ content, flags: MessageFlags.Ephemeral })
		}
	} catch {}
}
