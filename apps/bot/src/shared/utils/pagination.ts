import { randomUUID } from "node:crypto"
import {
	ActionRowBuilder,
	type APIEmbed,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	type ChatInputCommandInteraction,
	ComponentType,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js"
import { emojis } from "@/shared/constants/emojis"
import { TIMEOUT_MS } from "@/shared/constants/pagination"

export type PaginationCursor = {
	startedAt: number
	id: string
}

type CursorPage<T> = {
	items: T[]
	nextCursor: PaginationCursor | null
	totalPages?: number
}

type SearchParams = {
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

type StaticPaginationParams = BasePaginationParams & {
	mode?: "static"
	embeds: APIEmbed[]
	search?: SearchParams
}

type CursorPaginationParams<T> = BasePaginationParams & {
	mode: "cursor"
	loadPage: (cursor: PaginationCursor | null) => Promise<CursorPage<T>>
	renderPage: (items: T[], pageIndex: number, totalPages?: number) => APIEmbed
	emptyEmbed: APIEmbed
}

type PaginateParams<T = never> =
	| StaticPaginationParams
	| CursorPaginationParams<T>

export default async function paginate<T>(params: PaginateParams<T>) {
	if (params.mode === "cursor") {
		return paginateCursor(params)
	}

	return paginateStatic(params)
}

async function paginateStatic({
	interaction,
	embeds,
	search,
	time = TIMEOUT_MS,
}: StaticPaginationParams) {
	if (embeds.length === 0) {
		throw new Error("Pagination required at least one page")
	}

	if (embeds.length === 1) {
		return interaction.editReply({ embeds, components: [] })
	}

	const namespace = randomUUID()

	const ids = {
		first: `${namespace}:first`,
		previous: `${namespace}:previous`,
		search: `${namespace}:search`,
		next: `${namespace}:next`,
		last: `${namespace}:last`,
		modal: `${namespace}:search-modal`,
		input: `${namespace}:search-input`,
	}

	const buttons = {
		first: new ButtonBuilder()
			.setCustomId(ids.first)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true)
			.setEmoji(emojis.pagination.first),

		previous: new ButtonBuilder()
			.setCustomId(ids.previous)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true)
			.setEmoji(emojis.pagination.previous),

		search: new ButtonBuilder()
			.setCustomId(ids.search)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(emojis.pagination.search),

		next: new ButtonBuilder()
			.setCustomId(ids.next)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(emojis.pagination.next),

		last: new ButtonBuilder()
			.setCustomId(ids.last)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(emojis.pagination.last),
	}

	const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		buttons.first,
		buttons.previous,
		...(search ? [buttons.search] : []),
		buttons.next,
		buttons.last
	)

	let index = 0

	function updateButtonState(): void {
		const isFirstPage = index === 0
		const isLastPage = index === embeds.length - 1

		buttons.first.setDisabled(isFirstPage)
		buttons.previous.setDisabled(isFirstPage)
		buttons.next.setDisabled(isLastPage)
		buttons.last.setDisabled(isLastPage)
	}

	updateButtonState()

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
		updateButtonState()

		await message.edit({
			embeds: [embeds[index]],
			components: [actionRow],
		})
	}

	async function handleSearch(
		buttonInteraction: ButtonInteraction
	): Promise<boolean> {
		if (!search) {
			return false
		}

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
					modalInteraction.user.id === interaction.user.id,
				time,
			})
			.catch(() => null)

		if (!submitted) {
			return false
		}

		const query = submitted.fields
			.getTextInputValue(ids.input)
			.trim()
			.toLowerCase()

		const pageIndex = search.terms.findIndex((term) =>
			term.toLowerCase().includes(query)
		)

		if (pageIndex === -1) {
			await submitted.reply({
				content: search.notFoundMessage,
				flags: MessageFlags.Ephemeral,
			})

			return false
		}

		index = pageIndex

		await submitted.deferUpdate()

		return true
	}

	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time,
	})

	collector.on("collect", async (buttonInteraction) => {
		if (buttonInteraction.user.id !== interaction.user.id) {
			await buttonInteraction.reply({
				content: "Only the original user can interact with this button.",
				flags: MessageFlags.Ephemeral,
			})

			return
		}

		collector.resetTimer()

		if (buttonInteraction.customId === ids.search) {
			const shouldRender = await handleSearch(buttonInteraction)

			if (shouldRender) {
				await render()
			}

			return
		}

		await buttonInteraction.deferUpdate()

		if (changePage(buttonInteraction.customId)) {
			await render()
		}
	})

	collector.on("end", async () => {
		await message
			.edit({
				components: [],
			})
			.catch(() => undefined)
	})

	return message
}

async function paginateCursor<T>({
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

	const namespace = randomUUID()

	const ids = {
		previous: `${namespace}:previous`,
		next: `${namespace}:next`,
	}

	const buttons = {
		previous: new ButtonBuilder()
			.setCustomId(ids.previous)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true)
			.setEmoji(emojis.pagination.previous),

		next: new ButtonBuilder()
			.setCustomId(ids.next)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(firstPage.nextCursor === null)
			.setEmoji(emojis.pagination.next),
	}

	const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		buttons.previous,
		buttons.next
	)

	const message = await interaction.editReply({
		embeds: [renderPage(firstPage.items, index, totalPages)],
		components: [actionRow],
	})

	function updateButtonState() {
		const currentPage = pages[index]

		buttons.previous.setDisabled(index === 0)
		buttons.next.setDisabled(currentPage.nextCursor === null)
	}

	async function render() {
		updateButtonState()

		await message.edit({
			embeds: [renderPage(pages[index].items, index, totalPages)],
			components: [actionRow],
		})
	}

	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time,
	})

	collector.on("collect", async (buttonInteraction) => {
		if (buttonInteraction.user.id !== interaction.user.id) {
			await buttonInteraction.reply({
				content: "Only the original user can interact with this button.",
				flags: MessageFlags.Ephemeral,
			})

			return
		}

		if (loading) {
			await buttonInteraction.deferUpdate()
			return
		}

		collector.resetTimer()

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

			collector.stop("load-failed")
		} finally {
			loading = false
		}
	})

	collector.on("end", async () => {
		await message
			.edit({
				components: [],
			})
			.catch(() => undefined)
	})

	return message
}
