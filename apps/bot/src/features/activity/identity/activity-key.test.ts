import { type Activity, ActivityType } from "discord.js"
import { describe, expect, it } from "vitest"
import {
	getActivityIdentity,
	getActivityKey,
} from "@/features/activity/identity/activity-key"

function makeActivity(overrides: Partial<Activity> = {}): Activity {
	return {
		name: "Game",
		type: ActivityType.Playing,
		applicationId: null,
		...overrides,
	} as unknown as Activity
}

describe("getActivityIdentity", () => {
	it("normalizes the identity fields", () => {
		expect(getActivityIdentity(makeActivity())).toEqual({
			type: ActivityType.Playing,
			applicationId: null,
			name: "Game",
			isCustom: false,
		})
	})

	it("marks custom activities", () => {
		const activity = makeActivity({ type: ActivityType.Custom })

		expect(getActivityIdentity(activity).isCustom).toBe(true)
	})

	it("normalizes a missing application id to null", () => {
		const activity = makeActivity({ applicationId: undefined })

		expect(getActivityIdentity(activity).applicationId).toBeNull()
	})
})

describe("getActivityKey", () => {
	it("hashes the canonical identity", () => {
		expect(getActivityKey(makeActivity())).toBe(
			"350f9f11d8bb172f98f31a8574eb6a391ce8e40caed280eff3cad61c759328e5"
		)
	})

	it("is stable for identical activities", () => {
		expect(getActivityKey(makeActivity())).toBe(
			getActivityKey(makeActivity())
		)
	})

	it("distinguishes activities by application", () => {
		expect(getActivityKey(makeActivity({ applicationId: "1" }))).not.toBe(
			getActivityKey(makeActivity({ applicationId: "2" }))
		)
	})

	it("distinguishes activities by type", () => {
		expect(
			getActivityKey(makeActivity({ type: ActivityType.Playing }))
		).not.toBe(getActivityKey(makeActivity({ type: ActivityType.Watching })))
	})

	it("distinguishes activities by name", () => {
		expect(getActivityKey(makeActivity({ name: "Game" }))).not.toBe(
			getActivityKey(makeActivity({ name: "Other" }))
		)
	})

	it("distinguishes custom activities from other types", () => {
		expect(
			getActivityKey(makeActivity({ type: ActivityType.Custom }))
		).not.toBe(getActivityKey(makeActivity({ type: ActivityType.Playing })))
	})

	it("does not alias values containing the old delimiter", () => {
		const first = makeActivity({ applicationId: "x", name: "1:2" })
		const second = makeActivity({ applicationId: "x:1", name: "2" })

		expect(getActivityKey(first)).not.toBe(getActivityKey(second))
	})

	it("returns a sha256 hex digest, not the old joined key", () => {
		const key = getActivityKey(makeActivity())

		expect(key).toMatch(/^[0-9a-f]{64}$/)
		expect(key).not.toBe("0::Game")
	})
})
