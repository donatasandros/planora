import {
	type ButtonInteraction,
	ComponentType,
	type Message,
	MessageFlags,
} from "discord.js"
import { logger } from "@/core/logger"
import { replyInteractionError } from "@/shared/utils/interaction"

type CollectorControls = {
	resetTimer: () => void
	stop: (reason?: string) => void
}

type PaginationCollectorOptions = {
	ownerId: string
	message: Message
	time: number
	onCollect: (
		buttonInteraction: ButtonInteraction,
		controls: CollectorControls
	) => Promise<void>
}

export function createPaginationCollector({
	ownerId,
	message,
	time,
	onCollect,
}: PaginationCollectorOptions) {
	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time,
	})

	collector.on("collect", async (buttonInteraction) => {
		try {
			if (buttonInteraction.user.id !== ownerId) {
				await buttonInteraction.reply({
					content: "Only the original user can interact with this button.",
					flags: MessageFlags.Ephemeral,
				})

				return
			}

			await onCollect(buttonInteraction, {
				resetTimer: () => collector.resetTimer(),
				stop: (reason) => collector.stop(reason),
			})
		} catch (err) {
			logger.error(
				{
					err,
					userId: buttonInteraction.user.id,
					customId: buttonInteraction.customId,
				},
				"Pagination button handler failed"
			)

			await replyInteractionError(buttonInteraction)
		}
	})

	collector.on("end", async () => {
		await message
			.edit({
				components: [],
			})
			.catch(() => undefined)
	})

	return collector
}
