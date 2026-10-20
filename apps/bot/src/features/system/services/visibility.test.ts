import { beforeEach, describe, expect, it, vi } from "vitest"
import type { User } from "@/features/system/types"
import { resolveProfileVisibility } from "./visibility"

const { resolveUser } = vi.hoisted(() => ({
	resolveUser: vi.fn(),
}))

vi.mock("@/features/system/services/users", () => ({
	resolveUser,
}))

const VIEWER_ID = "viewer"
const TARGET_ID = "target"

function mockUser(overrides: Partial<User> = {}): void {
	resolveUser.mockResolvedValue({
		kind: "found",
		user: {
			id: TARGET_ID,
			isTrackingEnabled: true,
			isProfilePrivate: false,
			isBlacklisted: false,
			...overrides,
		},
	})
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe("resolveProfileVisibility", () => {
	it("denies access when the user cannot be resolved", async () => {
		resolveUser.mockResolvedValue({ kind: "unavailable" })

		const result = await resolveProfileVisibility(VIEWER_ID, TARGET_ID, {
			isDirectMessage: false,
		})

		expect(result).toEqual({ allowed: false, reason: "unavailable" })
	})

	it("denies access to a blacklisted profile", async () => {
		mockUser({ isBlacklisted: true })

		const result = await resolveProfileVisibility(VIEWER_ID, TARGET_ID, {
			isDirectMessage: false,
		})

		expect(result).toEqual({ allowed: false, reason: "blacklisted" })
	})

	it("denies access when the target has tracking disabled", async () => {
		mockUser({ isTrackingEnabled: false })

		const result = await resolveProfileVisibility(VIEWER_ID, TARGET_ID, {
			isDirectMessage: false,
		})

		expect(result).toEqual({ allowed: false, reason: "untracked" })
	})

	it("allows a user with tracking disabled to view their own profile", async () => {
		mockUser({ isTrackingEnabled: false })

		const result = await resolveProfileVisibility(TARGET_ID, TARGET_ID, {
			isDirectMessage: false,
		})

		expect(result).toEqual({ allowed: true, ephemeral: false })
	})

	it("allows viewing your own profile in a direct message", async () => {
		mockUser({ isProfilePrivate: true })

		const result = await resolveProfileVisibility(TARGET_ID, TARGET_ID, {
			isDirectMessage: true,
		})

		expect(result).toEqual({ allowed: true, ephemeral: false })
		expect(resolveUser).toHaveBeenCalledWith(TARGET_ID)
	})

	it("allows viewing a public profile", async () => {
		mockUser()

		const result = await resolveProfileVisibility(VIEWER_ID, TARGET_ID, {
			isDirectMessage: false,
		})

		expect(result).toEqual({ allowed: true, ephemeral: false })
	})

	it("allows viewing your own private profile ephemerally", async () => {
		mockUser({ isProfilePrivate: true })

		const result = await resolveProfileVisibility(TARGET_ID, TARGET_ID, {
			isDirectMessage: false,
		})

		expect(result).toEqual({ allowed: true, ephemeral: true })
	})

	it("denies viewing someone else's private profile", async () => {
		mockUser({ isProfilePrivate: true })

		const result = await resolveProfileVisibility(VIEWER_ID, TARGET_ID, {
			isDirectMessage: false,
		})

		expect(result).toEqual({ allowed: false, reason: "private" })
	})
})
