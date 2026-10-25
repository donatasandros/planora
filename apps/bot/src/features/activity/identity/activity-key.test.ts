import { type Activity, ActivityType } from "discord.js"
import { describe, expect, it } from "vitest"
import { getActivityKey } from "@/features/activity/identity/activity-key"

function makeActivity(overrides: Partial<Activity> = {}): Activity {
	return {
		name: "Game",
		type: ActivityType.Playing,
		applicationId: null,
		...overrides,
	} as unknown as Activity
}

describe("getActivityKey", () => {
	it("encodes type, application and name", () => {
		expect(getActivityKey(makeActivity())).toBe("0::Game")
		expect(getActivityKey(makeActivity({ applicationId: "123" }))).toBe(
			"0:123:Game"
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
})
