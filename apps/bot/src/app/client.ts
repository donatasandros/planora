import { Client, Events, IntentsBitField, Partials } from "discord.js"
import { logger } from "@/core/logger"

export function createClient(): Client {
	const client = new Client({
		intents: [
			IntentsBitField.Flags.Guilds,
			IntentsBitField.Flags.GuildPresences,
			IntentsBitField.Flags.GuildMembers,
			IntentsBitField.Flags.GuildMessages,
			IntentsBitField.Flags.MessageContent,
			IntentsBitField.Flags.GuildMessageReactions,
		],
		partials: [
			Partials.Channel,
			Partials.Message,
			Partials.Reaction,
			Partials.User,
		],
	})

	client.on(Events.Error, (err) => {
		logger.error({ err }, "Discord client error")
	})

	return client
}
