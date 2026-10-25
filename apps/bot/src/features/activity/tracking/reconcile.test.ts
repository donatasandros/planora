import { type Activity, ActivityType } from "discord.js"
import { describe, expect, it } from "vitest"
import { getActivityKey } from "@/features/activity/identity/activity-key"
import { reconcileSessions } from "@/features/activity/tracking/reconcile"
import type {
	ActiveActivitySession,
	ActiveActivitySessions,
} from "@/features/activity/types"

function makeActivity(
	name: string,
	overrides: Partial<Activity> = {}
): Activity {
	return {
		type: ActivityType.Playing,
		name,
		applicationId: null,
		...overrides,
	} as unknown as Activity
}

function makeSession(activity: Activity): ActiveActivitySession {
	return {
		id: `session-${activity.name}`,
		activityKey: getActivityKey(activity),
		activityName: activity.name,
		activityType: activity.type,
		applicationId: activity.applicationId ?? null,
		isCustom: activity.type === ActivityType.Custom,
		startedAt: 1_000,
		lastSeenAt: 1_000,
	}
}

function previousSessions(...activities: Activity[]): ActiveActivitySessions {
	return Object.fromEntries(
		activities.map((activity) => [
			getActivityKey(activity),
			makeSession(activity),
		])
	)
}

describe("reconcileSessions", () => {
	it("starts new activities", () => {
		const game = makeActivity("Game")

		const result = reconcileSessions({
			previous: {},
			activities: [game],
			trackCustom: true,
			now: 2_000,
		})

		expect(result.started).toEqual([game])
		expect(result.kept).toEqual([])
		expect(result.ended).toEqual([])
	})

	it("keeps existing activities and refreshes lastSeenAt", () => {
		const game = makeActivity("Game")
		const previous = previousSessions(game)

		const result = reconcileSessions({
			previous,
			activities: [game],
			trackCustom: true,
			now: 2_000,
		})

		expect(result.started).toEqual([])
		expect(result.kept).toEqual([
			{
				...previous[getActivityKey(game)],
				lastSeenAt: 2_000,
			},
		])
		expect(result.ended).toEqual([])
	})

	it("ends activities that disappeared", () => {
		const game = makeActivity("Game")
		const music = makeActivity("Music")
		const previous = previousSessions(game, music)

		const result = reconcileSessions({
			previous,
			activities: [game],
			trackCustom: true,
			now: 2_000,
		})

		expect(result.ended).toEqual([previous[getActivityKey(music)]])
	})

	it("ends every session when there are no activities", () => {
		const game = makeActivity("Game")
		const music = makeActivity("Music")
		const previous = previousSessions(game, music)

		const result = reconcileSessions({
			previous,
			activities: [],
			trackCustom: true,
			now: 2_000,
		})

		expect(result.started).toEqual([])
		expect(result.kept).toEqual([])
		expect(result.ended).toEqual([
			previous[getActivityKey(game)],
			previous[getActivityKey(music)],
		])
	})

	it("ignores custom activities when tracking is disabled", () => {
		const game = makeActivity("Game")
		const custom = makeActivity("Custom", { type: ActivityType.Custom })
		const previous = previousSessions(game)

		const result = reconcileSessions({
			previous,
			activities: [custom],
			trackCustom: false,
			now: 2_000,
		})

		expect(result.started).toEqual([])
		expect(result.kept).toEqual([])
		expect(result.ended).toEqual([previous[getActivityKey(game)]])
	})

	it("starts custom activities when tracking is enabled", () => {
		const custom = makeActivity("Custom", { type: ActivityType.Custom })

		const result = reconcileSessions({
			previous: {},
			activities: [custom],
			trackCustom: true,
			now: 2_000,
		})

		expect(result.started).toEqual([custom])
	})

	it("ends the old identity and starts the new one", () => {
		const game = makeActivity("Game")
		const other = makeActivity("Other")
		const previous = previousSessions(game)

		const result = reconcileSessions({
			previous,
			activities: [other],
			trackCustom: true,
			now: 2_000,
		})

		expect(result.started).toEqual([other])
		expect(result.kept).toEqual([])
		expect(result.ended).toEqual([previous[getActivityKey(game)]])
	})
})
