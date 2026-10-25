import {
	type ChatInputCommandInteraction,
	type Client,
	MessageFlags,
} from "discord.js"

export async function isApplicationOwner(
	client: Client,
	userId: string
): Promise<boolean> {
	const application = client.application

	if (!application) {
		return false
	}

	let owner = application.owner

	if (!owner) {
		try {
			owner = (await application.fetch()).owner
		} catch {
			return false
		}
	}

	if (!owner) {
		return false
	}

	const ownerId = "ownerId" in owner ? owner.ownerId : owner.id

	return ownerId === userId
}

export async function ensureApplicationOwner(
	client: Client,
	interaction: ChatInputCommandInteraction
): Promise<boolean> {
	if (await isApplicationOwner(client, interaction.user.id)) {
		return true
	}

	await interaction.reply({
		content: "Not available.",
		flags: MessageFlags.Ephemeral,
	})

	return false
}
