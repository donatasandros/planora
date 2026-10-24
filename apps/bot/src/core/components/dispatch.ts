import {
	type ButtonInteraction,
	type Interaction,
	MessageFlags,
	type ModalSubmitInteraction,
} from "discord.js"
import {
	type ComponentRegistry,
	componentRegistry,
	runComponentHandler,
} from "@/core/components/registry"
import type { ComponentControls } from "@/core/components/types"
import { logger } from "@/core/logger"

const EXPIRED_MESSAGE = "This interaction expired."

const NOOP_CONTROLS: ComponentControls = {
	resetTimer: () => undefined,
	stop: () => undefined,
}

type ComponentInteraction = ButtonInteraction | ModalSubmitInteraction

type ParsedCustomId = {
	feature: string
	sessionId: string
}

export function parseCustomId(customId: string): ParsedCustomId | null {
	const [feature, sessionId] = customId.split(":")

	if (!feature || !sessionId) {
		return null
	}

	return { feature, sessionId }
}

async function replyExpired(interaction: ComponentInteraction): Promise<void> {
	try {
		const payload = {
			content: EXPIRED_MESSAGE,
			flags: MessageFlags.Ephemeral,
		} as const

		if (interaction.deferred || interaction.replied) {
			await interaction.followUp(payload)
		} else {
			await interaction.reply(payload)
		}
	} catch {}
}

function resolveOwnerId(interaction: ComponentInteraction): string | undefined {
	return interaction.message?.interactionMetadata?.user.id
}

export async function dispatchComponent(
	interaction: Interaction,
	registry: ComponentRegistry = componentRegistry
): Promise<boolean | undefined> {
	if (!interaction.isButton() && !interaction.isModalSubmit()) {
		return
	}

	const parsed = parseCustomId(interaction.customId)

	if (!parsed) {
		return
	}

	if (registry.getView(parsed.feature, parsed.sessionId)) {
		return
	}

	const instance = registry.match(
		parsed.feature,
		interaction.isButton() ? "button" : "modal",
		interaction.customId
	)

	if (!instance) {
		logger.debug(
			{ customId: interaction.customId, userId: interaction.user.id },
			"Component interaction has no handler"
		)

		await replyExpired(interaction)

		return false
	}

	await runComponentHandler(
		interaction,
		{
			ownerId: resolveOwnerId(interaction),
			ownerOnly: instance.ownerOnly ?? false,
		},
		async () => {
			if (interaction.isButton()) {
				await instance.onButton?.(interaction, NOOP_CONTROLS)
			} else {
				await instance.onModal?.(interaction)
			}
		}
	)

	return false
}
