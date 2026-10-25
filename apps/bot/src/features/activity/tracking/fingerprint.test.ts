import { type Activity, ActivityType, type Presence } from "discord.js"
import { describe, expect, it } from "vitest"
import {
	createFingerprintMemo,
	getPresenceFingerprint,
	hashFingerprint,
} from "@/features/activity/tracking/fingerprint"

function makeActivity(
	name: string,
	overrides: Partial<Activity> = {}
): Activity {
	return {
		type: ActivityType.Playing,
		name,
		applicationId: null,
		url: null,
		details: null,
		state: null,
		...overrides,
	} as unknown as Activity
}

function makePresence(
	overrides: { status?: string; activities?: Activity[] } = {}
): Presence {
	return {
		status: "online",
		activities: [],
		...overrides,
	} as unknown as Presence
}

describe("getPresenceFingerprint", () => {
	it("is stable regardless of activity order", () => {
		const first = makePresence({
			activities: [makeActivity("Game"), makeActivity("Music")],
		})
		const second = makePresence({
			activities: [makeActivity("Music"), makeActivity("Game")],
		})

		expect(getPresenceFingerprint(first)).toBe(getPresenceFingerprint(second))
	})

	it("changes when activity details change", () => {
		const base = makePresence({
			activities: [makeActivity("Game", { state: "menu" })],
		})
		const changed = makePresence({
			activities: [makeActivity("Game", { state: "playing" })],
		})

		expect(getPresenceFingerprint(base)).not.toBe(
			getPresenceFingerprint(changed)
		)
	})

	it("changes when status changes", () => {
		expect(
			getPresenceFingerprint(makePresence({ status: "online" }))
		).not.toBe(getPresenceFingerprint(makePresence({ status: "idle" })))
	})
})

describe("hashFingerprint", () => {
	it("returns a sha256 hex digest", () => {
		expect(hashFingerprint("presence")).toMatch(/^[a-f0-9]{64}$/)
	})
})

describe("createFingerprintMemo", () => {
	it("misses until the fingerprint is remembered", () => {
		const memo = createFingerprintMemo(1_000, 10)

		expect(memo.isMemoized("user-1", "hash-1")).toBe(false)

		memo.remember("user-1", "hash-1")

		expect(memo.isMemoized("user-1", "hash-1")).toBe(true)
	})

	it("invalidates a changed fingerprint", () => {
		const memo = createFingerprintMemo(1_000, 10)

		memo.remember("user-1", "hash-1")

		expect(memo.isMemoized("user-1", "hash-2")).toBe(false)
		expect(memo.isMemoized("user-1", "hash-1")).toBe(false)
	})

	it("expires entries after the ttl", () => {
		let now = 1_000
		const memo = createFingerprintMemo(100, 10, () => now)

		memo.remember("user-1", "hash-1")

		now = 1_099
		expect(memo.isMemoized("user-1", "hash-1")).toBe(true)

		now = 1_100
		expect(memo.isMemoized("user-1", "hash-1")).toBe(false)
	})

	it("overwrites an existing entry", () => {
		let now = 1_000
		const memo = createFingerprintMemo(100, 10, () => now)

		memo.remember("user-1", "hash-1")
		now = 1_050
		memo.remember("user-1", "hash-2")

		expect(memo.isMemoized("user-1", "hash-2")).toBe(true)
		expect(memo.isMemoized("user-1", "hash-1")).toBe(false)
	})

	it("evicts the oldest entry at capacity", () => {
		const memo = createFingerprintMemo(1_000, 2)

		memo.remember("user-1", "hash-1")
		memo.remember("user-2", "hash-2")
		memo.remember("user-3", "hash-3")

		expect(memo.isMemoized("user-1", "hash-1")).toBe(false)
		expect(memo.isMemoized("user-2", "hash-2")).toBe(true)
		expect(memo.isMemoized("user-3", "hash-3")).toBe(true)
	})
})
