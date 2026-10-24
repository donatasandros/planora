import { TIMEOUT_MS } from "@/shared/constants/pagination"
import {
	applyStaticButtonState,
	buildStaticActionRow,
	buildStaticButtons,
} from "@/shared/pagination/buttons"
import { createPaginationCollector } from "@/shared/pagination/collector"
import { buildPaginationIds } from "@/shared/pagination/ids"
import { promptForSearch } from "@/shared/pagination/search-modal"
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

	createPaginationCollector({
		ownerId: interaction.user.id,
		message,
		time,
		onCollect: async (buttonInteraction, { resetTimer }) => {
			resetTimer()

			if (buttonInteraction.customId === ids.search) {
				if (!search) {
					return
				}

				const outcome = await promptForSearch({
					buttonInteraction,
					ownerId: interaction.user.id,
					ids,
					search,
					time,
				})

				if (outcome.kind === "switched") {
					index = outcome.pageIndex

					await render()
				}

				return
			}

			await buttonInteraction.deferUpdate()

			if (changePage(buttonInteraction.customId)) {
				await render()
			}
		},
	})

	return message
}
