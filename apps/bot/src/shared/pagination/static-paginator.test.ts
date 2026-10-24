import { describe, expect, it, vi } from "vitest"
import paginate from "@/shared/pagination"
import {
	asCommandInteraction,
	collectCustomIds,
	FakeModalSubmitInteraction,
} from "@/test/fakes"
import {
	actionName,
	createButton,
	createInteraction,
	getButtonIds,
	getButtons,
	getCollector,
	OTHER_USER_ID,
	OWNER_ID,
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

const SEARCH = {
	terms: ["minecraft", "chess"],
	title: "Search activity",
	label: "Activity name",
	placeholder: "e.g. Minecraft",
	notFoundMessage: "Activity not found",
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
