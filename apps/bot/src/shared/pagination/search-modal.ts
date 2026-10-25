import {
	type ButtonInteraction,
	LabelBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js"
import type { PaginationIds } from "@/shared/pagination/ids"
import type { SearchParams } from "@/shared/pagination/types"

type SearchModalOptions = {
	buttonInteraction: ButtonInteraction
	ids: PaginationIds
	search: SearchParams
}

export function findSearchPage(terms: string[], query: string): number | null {
	const normalizedQuery = query.trim().toLowerCase()

	const pageIndex = terms.findIndex((term) =>
		term.toLowerCase().includes(normalizedQuery)
	)

	return pageIndex === -1 ? null : pageIndex
}

export function buildSearchModal(
	ids: PaginationIds,
	search: SearchParams
): ModalBuilder {
	const modal = new ModalBuilder()
		.setCustomId(ids.modal)
		.setTitle(search.title)
	const searchInput = new TextInputBuilder()
		.setCustomId(ids.input)
		.setStyle(TextInputStyle.Short)
		.setPlaceholder(search.placeholder)
		.setRequired(true)
	const searchLabel = new LabelBuilder()
		.setLabel(search.label)
		.setTextInputComponent(searchInput)

	modal.addLabelComponents(searchLabel)
	return modal
}

export async function showSearchModal({
	buttonInteraction,
	ids,
	search,
}: SearchModalOptions): Promise<void> {
	await buttonInteraction.showModal(buildSearchModal(ids, search))
}
