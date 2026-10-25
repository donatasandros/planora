import type {
	Client as BaseClient,
	ChatInputCommandInteraction,
	Collection,
	SlashCommandBuilder,
} from "discord.js"

export interface CommandModule {
	data: SlashCommandBuilder
	execute: (
		client: BaseClient,
		interaction: ChatInputCommandInteraction
	) => Promise<void>
}

declare module "discord.js" {
	interface Client {
		commands: Collection<string, CommandModule>
	}
}
