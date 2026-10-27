import { type Activity, ActivityType } from "discord.js"
import { describe, expect, it } from "vitest"
import { getActivityKey } from "@/features/activity/identity/activity-key"
import { planUserSweep } from "@/features/activity/sweeper/plan-user-sweep"
import type {
	ActiveActivitySession,
	ActiveActivitySessions,
} from "@/features/activity/types"

const NOW = 1_700_000_000
const STALE_SECONDS = 900

function activity(overrides: Partial<Activity> = {}): Activity {
	return {
		type: ActivityType.Playing,
		name: "Chess",
		applicationId: "app-1",
		...overrides,
	} as Activity
}

function session(
	overrides: Partial<ActiveActivitySession> = {}
): ActiveActivitySession {
	return {
		id: "session-1",
		activityKey: getActivityKey(activity()),
		activityName: "Chess",
		activityType: ActivityType.Playing,
		applicationId: "app-1",
		isCustom: false,
		startedAt: NOW - 3600,
		lastSeenAt: NOW - 1200,
		...overrides,
	}
}

function asMap(value: ActiveActivitySession): ActiveActivitySessions {
	return { [value.activityKey]: value }
}

describe("planUserSweep", () => {
	it("leaves fresh sessions alone", () => {
		const sessions = asMap(session({ lastSeenAt: NOW - 60 }))

		const plan = planUserSweep({
			sessions,
			activities: [activity()],
			trackCustom: false,
			now: NOW,
			staleSeconds: STALE_SECONDS,
		})

		expect(plan).toEqual({
			refreshed: 0,
			finish: [],
			keep: sessions,
			deferred: {},
		})
	})

	it("keeps a stale session whose activity is still present", () => {
		const target = session()

		const plan = planUserSweep({
			sessions: asMap(target),
			activities: [activity()],
			trackCustom: false,
			now: NOW,
			staleSeconds: STALE_SECONDS,
		})

		expect(plan.refreshed).toBe(1)
		expect(plan.finish).toEqual([])
		expect(plan.keep[target.activityKey]?.lastSeenAt).toBe(NOW)
	})

	it("ends a stale session whose activity is gone", () => {
		const plan = planUserSweep({
			sessions: asMap(session()),
			activities: [activity({ name: "Something else" })],
			trackCustom: false,
			now: NOW,
			staleSeconds: STALE_SECONDS,
		})

		expect(plan.refreshed).toBe(0)
		expect(plan.finish).toEqual([
			{
				id: "session-1",
				endedAt: NOW - 1200,
				durationSeconds: 2400,
			},
		])
		expect(plan.keep).toEqual({})
	})

	it("ends a stale session when presence is unknown", () => {
		const plan = planUserSweep({
			sessions: asMap(session()),
			activities: undefined,
			trackCustom: false,
			now: NOW,
			staleSeconds: STALE_SECONDS,
		})

		expect(plan.finish).toEqual([
			{
				id: "session-1",
				endedAt: NOW - 1200,
				durationSeconds: 2400,
			},
		])
	})

	it("defers an unknown presence on the boot tick", () => {
		const target = session()

		const plan = planUserSweep({
			sessions: asMap(target),
			activities: undefined,
			trackCustom: false,
			now: NOW,
			staleSeconds: STALE_SECONDS,
			deferUnknown: true,
		})

		expect(plan.refreshed).toBe(0)
		expect(plan.finish).toEqual([])
		expect(plan.deferred).toEqual(asMap(target))
		expect(plan.deferred[target.activityKey]?.lastSeenAt).toBe(NOW - 1200)
	})

	it("still ends an observed absence on the boot tick", () => {
		const plan = planUserSweep({
			sessions: asMap(session()),
			activities: [activity({ name: "Something else" })],
			trackCustom: false,
			now: NOW,
			staleSeconds: STALE_SECONDS,
			deferUnknown: true,
		})

		expect(plan.finish).toEqual([
			{
				id: "session-1",
				endedAt: NOW - 1200,
				durationSeconds: 2400,
			},
		])
		expect(plan.deferred).toEqual({})
	})

	it("keeps fresh sessions untouched on the boot tick", () => {
		const fresh = session({ lastSeenAt: NOW - 60 })

		const plan = planUserSweep({
			sessions: asMap(fresh),
			activities: undefined,
			trackCustom: false,
			now: NOW,
			staleSeconds: STALE_SECONDS,
			deferUnknown: true,
		})

		expect(plan.keep).toEqual(asMap(fresh))
		expect(plan.deferred).toEqual({})
	})

	it("ends a custom session when custom activities are not tracked", () => {
		const custom = activity({ type: ActivityType.Custom, name: "hello" })
		const target = session({
			activityKey: getActivityKey(custom),
			activityName: "hello",
			activityType: ActivityType.Custom,
			isCustom: true,
		})

		const plan = planUserSweep({
			sessions: asMap(target),
			activities: [custom],
			trackCustom: false,
			now: NOW,
			staleSeconds: STALE_SECONDS,
		})

		expect(plan.refreshed).toBe(0)
		expect(plan.finish).toHaveLength(1)
	})

	it("splits fresh, still-present, and ended sessions in one pass", () => {
		const chess = activity()
		const doom = activity({ name: "Doom", applicationId: "app-2" })
		const gone = activity({ name: "Gone", applicationId: "app-3" })

		const fresh = session({
			id: "fresh",
			activityKey: getActivityKey(chess),
			lastSeenAt: NOW - 60,
		})
		const present = session({
			id: "present",
			activityKey: getActivityKey(doom),
			activityName: "Doom",
		})
		const absent = session({
			id: "absent",
			activityKey: getActivityKey(gone),
			activityName: "Gone",
		})

		const plan = planUserSweep({
			sessions: {
				[fresh.activityKey]: fresh,
				[present.activityKey]: present,
				[absent.activityKey]: absent,
			},
			activities: [chess, doom],
			trackCustom: false,
			now: NOW,
			staleSeconds: STALE_SECONDS,
		})

		expect(plan.refreshed).toBe(1)
		expect(plan.finish).toEqual([
			{
				id: "absent",
				endedAt: NOW - 1200,
				durationSeconds: 2400,
			},
		])
		expect(Object.keys(plan.keep).sort()).toEqual(
			[fresh.activityKey, present.activityKey].sort()
		)
		expect(plan.keep[fresh.activityKey]?.lastSeenAt).toBe(NOW - 60)
		expect(plan.keep[present.activityKey]?.lastSeenAt).toBe(NOW)
	})

	it("does not truncate a session longer than the stale window", () => {
		const target = session({
			startedAt: NOW - 10_800,
			lastSeenAt: NOW - 1200,
		})

		const plan = planUserSweep({
			sessions: asMap(target),
			activities: [activity()],
			trackCustom: false,
			now: NOW,
			staleSeconds: STALE_SECONDS,
		})

		expect(plan.refreshed).toBe(1)
		expect(plan.finish).toEqual([])
	})
})
