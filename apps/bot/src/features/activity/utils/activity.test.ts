import { type Activity, ActivityType } from "discord.js"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
	buildActivitySession,
	getActiveSessionsKey,
	getActivityStartTime,
	isCustomActivity,
} from "@/features/activity/utils/activity"

const FIXED_NOW_MS = 1_700_000_000_000

function makeActivity(overrides: Partial<Activity> = {}): Activity {
	return {
		name: "Game",
		type: ActivityType.Playing,
		applicationId: null,
		timestamps: null,
		...overrides,
	} as unknown as Activity
}

afterEach(() => {
	vi.useRealTimers()
})

describe("getActiveSessionsKey", () => {
	it("namespaces the key by user", () => {
		expect(getActiveSessionsKey("42")).toBe("activity:active:42")
	})
})

describe("isCustomActivity", () => {
	it("detects custom activities", () => {
		expect(
			isCustomActivity(makeActivity({ type: ActivityType.Custom }))
		).toBe(true)
		expect(
			isCustomActivity(makeActivity({ type: ActivityType.Playing }))
		).toBe(false)
	})
})

describe("getActivityStartTime", () => {
	it("uses the activity start timestamp when present", () => {
		const activity = makeActivity({
			timestamps: {
				start: new Date(FIXED_NOW_MS),
				end: null,
			},
		})

		expect(getActivityStartTime(activity)).toBe(1700000000)
	})

	it("falls back to now when there is no start timestamp", () => {
		vi.useFakeTimers()
		vi.setSystemTime(FIXED_NOW_MS)

		expect(getActivityStartTime(makeActivity())).toBe(1700000000)
		expect(getActivityStartTime(makeActivity({ timestamps: null }))).toBe(
			1700000000
		)
	})
})

describe("buildActivitySession", () => {
	it("maps the activity onto an active session", () => {
		vi.useFakeTimers()
		vi.setSystemTime(FIXED_NOW_MS)

		const activity = makeActivity({
			name: "Game",
			type: ActivityType.Playing,
			applicationId: "123",
		})
		const session = buildActivitySession(activity, 1600000000)

		expect(session).toMatchObject({
			activityKey: "0:123:Game",
			activityName: "Game",
			activityType: ActivityType.Playing,
			applicationId: "123",
			isCustom: false,
			startedAt: 1600000000,
			lastSeenAt: 1700000000,
		})
		expect(typeof session.id).toBe("string")
		expect(session.id.length).toBeGreaterThan(0)
	})

	it("normalises a missing applicationId to null", () => {
		vi.useFakeTimers()
		vi.setSystemTime(FIXED_NOW_MS)

		const session = buildActivitySession(makeActivity(), 0)

		expect(session.applicationId).toBeNull()
	})

	it("generates a unique id per session", () => {
		vi.useFakeTimers()
		vi.setSystemTime(FIXED_NOW_MS)

		const a = buildActivitySession(makeActivity(), 0)
		const b = buildActivitySession(makeActivity(), 0)

		expect(a.id).not.toBe(b.id)
	})
})
