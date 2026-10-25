import { describe, expect, it } from "vitest"
import { partitionStaleSessions } from "@/features/activity/sweeper/partition-sessions"
import type {
	ActiveActivitySession,
	ActiveActivitySessions,
} from "@/features/activity/types"

const STALE_SECONDS = 15 * 60 // 15 minutes

function session(id: string, lastSeenAt: number): ActiveActivitySession {
	return {
		id,
		activityKey: `0::${id}`,
		activityName: id,
		activityType: 0,
		applicationId: null,
		isCustom: false,
		startedAt: lastSeenAt - 60,
		lastSeenAt,
	}
}

describe("partitionStaleSessions", () => {
	it("returns empty partitions for no sessions", () => {
		expect(partitionStaleSessions({}, 1_000, STALE_SECONDS)).toEqual({
			stale: [],
			active: {},
		})
	})

	it("keeps recent sessions active", () => {
		const sessions: ActiveActivitySessions = {
			a: session("a", 999),
		}

		expect(partitionStaleSessions(sessions, 1_000, STALE_SECONDS)).toEqual({
			stale: [],
			active: sessions,
		})
	})

	it("treats sessions older than the threshold as stale", () => {
		const sessions: ActiveActivitySessions = {
			a: session("a", 99),
		}
		const result = partitionStaleSessions(sessions, 1_000, STALE_SECONDS)

		expect(result.stale).toEqual([["a", sessions.a]])
		expect(result.active).toEqual({})
	})

	it("keeps sessions exactly at the threshold active", () => {
		const sessions: ActiveActivitySessions = {
			a: session("a", 100),
		}

		expect(partitionStaleSessions(sessions, 1_000, STALE_SECONDS)).toEqual({
			stale: [],
			active: sessions,
		})
	})

	it("splits mixed sessions and preserves their keys", () => {
		const staleSession = session("stale", 50)
		const activeSession = session("active", 950)
		const sessions: ActiveActivitySessions = {
			stale: staleSession,
			active: activeSession,
		}
		const result = partitionStaleSessions(sessions, 1_000, STALE_SECONDS)

		expect(result.stale).toEqual([["stale", staleSession]])
		expect(result.active).toEqual({ active: activeSession })
	})
})
