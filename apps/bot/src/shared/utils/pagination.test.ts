import { describe, expect, it, vi } from "vitest"
import type { PaginationCursor } from "@/shared/utils/pagination"
import {
	asCommandInteraction,
	collectCustomIds,
	FakeButtonInteraction,
	FakeChatInputCommandInteraction,
	type FakeCollector,
	FakeModalSubmitInteraction,
	type MessagePayload,
} from "@/test/fakes"
import paginate from "./pagination"

vi.mock("@/core/logger", () => ({
	logger: {
		debug: vi.fn(),
		error: vi.fn(),
		fatal: vi.fn(),
		info: vi.fn(),
		trace: vi.fn(),
		warn: vi.fn(),
	},
}))

type ButtonJson = {
	custom_id?: string
	disabled?: boolean
}

type CursorItem = {
	id: string
	label: string
}

type CursorPage = {
	items: CursorItem[]
	nextCursor: PaginationCursor | null
	totalPages?: number
}

const OWNER_ID = "owner"
const OTHER_USER_ID = "other-user"

const SEARCH = {
	terms: ["minecraft", "chess"],
	title: "Search activity",
	label: "Activity name",
	placeholder: "e.g. Minecraft",
	notFoundMessage: "Activity not found",
}

function createInteraction(
	userId: string = OWNER_ID
): FakeChatInputCommandInteraction {
	return new FakeChatInputCommandInteraction({ userId })
}

function getCollector(
	interaction: FakeChatInputCommandInteraction
): FakeCollector {
	const collector = interaction.message.collector

	if (!collector) {
		throw new Error("Expected a component collector to exist")
	}

	return collector
}

function getButtons(payload: MessagePayload | undefined): ButtonJson[] {
	const row = payload?.components?.[0] as
		| { toJSON: () => { components?: ButtonJson[] } }
		| undefined

	if (!row) {
		throw new Error("Expected an action row in the payload")
	}

	return row.toJSON().components ?? []
}

function getButtonIds(payload: MessagePayload | undefined): string[] {
	return collectCustomIds(payload?.components?.[0])
}

function findId(ids: string[], suffix: string): string {
	const id = ids.find((candidate) => candidate.endsWith(suffix))

	if (!id) {
		throw new Error(`Expected a button id ending with "${suffix}"`)
	}

	return id
}

function actionName(customId: string | undefined): string | undefined {
	return customId?.split(":").at(-1)
}

function createButton(
	ids: string[],
	suffix: string,
	userId: string = OWNER_ID
): FakeButtonInteraction {
	return new FakeButtonInteraction({
		customId: findId(ids, suffix),
		userId,
	})
}

describe("paginate (static)", () => {
	it("rejects when there are no pages", async () => {
		const interaction = createInteraction()

		await expect(
			paginate({
				interaction: asCommandInteraction(interaction),
				embeds: [],
			})
		).rejects.toThrow("Pagination requires at least one page")
	})

	it("renders a single page without components", async () => {
		const interaction = createInteraction()
		const embeds = [{ title: "test-1" }]

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds,
		})

		expect(interaction.editReplies).toHaveLength(1)
		expect(interaction.editReplies[0]?.embeds).toEqual([embeds[0]])
		expect(interaction.editReplies[0]?.components).toEqual([])
		expect(interaction.message.collector).toBeUndefined()
	})

	it("disables first and previous on the first page", async () => {
		const interaction = createInteraction()
		const embeds = [{ title: "test-1" }, { title: "test-2" }]

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds,
		})

		const buttons = getButtons(interaction.editReplies[0])

		expect(buttons.map((button) => actionName(button.custom_id))).toEqual([
			"first",
			"previous",
			"next",
			"last",
		])
		expect(
			buttons.find((button) => button.custom_id?.endsWith(":first"))
				?.disabled
		).toBe(true)
		expect(
			buttons.find((button) => button.custom_id?.endsWith(":previous"))
				?.disabled
		).toBe(true)
		expect(
			buttons.find((button) => button.custom_id?.endsWith(":next"))?.disabled
		).toBeFalsy()
		expect(
			buttons.find((button) => button.custom_id?.endsWith(":last"))?.disabled
		).toBeFalsy()
	})

	it("includes a search button when search terms are given", async () => {
		const interaction = createInteraction()
		const embeds = [{ title: "test-1" }, { title: "test-2" }]

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds,
			search: SEARCH,
		})

		const buttons = getButtons(interaction.editReplies[0])

		expect(buttons.map((button) => actionName(button.custom_id))).toEqual([
			"first",
			"previous",
			"search",
			"next",
			"last",
		])
	})

	it("advances to the next page when next is clicked", async () => {
		const interaction = createInteraction()
		const embeds = [{ title: "test-1" }, { title: "test-2" }]

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds,
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])

		await collector.emit("collect", createButton(ids, ":next"))

		expect(interaction.message.edits.at(-1)?.embeds).toEqual([embeds[1]])
	})

	it("clamps previous at the first page and re-renders", async () => {
		const interaction = createInteraction()
		const embeds = [{ title: "test-1" }, { title: "test-2" }]

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds,
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])

		await collector.emit("collect", createButton(ids, ":previous"))

		expect(interaction.message.edit).toHaveLength(1)
		expect(interaction.message.edits.at(-1)?.embeds).toEqual([embeds[0]])
	})

	it("clamps next at the last page and re-renders", async () => {
		const interaction = createInteraction()
		const embeds = [{ title: "test-1" }, { title: "test-2" }]

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds,
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])

		await collector.emit("collect", createButton(ids, ":next"))
		await collector.emit("collect", createButton(ids, ":next"))

		expect(interaction.message.edits.at(-1)?.embeds).toEqual([embeds[1]])

		await collector.emit("collect", createButton(ids, ":next"))

		expect(interaction.message.edits.at(-1)?.embeds).toEqual([embeds[1]])
	})

	it("jumps to the last page when last is clicked", async () => {
		const interaction = createInteraction()
		const embeds = [
			{ title: "test-1" },
			{ title: "test-2" },
			{ title: "test-3" },
		]

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds,
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])

		await collector.emit("collect", createButton(ids, ":last"))

		expect(interaction.message.edits.at(-1)?.embeds).toEqual([embeds[2]])
	})

	it("jumps back to the first page when first is clicked", async () => {
		const interaction = createInteraction()
		const embeds = [{ title: "test-1" }, { title: "test-2" }]

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds,
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])

		await collector.emit("collect", createButton(ids, ":next"))
		await collector.emit("collect", createButton(ids, ":first"))

		expect(interaction.message.edits.at(-1)?.embeds).toEqual([embeds[0]])
	})

	it("ignores clicks from another user", async () => {
		const interaction = createInteraction()
		const embeds = [{ title: "test-1" }, { title: "test-2" }]

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds,
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])
		const foreign = createButton(ids, ":next", OTHER_USER_ID)

		await collector.emit("collect", foreign)

		expect(foreign.replies).toHaveLength(1)
		expect(foreign.replies[0]?.content).toBe(
			"Only the original user can interact with this button."
		)
		expect(interaction.message.edits).toHaveLength(0)
	})

	it("resets the collector timer on a valid click only", async () => {
		const interaction = createInteraction()

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds: [{ title: "test-1" }, { title: "test-2" }],
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])

		await collector.emit("collect", createButton(ids, ":next", OTHER_USER_ID))
		expect(collector.resetTimerCalls).toBe(0)

		await collector.emit("collect", createButton(ids, ":next"))
		expect(collector.resetTimerCalls).toBe(1)
	})

	it("strips the components when the collector ends", async () => {
		const interaction = createInteraction()

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds: [{ title: "test-1" }, { title: "test-2" }],
		})

		const collector = getCollector(interaction)

		await collector.emit("end")

		expect(interaction.message.edits.at(-1)?.components).toEqual([])
	})

	it("reports an error to the user when rendering fails", async () => {
		const interaction = createInteraction()

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds: [{ title: "test-1" }, { title: "test-2" }],
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])
		const button = createButton(ids, ":next")

		interaction.message.edit = async () => {
			throw new Error("Render failed")
		}

		await collector.emit("collect", button)

		expect(button.followUps).toHaveLength(1)
		expect(button.followUps[0]?.content).toBe("Something went wrong")
		expect(button.replies).toHaveLength(0)
	})

	it("finds the page matching the search term", async () => {
		const interaction = createInteraction()
		const embeds = [{ title: "test-1" }, { title: "test-2" }]

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds,
			search: SEARCH,
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])
		const searchButton = createButton(ids, ":search")

		const pending = collector.emit("collect", searchButton)

		await vi.waitFor(() => {
			expect(searchButton.shownModals).toHaveLength(1)
		})

		const [modalId, inputId] = collectCustomIds(searchButton.shownModals[0])

		searchButton.submitModal(
			new FakeModalSubmitInteraction({
				customId: modalId ?? "",
				userId: OWNER_ID,
				values: { [inputId ?? ""]: "  CHESS  " },
			})
		)

		await pending

		expect(interaction.message.edits.at(-1)?.embeds).toEqual([embeds[1]])
	})

	it("keeps the current page when the search term is not found", async () => {
		const interaction = createInteraction()
		const embeds = [{ title: "test-1" }, { title: "test-2" }]

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds,
			search: SEARCH,
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])
		const searchButton = createButton(ids, ":search")

		const pending = collector.emit("collect", searchButton)

		await vi.waitFor(() => {
			expect(searchButton.shownModals).toHaveLength(1)
		})

		const [modalId, inputId] = collectCustomIds(searchButton.shownModals[0])

		const submission = new FakeModalSubmitInteraction({
			customId: modalId ?? "",
			userId: OWNER_ID,
			values: { [inputId ?? ""]: "tetris" },
		})

		searchButton.submitModal(submission)

		await pending

		expect(submission.replies).toHaveLength(1)
		expect(submission.replies[0]?.content).toBe(SEARCH.notFoundMessage)
		expect(interaction.message.edits).toHaveLength(0)
	})

	it("does not re-render when the search modal expires", async () => {
		const interaction = createInteraction()

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds: [{ title: "test-1" }, { title: "test-2" }],
			search: SEARCH,
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])
		const searchButton = createButton(ids, ":search")

		const pending = collector.emit("collect", searchButton)

		await vi.waitFor(() => {
			expect(searchButton.shownModals).toHaveLength(1)
		})

		searchButton.timeoutModal()

		await pending

		expect(interaction.message.edits).toHaveLength(0)
	})

	it("ignores a search submitted by another user", async () => {
		const interaction = createInteraction()

		await paginate({
			interaction: asCommandInteraction(interaction),
			embeds: [{ title: "test-1" }, { title: "test-2" }],
			search: SEARCH,
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])
		const searchButton = createButton(ids, ":search")

		const pending = collector.emit("collect", searchButton)

		await vi.waitFor(() => {
			expect(searchButton.shownModals).toHaveLength(1)
		})

		const [modalId, inputId] = collectCustomIds(searchButton.shownModals[0])

		const accepted = searchButton.submitModal(
			new FakeModalSubmitInteraction({
				customId: modalId ?? "",
				userId: OTHER_USER_ID,
				values: { [inputId ?? ""]: "chess" },
			})
		)

		expect(accepted).toBe(false)

		searchButton.timeoutModal()

		await pending

		expect(interaction.message.edits).toHaveLength(0)
	})
})

describe("paginate (cursor)", () => {
	function createPage(
		labels: string[],
		nextCursor: PaginationCursor | null,
		totalPages?: number
	): CursorPage {
		return {
			items: labels.map((label) => ({ id: label, label })),
			nextCursor,
			totalPages,
		}
	}

	it("renders the empty embed when there are no sessions", async () => {
		const interaction = createInteraction()
		const loadPage = vi.fn(async () => createPage([], null))
		const renderPage = vi.fn(() => ({ title: "test-1" }))

		await paginate<CursorItem>({
			mode: "cursor",
			interaction: asCommandInteraction(interaction),
			loadPage,
			renderPage,
			emptyEmbed: { title: "No sessions" },
		})

		expect(interaction.editReplies[0]?.embeds).toEqual([
			{ title: "No sessions" },
		])
		expect(interaction.editReplies[0]?.components).toEqual([])
		expect(interaction.message.collector).toBeUndefined()
		expect(renderPage).not.toHaveBeenCalled()
	})

	it("renders a single page without components when there is no next cursor", async () => {
		const interaction = createInteraction()
		const loadPage = vi.fn(async () => createPage(["test-1"], null, 1))
		const renderPage = vi.fn(() => ({ title: "test-2" }))

		await paginate<CursorItem>({
			mode: "cursor",
			interaction: asCommandInteraction(interaction),
			loadPage,
			renderPage,
			emptyEmbed: { title: "No sessions" },
		})

		expect(interaction.editReplies[0]?.components).toEqual([])
		expect(interaction.message.collector).toBeUndefined()
		expect(renderPage).toHaveBeenCalledWith(
			[{ id: "test-1", label: "test-1" }],
			0,
			1
		)
	})

	it("renders only previous and next buttons", async () => {
		const interaction = createInteraction()
		const loadPage = vi.fn(async () =>
			createPage(["test-1"], { startedAt: 1, id: "cursor-1" }, 2)
		)
		const renderPage = vi.fn(() => ({ title: "test-1" }))

		await paginate<CursorItem>({
			mode: "cursor",
			interaction: asCommandInteraction(interaction),
			loadPage,
			renderPage,
			emptyEmbed: { title: "No sessions" },
		})

		const buttons = getButtons(interaction.editReplies[0])

		expect(buttons.map((button) => actionName(button.custom_id))).toEqual([
			"previous",
			"next",
		])
		expect(
			buttons.find((button) => button.custom_id?.endsWith(":previous"))
				?.disabled
		).toBe(true)
		expect(
			buttons.find((button) => button.custom_id?.endsWith(":next"))?.disabled
		).toBeFalsy()
	})

	it("loads the next page when next is clicked", async () => {
		const interaction = createInteraction()
		const cursor = { startedAt: 1, id: "cursor-1" }
		const loadPage = vi.fn(async (pageCursor: PaginationCursor | null) =>
			pageCursor === null
				? createPage(["test-1"], cursor, 2)
				: createPage(["test-2"], null, 2)
		)
		const renderPage = vi.fn((_items: CursorItem[], pageIndex: number) => ({
			title: `page ${pageIndex}`,
		}))

		await paginate<CursorItem>({
			mode: "cursor",
			interaction: asCommandInteraction(interaction),
			loadPage,
			renderPage,
			emptyEmbed: { title: "No sessions" },
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])

		await collector.emit("collect", createButton(ids, ":next"))

		expect(loadPage).toHaveBeenCalledTimes(2)
		expect(loadPage).toHaveBeenLastCalledWith(cursor)
		expect(renderPage).toHaveBeenLastCalledWith(
			[{ id: "test-2", label: "test-2" }],
			1,
			2
		)
	})

	it("reuses an already loaded page instead of loading it again", async () => {
		const interaction = createInteraction()
		const cursor = { startedAt: 1, id: "cursor-1" }
		const loadPage = vi.fn(async (pageCursor: PaginationCursor | null) =>
			pageCursor === null
				? createPage(["test-1"], cursor, 2)
				: createPage(["test-2"], null, 2)
		)
		const renderPage = vi.fn((_items: CursorItem[], pageIndex: number) => ({
			title: `page ${pageIndex}`,
		}))

		await paginate<CursorItem>({
			mode: "cursor",
			interaction: asCommandInteraction(interaction),
			loadPage,
			renderPage,
			emptyEmbed: { title: "No sessions" },
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])

		await collector.emit("collect", createButton(ids, ":next"))
		await collector.emit("collect", createButton(ids, ":previous"))
		await collector.emit("collect", createButton(ids, ":next"))

		expect(loadPage).toHaveBeenCalledTimes(2)
		expect(renderPage).toHaveBeenLastCalledWith(
			[{ id: "test-2", label: "test-2" }],
			1,
			2
		)
	})

	it("drops a second click while a page is loading", async () => {
		const interaction = createInteraction()
		const cursor = { startedAt: 1, id: "cursor-1" }
		let resolveLoad: ((page: CursorPage) => void) | undefined
		const loadPage = vi.fn((pageCursor: PaginationCursor | null) => {
			if (pageCursor === null) {
				return Promise.resolve(createPage(["test-1"], cursor, 2))
			}

			return new Promise<CursorPage>((resolve) => {
				resolveLoad = resolve
			})
		})
		const renderPage = vi.fn((_items: CursorItem[], pageIndex: number) => ({
			title: `page ${pageIndex}`,
		}))

		await paginate<CursorItem>({
			mode: "cursor",
			interaction: asCommandInteraction(interaction),
			loadPage,
			renderPage,
			emptyEmbed: { title: "No sessions" },
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])

		const first = collector.emit("collect", createButton(ids, ":next"))

		await vi.waitFor(() => {
			expect(loadPage).toHaveBeenCalledTimes(2)
		})

		const second = createButton(ids, ":next")
		await collector.emit("collect", second)

		expect(second.deferUpdateCalls).toBe(1)
		expect(renderPage).toHaveBeenCalledTimes(1)

		resolveLoad?.(createPage(["test-2"], null, 2))

		await first

		expect(renderPage).toHaveBeenLastCalledWith(
			[{ id: "test-2", label: "test-2" }],
			1,
			2
		)
	})

	it("shows a failure message when the next page cannot be loaded", async () => {
		const interaction = createInteraction()
		const cursor = { startedAt: 1, id: "cursor-1" }
		const loadPage = vi.fn(async (pageCursor: PaginationCursor | null) => {
			if (pageCursor === null) {
				return createPage(["test-1"], cursor, 2)
			}

			throw new Error("database unavailable")
		})
		const renderPage = vi.fn((_items: CursorItem[], pageIndex: number) => ({
			title: `page ${pageIndex}`,
		}))

		await paginate<CursorItem>({
			mode: "cursor",
			interaction: asCommandInteraction(interaction),
			loadPage,
			renderPage,
			emptyEmbed: { title: "No sessions" },
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])

		await collector.emit("collect", createButton(ids, ":next"))

		const lastEdit = interaction.message.edits.at(-1)

		expect(lastEdit?.content).toBe("Failed to load the next page.")
		expect(lastEdit?.embeds).toEqual([])
		expect(lastEdit?.components).toEqual([])
		expect(collector.stopCalls).toEqual(["load-failed"])
	})

	it("ignores clicks from another user", async () => {
		const interaction = createInteraction()
		const loadPage = vi.fn(async () =>
			createPage(["test-1"], { startedAt: 1, id: "cursor-1" }, 2)
		)
		const renderPage = vi.fn(() => ({ title: "test-1" }))

		await paginate<CursorItem>({
			mode: "cursor",
			interaction: asCommandInteraction(interaction),
			loadPage,
			renderPage,
			emptyEmbed: { title: "No sessions" },
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])
		const foreign = createButton(ids, ":next", OTHER_USER_ID)

		await collector.emit("collect", foreign)

		expect(foreign.replies[0]?.content).toBe(
			"Only the original user can interact with this button."
		)
		expect(loadPage).toHaveBeenCalledTimes(1)
		expect(interaction.message.edits).toHaveLength(0)
	})

	it("does not move back when previous is clicked on the first page", async () => {
		const interaction = createInteraction()
		const loadPage = vi.fn(async () =>
			createPage(["test-1"], { startedAt: 1, id: "cursor-1" }, 2)
		)
		const renderPage = vi.fn(() => ({ title: "test-1" }))

		await paginate<CursorItem>({
			mode: "cursor",
			interaction: asCommandInteraction(interaction),
			loadPage,
			renderPage,
			emptyEmbed: { title: "No sessions" },
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])

		await collector.emit("collect", createButton(ids, ":previous"))

		expect(interaction.message.edits).toHaveLength(0)
	})

	it("strips the components when the collector ends", async () => {
		const interaction = createInteraction()
		const loadPage = vi.fn(async () =>
			createPage(["test-1"], { startedAt: 1, id: "cursor-1" }, 2)
		)
		const renderPage = vi.fn(() => ({ title: "test-1" }))

		await paginate<CursorItem>({
			mode: "cursor",
			interaction: asCommandInteraction(interaction),
			loadPage,
			renderPage,
			emptyEmbed: { title: "No sessions" },
		})

		const collector = getCollector(interaction)

		await collector.emit("end")

		expect(interaction.message.edits.at(-1)?.components).toEqual([])
	})

	it("reuses the total page count captured by the first load", async () => {
		const interaction = createInteraction()
		const cursor = { startedAt: 1, id: "cursor-1" }
		const loadPage = vi.fn(async (pageCursor: PaginationCursor | null) =>
			pageCursor === null
				? createPage(["test-1"], cursor, 3)
				: createPage(["test-2"], null)
		)
		const renderPage = vi.fn(
			(_items: CursorItem[], pageIndex: number, totalPages?: number) => ({
				title: `page ${pageIndex}`,
				footer: { text: `Page ${pageIndex + 1} / ${totalPages}` },
			})
		)

		await paginate<CursorItem>({
			mode: "cursor",
			interaction: asCommandInteraction(interaction),
			loadPage,
			renderPage,
			emptyEmbed: { title: "No sessions" },
		})

		const collector = getCollector(interaction)
		const ids = getButtonIds(interaction.editReplies[0])

		await collector.emit("collect", createButton(ids, ":next"))

		expect(renderPage).toHaveBeenLastCalledWith(
			[{ id: "test-2", label: "test-2" }],
			1,
			3
		)
	})
})
