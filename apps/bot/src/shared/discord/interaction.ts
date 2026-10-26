import { MessageFlags, type RepliableInteraction } from "discord.js"

export const INTERACTION_ERROR_MESSAGE = "Something went wrong"
export const INTERACTION_COOLDOWN_MESSAGE = "Slow down a little."

async function replyEphemeral(
	interaction: RepliableInteraction,
	content: string
): Promise<void> {
	try {
		if (interaction.deferred || interaction.replied) {
			await interaction.followUp({
				content,
				flags: MessageFlags.Ephemeral,
			})
		} else {
			await interaction.reply({
				content,
				flags: MessageFlags.Ephemeral,
			})
		}
	} catch {}
}

export async function replyError(
	interaction: RepliableInteraction
): Promise<void> {
	return replyEphemeral(interaction, INTERACTION_ERROR_MESSAGE)
}

export function replyCooldown(
	interaction: RepliableInteraction
): Promise<void> {
	return replyEphemeral(interaction, INTERACTION_COOLDOWN_MESSAGE)
}
