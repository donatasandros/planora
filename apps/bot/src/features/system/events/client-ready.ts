import { type Client, Events } from "discord.js"
import { registerCommands } from "@/core/commands/registry"
import { defineEvent } from "@/core/events/define-event"
import { logger } from "@/core/logger"

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
