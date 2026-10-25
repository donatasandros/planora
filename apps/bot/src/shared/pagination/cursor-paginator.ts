import { componentRegistry } from "@/core/components/registry"
import { TIMEOUT_MS } from "@/shared/constants/pagination"
import {
	applyCursorButtonState,
	buildCursorActionRow,
	buildCursorButtons,
} from "@/shared/pagination/buttons"
import { buildPaginationIds, PAGINATION_FEATURE } from "@/shared/pagination/ids"
import type {
	CursorPage,
	CursorPaginationParams,
} from "@/shared/pagination/types"

export async function paginateCursor<T>({
	interaction,
	loadPage,
	renderPage,
	emptyEmbed,
	time = TIMEOUT_MS,
}: CursorPaginationParams<T>) {
	const firstPage = await loadPage(null)

	const totalPages = firstPage.totalPages

	if (firstPage.items.length === 0) {
		return interaction.editReply({
			embeds: [emptyEmbed],
			components: [],
		})
	}

	if (firstPage.nextCursor === null) {
		return interaction.editReply({
			embeds: [renderPage(firstPage.items, 0, totalPages)],
			components: [],
		})
	}

	const pages: CursorPage<T>[] = [firstPage]
	let index = 0
	let loading = false

	const ids = buildPaginationIds()
	const buttons = buildCursorButtons(ids)

	applyCursorButtonState(buttons, index, firstPage.nextCursor)

	const actionRow = buildCursorActionRow(buttons)

	const message = await interaction.editReply({
		embeds: [renderPage(firstPage.items, index, totalPages)],
		components: [actionRow],
	})

	function updateButtonState(): void {
		const currentPage = pages[index]

		applyCursorButtonState(buttons, index, currentPage.nextCursor)
	}

	async function render(): Promise<void> {
		updateButtonState()

		await message.edit({
			embeds: [renderPage(pages[index].items, index, totalPages)],
			components: [actionRow],
		})
	}

	componentRegistry.openView({
		feature: PAGINATION_FEATURE,
		sessionId: ids.sessionId,
		ownerId: interaction.user.id,
		message,
		time,
		onButton: async (buttonInteraction, { resetTimer, stop }) => {
			if (loading) {
				await buttonInteraction.deferUpdate()
				return
			}

			resetTimer()

			if (buttonInteraction.customId === ids.previous) {
				await buttonInteraction.deferUpdate()

				if (index > 0) {
					index -= 1
					await render()
				}

				return
			}

			if (buttonInteraction.customId !== ids.next) {
				await buttonInteraction.deferUpdate()
				return
			}

			const currentPage = pages[index]

			if (!currentPage.nextCursor) {
				await buttonInteraction.deferUpdate()
				return
			}

			await buttonInteraction.deferUpdate()

			if (pages[index + 1]) {
				index += 1
				await render()
				return
			}

			loading = true

			try {
				const nextPage = await loadPage(currentPage.nextCursor)

				pages.push(nextPage)
				index += 1

				await render()
			} catch {
				await message
					.edit({
						content: "Failed to load the next page.",
						embeds: [],
						components: [],
					})
					.catch(() => undefined)

				stop("load-failed")
			} finally {
				loading = false
			}
		},
	})

	return message
}
