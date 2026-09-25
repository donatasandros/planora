import { Events, MessageFlags } from "discord.js"
import { logger } from "@/core/logger"
import { defineEvent } from "@/core/utils/define-event"

export const interactionCreateListeners = [
	defineEvent(Events.InteractionCreate, {
		priority: 10,
		async execute(client, interaction) {
			if (!interaction.isChatInputCommand()) {
				return
			}

			const command = client.commands.get(interaction.commandName)

			if (!command) {
				logger.warn(
					{
						command: interaction.commandName,
						userId: interaction.user.id,
					},
					"Received unregistered command interaction"
				)
				return
			}

			const start = performance.now()

			try {
				await command.execute(client, interaction)
				const duration = Math.round(performance.now() - start)

				logger.info(
					{
						command: interaction.commandName,
						userId: interaction.user.id,
						guildId: interaction.guildId ?? "DM",
						duration,
					},
					"Command executed"
				)
			} catch (err) {
				const duration = Math.round(performance.now() - start)

				logger.error(
					{
						err,
						command: interaction.commandName,
						userId: interaction.user.id,
						guildId: interaction.guildId ?? "DM",
						duration,
					},
					"Command execution failed"
				)

				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({
						content: "There was an error running this command!",
						flags: MessageFlags.Ephemeral,
					})
				} else {
					await interaction.reply({
						content: "There was an error running this command!",
						flags: MessageFlags.Ephemeral,
					})
				}
			}
		},
	}),
]
