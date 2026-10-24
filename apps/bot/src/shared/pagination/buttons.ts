import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { emojis } from "@/shared/constants/emojis"
import type { PaginationIds } from "@/shared/pagination/ids"
import type { PaginationCursor } from "@/shared/pagination/types"

const BUTTON_EMOJIS = {
	first: emojis.pagination.first,
	previous: emojis.pagination.previous,
	search: emojis.pagination.search,
	next: emojis.pagination.next,
	last: emojis.pagination.last,
} as const

type ButtonKey = keyof typeof BUTTON_EMOJIS
type CursorButtonKey = Extract<ButtonKey, "previous" | "next">

export type StaticButtons = Record<ButtonKey, ButtonBuilder>
export type CursorButtons = Record<CursorButtonKey, ButtonBuilder>

function createButton(customId: string, key: ButtonKey): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(customId)
		.setStyle(ButtonStyle.Secondary)
		.setEmoji(BUTTON_EMOJIS[key])
}

export function buildStaticButtons(ids: PaginationIds): StaticButtons {
	return {
		first: createButton(ids.first, "first"),
		previous: createButton(ids.previous, "previous"),
		search: createButton(ids.search, "search"),
		next: createButton(ids.next, "next"),
		last: createButton(ids.last, "last"),
	}
}

export function buildCursorButtons(ids: PaginationIds): CursorButtons {
	return {
		previous: createButton(ids.previous, "previous"),
		next: createButton(ids.next, "next"),
	}
}

export function buildStaticActionRow(
	buttons: StaticButtons,
	includeSearch: boolean
): ActionRowBuilder<ButtonBuilder> {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		buttons.first,
		buttons.previous,
		...(includeSearch ? [buttons.search] : []),
		buttons.next,
		buttons.last
	)
}

export function buildCursorActionRow(
	buttons: CursorButtons
): ActionRowBuilder<ButtonBuilder> {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		buttons.previous,
		buttons.next
	)
}

export function applyStaticButtonState(
	buttons: StaticButtons,
	index: number,
	pageCount: number
): void {
	const isFirstPage = index === 0
	const isLastPage = index === pageCount - 1

	buttons.first.setDisabled(isFirstPage)
	buttons.previous.setDisabled(isFirstPage)
	buttons.next.setDisabled(isLastPage)
	buttons.last.setDisabled(isLastPage)
}

export function applyCursorButtonState(
	buttons: CursorButtons,
	index: number,
	nextCursor: PaginationCursor | null
): void {
	buttons.previous.setDisabled(index === 0)
	buttons.next.setDisabled(nextCursor === null)
}
