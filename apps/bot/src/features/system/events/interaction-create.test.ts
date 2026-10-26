import { claim } from "@workspace/redis"
import {
	type Client,
	Collection,
	type Interaction,
	type Message,
	SlashCommandBuilder,
} from "discord.js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CommandModule } from "@/core/commands/types"
import { defineButton } from "@/core/components/define-component"
import { componentRegistry } from "@/core/components/registry"
import { interactionCreateListeners } from "@/features/system/events/interaction-create"
import { INTERACTION_COOLDOWN_MESSAGE } from "@/shared/discord/interaction"
import {
	asCommandInteraction,
	FakeButtonInteraction,
	FakeChatInputCommandInteraction,
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

vi.mock("@workspace/redis", () => ({
	claim: vi.fn(),
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

const commandListener = interactionCreateListeners[1]

function commandPayload(): SlashCommandBuilder {
	return new SlashCommandBuilder()
		.setName("activity")
		.setDescription("View activity statistics.")
}

function commandClient(command: CommandModule): Client {
	return {
		commands: new Collection([[command.data.name, command]]),
	} as unknown as Client
}

describe("command interaction listener", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("runs a command that has no cooldown", async () => {
		const execute = vi.fn().mockResolvedValue(undefined)
		const command: CommandModule = {
			data: commandPayload(),
			execute,
		}
		const interaction = new FakeChatInputCommandInteraction()

		await commandListener.execute(
			commandClient(command),
			asCommandInteraction(interaction)
		)

		expect(execute).toHaveBeenCalledOnce()
		expect(vi.mocked(claim)).not.toHaveBeenCalled()
	})

	it("runs the interaction that wins the cooldown claim", async () => {
		vi.mocked(claim).mockResolvedValue(true)

		const execute = vi.fn().mockResolvedValue(undefined)
		const command: CommandModule = {
			data: commandPayload(),
			cooldownSeconds: 5,
			execute,
		}
		const interaction = new FakeChatInputCommandInteraction()

		await commandListener.execute(
			commandClient(command),
			asCommandInteraction(interaction)
		)

		expect(vi.mocked(claim)).toHaveBeenCalledWith(
			"bot:cmd:activity:user-1",
			5
		)
		expect(execute).toHaveBeenCalledOnce()
	})

	it("replies ephemerally and skips execution while on cooldown", async () => {
		vi.mocked(claim).mockResolvedValue(false)

		const execute = vi.fn().mockResolvedValue(undefined)
		const command: CommandModule = {
			data: commandPayload(),
			cooldownSeconds: 5,
			execute,
		}
		const interaction = new FakeChatInputCommandInteraction()

		await commandListener.execute(
			commandClient(command),
			asCommandInteraction(interaction)
		)

		expect(execute).not.toHaveBeenCalled()
		expect(interaction.replies).toHaveLength(1)
		expect(interaction.replies[0]?.content).toBe(INTERACTION_COOLDOWN_MESSAGE)
		expect(interaction.deferred).toBe(false)
	})
})
