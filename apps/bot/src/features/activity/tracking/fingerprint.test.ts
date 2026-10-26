import { type Activity, ActivityType, type Presence } from "discord.js"
import { describe, expect, it } from "vitest"
import {
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
