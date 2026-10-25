import { type Client, Events } from "discord.js"
import { registerCommands } from "@/core/commands/registry"
import { logger } from "@/core/logger"
import { defineEvent } from "@/core/utils/define-event"

export const clientReadyListeners = [
	defineEvent(Events.ClientReady, {
		priority: 10,
		execute: async (client: Client) => {
			await registerCommands(client)
		},
	}),
	defineEvent(Events.ClientReady, {
		priority: 100,
		execute(client: Client) {
			logger.info(
				{
					tag: client.user?.tag,
					id: client.user?.id,
					guilds: client.guilds.cache.size,
				},
				"Bot client ready"
			)
		},
	}),
]
