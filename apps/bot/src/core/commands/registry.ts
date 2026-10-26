import { env } from "@workspace/env"
import { type Client, Collection } from "discord.js"
import type { CommandModule } from "@/core/commands/types"
import { loadFeatureModules } from "@/core/loaders/feature-modules"
import { logger } from "@/core/logger"

type CommandPayload = ReturnType<CommandModule["data"]["toJSON"]>

export async function deployCommands(
	client: Client,
	payload: CommandPayload[],
	devGuildId = env.DISCORD_DEV_GUILD_ID
): Promise<void> {
	if (devGuildId) {
		const guild = client.guilds.cache.get(devGuildId)

		if (!guild) {
			logger.error(
				{ guildId: devGuildId },
				"DISCORD_DEV_GUILD_ID set but guild is not cached; skipping deployment"
			)
			return
		}

		await guild.commands.set(payload)
		logger.info(
			{ count: payload.length, guildId: devGuildId },
			"Deployed commands to dev guild"
		)
		return
	}

	if (!client.application) {
		logger.warn("client.application is undefined; skipping deployment")
		return
	}

	await client.application.commands.set(payload)
	logger.info({ count: payload.length }, "Deployed commands to Discord")
}

export async function registerCommands(client: Client): Promise<void> {
	client.commands = new Collection<string, CommandModule>()

	const modules = await loadFeatureModules("commands")
	let total = 0

	for (const { mod, filePath } of modules) {
		const command = mod as Partial<CommandModule>

		if (!command.data || typeof command.execute !== "function") {
			logger.warn(
				{ filePath },
				"Skipping command file: missing 'data' or 'execute' export"
			)

			continue
		}

		client.commands.set(command.data.name, {
			data: command.data,
			cooldownSeconds: command.cooldownSeconds,
			execute: command.execute,
		})

		total++

		logger.debug({ command: command.data.name, filePath }, "Loaded command")
	}

	logger.info({ count: total }, "Cached commands in client")

	const payload = client.commands.map((cmd) => cmd.data.toJSON())

	await deployCommands(client, payload)
}
