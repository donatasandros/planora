import { type Client, MessageFlags } from "discord.js"
import { describe, expect, it, vi } from "vitest"
import {
	ensureApplicationOwner,
	isApplicationOwner,
} from "@/shared/discord/owner"
import {
	asCommandInteraction,
	FakeChatInputCommandInteraction,
} from "@/test/fakes"

function makeClient(owner: unknown, fetchedOwner: unknown = owner): Client {
	return {
		application: {
			owner,
			fetch: vi.fn(async () => ({ owner: fetchedOwner })),
		},
	} as unknown as Client
}

describe("isApplicationOwner", () => {
	it("accepts the user owner", async () => {
		await expect(
			isApplicationOwner(makeClient({ id: "owner-1" }), "owner-1")
		).resolves.toBe(true)
	})

	it("accepts the team owner", async () => {
		await expect(
			isApplicationOwner(makeClient({ ownerId: "owner-1" }), "owner-1")
		).resolves.toBe(true)
	})

	it("rejects another user", async () => {
		await expect(
			isApplicationOwner(makeClient({ id: "owner-1" }), "user-1")
		).resolves.toBe(false)
	})

	it("fetches a missing owner", async () => {
		await expect(
			isApplicationOwner(makeClient(null, { id: "owner-1" }), "owner-1")
		).resolves.toBe(true)
	})

	it("rejects when the fetched owner is still missing", async () => {
		await expect(
			isApplicationOwner(makeClient(null, null), "owner-1")
		).resolves.toBe(false)
	})

	it("rejects a null team owner", async () => {
		await expect(
			isApplicationOwner(makeClient({ ownerId: null }), "owner-1")
		).resolves.toBe(false)
	})

	it("rejects when fetch fails", async () => {
		const client = {
			application: {
				owner: null,
				fetch: vi.fn(async () => {
					throw new Error("fetch failed")
				}),
			},
		} as unknown as Client

		await expect(isApplicationOwner(client, "owner-1")).resolves.toBe(false)
	})

	it("rejects a missing application", async () => {
		await expect(isApplicationOwner({} as Client, "owner-1")).resolves.toBe(
			false
		)
	})
})

describe("ensureApplicationOwner", () => {
	it("allows the owner", async () => {
		const interaction = new FakeChatInputCommandInteraction({
			userId: "owner-1",
		})

		await expect(
			ensureApplicationOwner(
				makeClient({ id: "owner-1" }),
				asCommandInteraction(interaction)
			)
		).resolves.toBe(true)

		expect(interaction.replied).toBe(false)
	})

	it("denies a non-owner with an ephemeral reply", async () => {
		const interaction = new FakeChatInputCommandInteraction({
			userId: "user-1",
		})

		await expect(
			ensureApplicationOwner(
				makeClient({ id: "owner-1" }),
				asCommandInteraction(interaction)
			)
		).resolves.toBe(false)

		expect(interaction.replies).toEqual([
			{
				content: "Not available.",
				flags: MessageFlags.Ephemeral,
			},
		])
	})
})
