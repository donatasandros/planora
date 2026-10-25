import { describe, expect, it, vi } from "vitest"
import { resolveProfileVisibility } from "@/features/system/services/visibility"
import type { User, UserResolution } from "@/features/system/types"

const VIEWER_ID = "viewer"
const TARGET_ID = "target"

function userResolution(overrides: Partial<User> = {}): UserResolution {
	return {
		kind: "found",
		user: {
			id: TARGET_ID,
			isTrackingEnabled: true,
			isProfilePrivate: false,
			isBlacklisted: false,
			...overrides,
		},
	}
}

function resolverFor(resolution: UserResolution) {
	return vi.fn(async () => resolution)
}

describe("resolveProfileVisibility", () => {
	it("denies access when the user cannot be resolved", async () => {
		const resolve = resolverFor({ kind: "unavailable" })

		const result = await resolveProfileVisibility(
			VIEWER_ID,
			TARGET_ID,
			{ isDirectMessage: false },
			resolve
		)

		expect(result).toEqual({ allowed: false, reason: "unavailable" })
		expect(resolve).toHaveBeenCalledWith(TARGET_ID)
	})

	it("denies access to a blacklisted profile", async () => {
		const resolve = resolverFor(userResolution({ isBlacklisted: true }))

		const result = await resolveProfileVisibility(
			VIEWER_ID,
			TARGET_ID,
			{ isDirectMessage: false },
			resolve
		)

		expect(result).toEqual({ allowed: false, reason: "blacklisted" })
	})

	it("denies another viewer when tracking is disabled", async () => {
		const resolve = resolverFor(userResolution({ isTrackingEnabled: false }))

		const result = await resolveProfileVisibility(
			VIEWER_ID,
			TARGET_ID,
			{ isDirectMessage: false },
			resolve
		)

		expect(result).toEqual({ allowed: false, reason: "untracked" })
	})

	it("allows a user with tracking disabled to view their own profile", async () => {
		const resolve = resolverFor(userResolution({ isTrackingEnabled: false }))

		const result = await resolveProfileVisibility(
			TARGET_ID,
			TARGET_ID,
			{ isDirectMessage: false },
			resolve
		)

		expect(result).toEqual({ allowed: true, ephemeral: false })
	})

	it("allows viewing your own private profile in a direct message", async () => {
		const resolve = resolverFor(userResolution({ isProfilePrivate: true }))

		const result = await resolveProfileVisibility(
			TARGET_ID,
			TARGET_ID,
			{ isDirectMessage: true },
			resolve
		)

		expect(result).toEqual({ allowed: true, ephemeral: false })
	})

	it("allows viewing a public profile", async () => {
		const resolve = resolverFor(userResolution())

		const result = await resolveProfileVisibility(
			VIEWER_ID,
			TARGET_ID,
			{ isDirectMessage: false },
			resolve
		)

		expect(result).toEqual({ allowed: true, ephemeral: false })
	})

	it("allows viewing your own private profile ephemerally", async () => {
		const resolve = resolverFor(userResolution({ isProfilePrivate: true }))

		const result = await resolveProfileVisibility(
			TARGET_ID,
			TARGET_ID,
			{ isDirectMessage: false },
			resolve
		)

		expect(result).toEqual({ allowed: true, ephemeral: true })
	})

	it("denies viewing someone else's private profile", async () => {
		const resolve = resolverFor(userResolution({ isProfilePrivate: true }))

		const result = await resolveProfileVisibility(
			VIEWER_ID,
			TARGET_ID,
			{ isDirectMessage: false },
			resolve
		)

		expect(result).toEqual({ allowed: false, reason: "private" })
	})
})
