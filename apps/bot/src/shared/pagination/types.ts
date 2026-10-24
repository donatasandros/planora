import type { APIEmbed, ChatInputCommandInteraction } from "discord.js"

export type PaginationCursor = {
	startedAt: number
	id: string
}

export type CursorPage<T> = {
	items: T[]
	nextCursor: PaginationCursor | null
	totalPages?: number
}

export type SearchParams = {
	terms: string[]
	title: string
	label: string
	placeholder: string
	notFoundMessage: string
}

type BasePaginationParams = {
	interaction: ChatInputCommandInteraction
	time?: number
}

export type StaticPaginationParams = BasePaginationParams & {
	mode?: "static"
	embeds: APIEmbed[]
	search?: SearchParams
}

export type CursorPaginationParams<T> = BasePaginationParams & {
	mode: "cursor"
	loadPage: (cursor: PaginationCursor | null) => Promise<CursorPage<T>>
	renderPage: (items: T[], pageIndex: number, totalPages?: number) => APIEmbed
	emptyEmbed: APIEmbed
}

export type PaginateParams<T = never> =
	| StaticPaginationParams
	| CursorPaginationParams<T>
