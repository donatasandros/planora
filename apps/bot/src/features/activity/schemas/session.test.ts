import { describe, expect, it } from "vitest"
import { parseActiveSessions } from "@/features/activity/schemas/session"

const session = {
	id: "session-1",
	activityKey: "a".repeat(64),
	activityName: "Chess",
	activityType: 0,
	applicationId: null,
	isCustom: false,
	startedAt: 1_700_000_000,
	lastSeenAt: 1_700_000_100,
}

describe("parseActiveSessions", () => {
	it("accepts a valid map", () => {
		expect(parseActiveSessions({ [session.activityKey]: session })).toEqual({
			kind: "ok",
			sessions: { [session.activityKey]: session },
			dropped: 0,
		})
	})

	it("accepts an empty map", () => {
		expect(parseActiveSessions({})).toEqual({
			kind: "ok",
			sessions: {},
			dropped: 0,
		})
	})

	it("keeps valid entries and drops invalid ones", () => {
		const result = parseActiveSessions({
			first: session,
			corrupt: { ...session, id: undefined },
			third: { ...session, activityName: "Chess 2" },
		})

		expect(result).toEqual({
			kind: "ok",
			sessions: {
				first: session,
				third: { ...session, activityName: "Chess 2" },
			},
			dropped: 1,
		})
	})

	it("rejects an activity type that is not an integer", () => {
		const result = parseActiveSessions({
			bad: { ...session, activityType: 1.5 },
		})

		expect(result).toEqual({ kind: "ok", sessions: {}, dropped: 1 })
	})

	it("rejects a payload that is not a map", () => {
		for (const value of [null, undefined, "sessions", 7, [session]]) {
			expect(parseActiveSessions(value)).toEqual({ kind: "invalid" })
		}
	})
})
