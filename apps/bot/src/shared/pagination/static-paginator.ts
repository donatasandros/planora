import { MessageFlags } from "discord.js"
import { componentRegistry } from "@/core/components/registry"
import { TIMEOUT_MS } from "@/shared/constants/pagination"
import {
	applyStaticButtonState,
	buildStaticActionRow,
	buildStaticButtons,
} from "@/shared/pagination/buttons"
import { buildPaginationIds, PAGINATION_FEATURE } from "@/shared/pagination/ids"
import {
	findSearchPage,
	showSearchModal,
} from "@/shared/pagination/search-modal"
import type { StaticPaginationParams } from "@/shared/pagination/types"

export async function paginateStatic({
	interaction,
	embeds,
	search,
	time = TIMEOUT_MS,
}: StaticPaginationParams) {
	if (embeds.length === 0) {
		throw new Error("Pagination requires at least one page")
	}

	if (embeds.length === 1) {
		return interaction.editReply({ embeds, components: [] })
	}

	const ids = buildPaginationIds()
	const buttons = buildStaticButtons(ids)

	applyStaticButtonState(buttons, 0, embeds.length)

	const actionRow = buildStaticActionRow(buttons, Boolean(search))

	let index = 0

	const message = await interaction.editReply({
		embeds: [embeds[index]],
		components: [actionRow],
	})

	function changePage(customId: string): boolean {
		switch (customId) {
			case ids.first:
				index = 0
				break

			case ids.previous:
				index = Math.max(index - 1, 0)
				break

			case ids.next:
				index = Math.min(index + 1, embeds.length - 1)
				break

			case ids.last:
				index = embeds.length - 1
				break

			default:
				return false
		}

		return true
	}

	async function render(): Promise<void> {
		applyStaticButtonState(buttons, index, embeds.length)

		await message.edit({
			embeds: [embeds[index]],
			components: [actionRow],
		})
	}

	componentRegistry.openView({
		feature: PAGINATION_FEATURE,
		sessionId: ids.sessionId,
		ownerId: interaction.user.id,
		message,
		time,
		onButton: async (buttonInteraction, { resetTimer }) => {
			resetTimer()

			if (buttonInteraction.customId === ids.search) {
				if (search) {
					await showSearchModal({ buttonInteraction, ids, search })
				}
				return
			}

			await buttonInteraction.deferUpdate()

			if (changePage(buttonInteraction.customId)) {
				await render()
			}
		},
		onModal: async (modalInteraction) => {
			if (!search || modalInteraction.customId !== ids.modal) {
				return
			}

			const query = modalInteraction.fields.getTextInputValue(ids.input)
			const pageIndex = findSearchPage(search.terms, query)

			if (pageIndex === null) {
				await modalInteraction.reply({
					content: search.notFoundMessage,
					flags: MessageFlags.Ephemeral,
				})
				return
			}

			await modalInteraction.deferUpdate()
			index = pageIndex
			await render()
		},
	})

	return message
}
