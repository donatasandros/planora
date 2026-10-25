import { type Client, Collection, MessageFlags } from "discord.js"
import { describe, expect, it, vi } from "vitest"
import { execute } from "@/features/utility/commands/info"
import {
	asCommandInteraction,
	FakeChatInputCommandInteraction,
} from "@/test/fakes"

vi.mock("@/features/utility/utils/system-info", () => ({
	getSystemInfo: vi.fn(async () => ({
		process: { cpuUsage: 1, memoryUsage: 2 },
		system: {
			platform: "linux x64",
			totalMemory: 3,
			nodeVersion: "v22",
		},
	})),
}))

function makeClient(): Client {
	return {
		application: { owner: { id: "owner-1" } },
		guilds: { cache: new Collection() },
		uptime: 1_000,
		ws: { ping: 10 },
	} as unknown as Client
}

describe("info command", () => {
	it("runs for the application owner", async () => {
		const interaction = new FakeChatInputCommandInteraction({
			userId: "owner-1",
		})

		await execute(makeClient(), asCommandInteraction(interaction))

		expect(interaction.deferred).toBe(true)
		expect(interaction.replies).toEqual([])
		expect(interaction.editReplies).toHaveLength(1)
	})

	it("denies non-owners before deferring", async () => {
		const interaction = new FakeChatInputCommandInteraction({
			userId: "user-1",
		})

		await execute(makeClient(), asCommandInteraction(interaction))

		expect(interaction.deferred).toBe(false)
		expect(interaction.editReplies).toEqual([])
		expect(interaction.replies).toEqual([
			{
				content: "Not available.",
				flags: MessageFlags.Ephemeral,
			},
		])
	})
})
