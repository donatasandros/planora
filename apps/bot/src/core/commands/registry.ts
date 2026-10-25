import { type Client, Collection } from "discord.js"
import type { CommandModule } from "@/core/commands/types"
import { loadFeatureModules } from "@/core/loaders/feature-modules"
import { logger } from "@/core/logger"

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
			execute: command.execute,
		})

		total++

		logger.debug({ command: command.data.name, filePath }, "Loaded command")
	}

	logger.info({ count: total }, "Cached commands in client")

	if (!client.application) {
		logger.warn("client.application is undefined; skipping deployment")
		return
	}

	const payload = client.commands.map((cmd) => cmd.data.toJSON())

	await client.application.commands.set(payload)

	logger.info({ count: payload.length }, "Deployed commands to Discord")
}
