import type { Client } from "discord.js"
import { describe, expect, it, vi } from "vitest"
import { deployCommands } from "@/core/commands/registry"
import { logger } from "@/core/logger"

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

type CommandPayload = Parameters<typeof deployCommands>[1]

const payload = [{ name: "test" }] as CommandPayload

function createClient({
	devGuildId,
	hasApplication = true,
}: {
	devGuildId?: string
	hasApplication?: boolean
} = {}) {
	const globalSet = vi.fn(async () => [])
	const guildSet = vi.fn(async () => [])
	const cache = new Map<string, unknown>()

	if (devGuildId) {
		cache.set(devGuildId, { commands: { set: guildSet } })
	}

	const client = {
		application: hasApplication ? { commands: { set: globalSet } } : null,
		guilds: { cache },
	} as unknown as Client

	return { client, globalSet, guildSet }
}

describe("deployCommands", () => {
	it("deploys globally when no dev guild is configured", async () => {
		const { client, globalSet, guildSet } = createClient()

		await deployCommands(client, payload, undefined)

		expect(globalSet).toHaveBeenCalledWith(payload)
		expect(guildSet).not.toHaveBeenCalled()
	})

	it("deploys only to the dev guild when configured", async () => {
		const { client, globalSet, guildSet } = createClient({
			devGuildId: "guild-1",
		})

		await deployCommands(client, payload, "guild-1")

		expect(guildSet).toHaveBeenCalledWith(payload)
		expect(globalSet).not.toHaveBeenCalled()
	})

	it("skips deployment when the dev guild is not cached", async () => {
		const { client, globalSet, guildSet } = createClient()

		await deployCommands(client, payload, "missing-guild")

		expect(globalSet).not.toHaveBeenCalled()
		expect(guildSet).not.toHaveBeenCalled()
		expect(logger.error).toHaveBeenCalledWith(
			{ guildId: "missing-guild" },
			"DISCORD_DEV_GUILD_ID set but guild is not cached; skipping deployment"
		)
	})

	it("skips global deployment when the application is unavailable", async () => {
		const { client, globalSet, guildSet } = createClient({
			hasApplication: false,
		})

		await deployCommands(client, payload, undefined)

		expect(globalSet).not.toHaveBeenCalled()
		expect(guildSet).not.toHaveBeenCalled()
		expect(logger.warn).toHaveBeenCalledWith(
			"client.application is undefined; skipping deployment"
		)
	})
})
