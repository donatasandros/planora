import type { ButtonInteraction, Interaction, Message } from "discord.js"
import { describe, expect, it, vi } from "vitest"
import { defineButton } from "@/core/components/define-component"
import { dispatchComponent, parseCustomId } from "@/core/components/dispatch"
import {
	type ComponentRegistry,
	createComponentRegistry,
} from "@/core/components/registry"
import type {
	ButtonHandler,
	ComponentControls,
	ViewHandle,
} from "@/core/components/types"
import {
	FakeButtonInteraction,
	type FakeCollector,
	FakeMessage,
	FakeModalSubmitInteraction,
} from "@/test/fakes"

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

const OWNER_ID = "owner"
const OTHER_USER_ID = "other-user"

function asInteraction(
	interaction: FakeButtonInteraction | FakeModalSubmitInteraction
): Interaction {
	return interaction as unknown as Interaction
}

function asMessage(message: FakeMessage): Message {
	return message as unknown as Message
}

function asButton(interaction: FakeButtonInteraction): ButtonInteraction {
	return interaction as unknown as ButtonInteraction
}

function getCollector(message: FakeMessage): FakeCollector {
	if (!message.collector) {
		throw new Error("Expected a collector")
	}

	return message.collector
}

function openTestView(
	registry: ComponentRegistry,
	options: {
		message: FakeMessage
		onButton?: ButtonHandler
		time?: number
	}
): ViewHandle {
	return registry.openView({
		feature: "demo",
		sessionId: "session",
		ownerId: OWNER_ID,
		message: asMessage(options.message),
		time: options.time ?? 60_000,
		onButton: options.onButton,
	})
}

describe("parseCustomId", () => {
	it("splits feature and session", () => {
		expect(parseCustomId("pagination:abc:next")).toEqual({
			feature: "pagination",
			sessionId: "abc",
		})
	})

	it("ignores ids without a session", () => {
		expect(parseCustomId("nope")).toBeNull()
	})
})

describe("dispatchComponent", () => {
	it("replies with an expired notice when nothing matches", async () => {
		const registry = createComponentRegistry()
		const button = new FakeButtonInteraction({ customId: "missing:abc:next" })

		const handled = await dispatchComponent(asInteraction(button), registry)

		expect(handled).toBe(false)
		expect(button.replies[0]?.content).toBe("This interaction expired.")
	})

	it("denies a foreign user without calling the handler", async () => {
		const registry = createComponentRegistry()
		const message = new FakeMessage()
		const handler = vi.fn()

		openTestView(registry, { message, onButton: handler })

		const collector = getCollector(message)

		await collector.emit(
			"collect",
			new FakeButtonInteraction({
				customId: "demo:session:go",
				userId: OTHER_USER_ID,
			})
		)

		expect(handler).not.toHaveBeenCalled()
		expect(collector.resetTimerCalls).toBe(0)
	})

	it("runs the handler with collector controls for the owner", async () => {
		const registry = createComponentRegistry()
		const message = new FakeMessage()
		let controls: ComponentControls | undefined

		openTestView(registry, {
			message,
			onButton: (_interaction, received) => {
				controls = received
			},
		})

		const collector = getCollector(message)

		await collector.emit(
			"collect",
			new FakeButtonInteraction({
				customId: "demo:session:go",
				userId: OWNER_ID,
			})
		)

		expect(controls).toBeDefined()

		controls?.resetTimer()
		expect(collector.resetTimerCalls).toBe(1)

		controls?.stop("done")
		expect(collector.stopCalls).toEqual(["done"])
	})

	it("replies with an expired notice after the view closes", async () => {
		const registry = createComponentRegistry()
		const message = new FakeMessage()
		const view = openTestView(registry, { message })

		await view.close()

		const button = new FakeButtonInteraction({
			customId: "demo:session:go",
		})

		await dispatchComponent(asInteraction(button), registry)

		expect(button.replies[0]?.content).toBe("This interaction expired.")
	})

	it("reports handler errors and keeps the process alive", async () => {
		const registry = createComponentRegistry()
		const message = new FakeMessage()

		openTestView(registry, {
			message,
			onButton: async (interaction) => {
				await interaction.deferUpdate()
				throw new Error("boom")
			},
		})

		const button = new FakeButtonInteraction({
			customId: "demo:session:go",
			userId: OWNER_ID,
		})

		await getCollector(message).emit("collect", button)

		expect(button.followUps[0]?.content).toBe("Something went wrong")
	})

	it("enforces ownerOnly on static components", async () => {
		const registry = createComponentRegistry()
		const message = new FakeMessage()
		message.interactionMetadata = { user: { id: OWNER_ID } }

		const handler = vi.fn()

		registry.register([
			defineButton({
				feature: "demo",
				match: (customId) => customId === "demo:go",
				ownerOnly: true,
				onButton: handler,
			}),
		])

		const foreign = new FakeButtonInteraction({
			customId: "demo:go",
			userId: OTHER_USER_ID,
			message,
		})

		await dispatchComponent(asInteraction(foreign), registry)

		expect(handler).not.toHaveBeenCalled()
		expect(foreign.replies[0]?.content).toBe(
			"Only the original user can interact with this button."
		)

		const owner = new FakeButtonInteraction({
			customId: "demo:go",
			userId: OWNER_ID,
			message,
		})

		await dispatchComponent(asInteraction(owner), registry)

		expect(handler).toHaveBeenCalledOnce()
	})

	it("strips components and closes the view on expiry", async () => {
		const registry = createComponentRegistry()
		const message = new FakeMessage()
		const view = openTestView(registry, { message, time: 1 })

		await vi.waitFor(() => {
			expect(view.closed).toBe(true)
			expect(message.edits.at(-1)?.components).toEqual([])
		})
	})

	it("strips components when the collector ends", async () => {
		const registry = createComponentRegistry()
		const message = new FakeMessage()
		const view = openTestView(registry, { message })

		await getCollector(message).emit("end")

		expect(view.closed).toBe(true)
		expect(message.edits.at(-1)?.components).toEqual([])
	})

	it("scopes modal submits to the view owner", async () => {
		const registry = createComponentRegistry()
		const message = new FakeMessage()
		const view = openTestView(registry, { message })

		const button = new FakeButtonInteraction({
			customId: "demo:session:search",
			userId: OWNER_ID,
		})

		const pending = view.awaitModal({
			buttonInteraction: asButton(button),
			customId: "demo:session:modal",
			time: 60_000,
		})

		const submission = new FakeModalSubmitInteraction({
			customId: "demo:session:modal",
			userId: OWNER_ID,
			values: {},
		})

		expect(button.submitModal(submission)).toBe(true)
		await expect(pending).resolves.toBe(submission)

		const foreign = new FakeModalSubmitInteraction({
			customId: "demo:session:modal",
			userId: OTHER_USER_ID,
			values: {},
		})

		expect(button.submitModal(foreign)).toBe(false)
	})
})
