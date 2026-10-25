import type { Client, Interaction, Message } from "discord.js"
import { describe, expect, it, vi } from "vitest"
import { defineButton } from "@/core/components/define-component"
import { componentRegistry } from "@/core/components/registry"
import { interactionCreateListeners } from "@/features/system/events/interaction-create"
import {
	FakeButtonInteraction,
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

const client = {} as Client
const componentListener = interactionCreateListeners[0]

function asInteraction(
	interaction: FakeButtonInteraction | FakeModalSubmitInteraction
): Interaction {
	return interaction as unknown as Interaction
}

describe("component interaction listener", () => {
	it("routes static buttons through ownership checks", async () => {
		const handler = vi.fn()
		const message = new FakeMessage()
		message.interactionMetadata = { user: { id: "owner" } }

		componentRegistry.register([
			defineButton({
				feature: "listener-test",
				match: (customId) => customId === "listener-test:go",
				ownerOnly: true,
				onButton: handler,
			}),
		])

		const foreign = new FakeButtonInteraction({
			customId: "listener-test:go",
			userId: "foreign",
			message,
		})
		expect(
			await componentListener.execute(client, asInteraction(foreign))
		).toBe(false)
		expect(handler).not.toHaveBeenCalled()
		expect(foreign.replies[0]?.content).toBe(
			"Only the original user can interact with this button."
		)

		const owner = new FakeButtonInteraction({
			customId: "listener-test:go",
			userId: "owner",
			message,
		})
		expect(
			await componentListener.execute(client, asInteraction(owner))
		).toBe(false)
		expect(handler).toHaveBeenCalledOnce()
	})

	it("leaves open views to their message collector", async () => {
		const message = new FakeMessage()
		const handler = vi.fn()
		const view = componentRegistry.openView({
			feature: "listener-view",
			sessionId: "session",
			ownerId: "owner",
			message: message as unknown as Message,
			time: 60_000,
			onButton: handler,
		})

		try {
			const button = new FakeButtonInteraction({
				customId: "listener-view:session:go",
				userId: "owner",
			})
			expect(
				await componentListener.execute(client, asInteraction(button))
			).toBe(undefined)
			await message.collector?.emit("collect", button)
			expect(handler).toHaveBeenCalledOnce()
		} finally {
			await view.close()
		}
	})

	it("routes modal submits to the open view", async () => {
		const message = new FakeMessage()
		const handler = vi.fn()
		const view = componentRegistry.openView({
			feature: "listener-modal-view",
			sessionId: "session",
			ownerId: "owner",
			message: message as unknown as Message,
			time: 60_000,
			onModal: handler,
		})

		try {
			const modal = new FakeModalSubmitInteraction({
				customId: "listener-modal-view:session:search-modal",
				userId: "owner",
				values: {},
			})

			expect(
				await componentListener.execute(client, asInteraction(modal))
			).toBe(false)
			expect(handler).toHaveBeenCalledOnce()
		} finally {
			await view.close()
		}
	})

	it("does not consume command interactions", async () => {
		const command = {
			isButton: () => false,
			isModalSubmit: () => false,
		} as unknown as Interaction

		expect(await componentListener.execute(client, command)).toBeUndefined()
	})
})
