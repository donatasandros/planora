import {
	type ButtonInteraction,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js"
import type { PaginationIds } from "@/shared/pagination/ids"
import type { SearchParams } from "@/shared/pagination/types"

type SearchModalOptions = {
	buttonInteraction: ButtonInteraction
	ownerId: string
	ids: PaginationIds
	search: SearchParams
	time: number
}

export type SearchOutcome =
	| { kind: "switched"; pageIndex: number }
	| { kind: "not-found" }
	| { kind: "expired" }

export function findSearchPage(terms: string[], query: string): number | null {
	const normalizedQuery = query.trim().toLowerCase()

	const pageIndex = terms.findIndex((term) =>
		term.toLowerCase().includes(normalizedQuery)
	)

	return pageIndex === -1 ? null : pageIndex
}

export async function promptForSearch({
	buttonInteraction,
	ownerId,
	ids,
	search,
	time,
}: SearchModalOptions): Promise<SearchOutcome> {
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

	await buttonInteraction.showModal(modal)

	const submitted = await buttonInteraction
		.awaitModalSubmit({
			filter: (modalInteraction) =>
				modalInteraction.customId === ids.modal &&
				modalInteraction.user.id === ownerId,
			time,
		})
		.catch(() => null)

	if (!submitted) {
		return { kind: "expired" }
	}

	const query = submitted.fields.getTextInputValue(ids.input)

	const pageIndex = findSearchPage(search.terms, query)

	if (pageIndex === null) {
		await submitted.reply({
			content: search.notFoundMessage,
			flags: MessageFlags.Ephemeral,
		})

		return { kind: "not-found" }
	}

	await submitted.deferUpdate()

	return { kind: "switched", pageIndex }
}
