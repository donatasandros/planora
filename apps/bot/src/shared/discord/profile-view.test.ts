import { type ChatInputCommandInteraction, MessageFlags } from "discord.js"
import { describe, expect, it, vi } from "vitest"
import type { ProfileVisibility } from "@/features/system/types"
import { viewProfile } from "@/shared/discord/profile-view"
import { FakeChatInputCommandInteraction } from "@/test/fakes"

const VIEWER_ID = "viewer"
const TARGET_ID = "target"
const TARGET_USERNAME = "target-user"

const DENY_CASES: Array<{
	reason: "private" | "unavailable" | "blacklisted" | "untracked"
	content: string
}> = [
	{
		reason: "private",
		content: `${TARGET_USERNAME}'s profile is private.`,
	},
	{
		reason: "unavailable",
		content:
			"Could not verify access to this profile, please try again later.",
	},
	{
		reason: "blacklisted",
		content: `${TARGET_USERNAME}'s profile is not available.`,
	},
	{
		reason: "untracked",
		content: `${TARGET_USERNAME}'s profile is not available.`,
	},
]

function asCommandInteraction(
	interaction: FakeChatInputCommandInteraction
): ChatInputCommandInteraction {
	return interaction as unknown as ChatInputCommandInteraction
}

function resolverFor(visibility: ProfileVisibility) {
	return vi.fn(async () => visibility)
}

describe("viewProfile", () => {
	it("defers without an ephemeral flag when the profile is public", async () => {
		const interaction = new FakeChatInputCommandInteraction({
			userId: VIEWER_ID,
		})
		const resolveVisibility = resolverFor({
			allowed: true,
			ephemeral: false,
		})

		const result = await viewProfile({
			interaction: asCommandInteraction(interaction),
			targetUserId: TARGET_ID,
			targetUsername: TARGET_USERNAME,
			resolveVisibility,
		})

		expect(result).toEqual({ status: "allowed", ephemeral: false })
		expect(resolveVisibility).toHaveBeenCalledWith(VIEWER_ID, TARGET_ID, {
			isDirectMessage: false,
		})
		expect(interaction.deferred).toBe(true)
		expect(interaction.deferReplies).toHaveLength(1)
		expect(interaction.deferReplies[0]?.flags).toBeUndefined()
		expect(interaction.replies).toHaveLength(0)
	})

	it("defers ephemerally when viewing your own private profile", async () => {
		const interaction = new FakeChatInputCommandInteraction({
			userId: TARGET_ID,
		})
		const resolveVisibility = resolverFor({
			allowed: true,
			ephemeral: true,
		})

		const result = await viewProfile({
			interaction: asCommandInteraction(interaction),
			targetUserId: TARGET_ID,
			targetUsername: TARGET_USERNAME,
			resolveVisibility,
		})

		expect(result).toEqual({ status: "allowed", ephemeral: true })
		expect(interaction.deferred).toBe(true)
		expect(interaction.deferReplies[0]?.flags).toBe(MessageFlags.Ephemeral)
	})

	for (const denyCase of DENY_CASES) {
		it(`denies ${denyCase.reason} profiles ephemerally`, async () => {
			const interaction = new FakeChatInputCommandInteraction({
				userId: VIEWER_ID,
			})
			const resolveVisibility = resolverFor({
				allowed: false,
				reason: denyCase.reason,
			})

			const result = await viewProfile({
				interaction: asCommandInteraction(interaction),
				targetUserId: TARGET_ID,
				targetUsername: TARGET_USERNAME,
				resolveVisibility,
			})

			expect(result).toEqual({
				status: "denied",
				reason: denyCase.reason,
			})
			expect(interaction.deferred).toBe(false)
			expect(interaction.replies).toEqual([
				{
					content: denyCase.content,
					flags: MessageFlags.Ephemeral,
				},
			])
		})
	}

	it("detects direct messages from a missing guild", async () => {
		const interaction = new FakeChatInputCommandInteraction({
			userId: TARGET_ID,
			guildId: null,
		})
		const resolveVisibility = resolverFor({
			allowed: true,
			ephemeral: false,
		})

		await viewProfile({
			interaction: asCommandInteraction(interaction),
			targetUserId: TARGET_ID,
			targetUsername: TARGET_USERNAME,
			resolveVisibility,
		})

		expect(resolveVisibility).toHaveBeenCalledWith(TARGET_ID, TARGET_ID, {
			isDirectMessage: true,
		})
	})
})
