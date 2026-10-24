import { describe, expect, it, vi } from "vitest"
import type { PaginationCursor } from "@/shared/pagination"
import paginate from "@/shared/pagination"
import { asCommandInteraction } from "@/test/fakes"
import {
	actionName,
	createButton,
	createInteraction,
	getButtonIds,
	getButtons,
	getCollector,
	OTHER_USER_ID,
} from "@/test/pagination-helpers"

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

type CursorItem = {
	id: string
	label: string
}

type CursorPage = {
	items: CursorItem[]
	nextCursor: PaginationCursor | null
	totalPages?: number
}

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
