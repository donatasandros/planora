import * as redis from "@workspace/redis"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
	getActiveSessions,
	setActiveSessions,
} from "@/features/activity/services/sessions"

vi.mock("@workspace/db", () => ({
	db: {},
	activitySessionsTable: {},
	activityTotalsTable: {},
	sql: vi.fn(),
	and: vi.fn(),
	eq: vi.fn(),
	isNull: vi.fn(),
}))

vi.mock("@workspace/redis", () => ({
	deleteKey: vi.fn(),
	deleteKeyStrict: vi.fn(),
	getJsonStrict: vi.fn(),
	setJson: vi.fn(),
	setJsonStrict: vi.fn(),
}))

vi.mock("@/core/logger", () => ({
	logger: {
		debug: vi.fn(),
		error: vi.fn(),
		fatal: vi.fn(),
		info: vi.fn(),
		trace: vi.fn(),
		warn: vi.fn(),
	},
}))

const mocked = vi.mocked(redis)

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

beforeEach(() => {
	vi.clearAllMocks()
})

describe("setActiveSessions", () => {
	it("writes through the strict setter", async () => {
		await setActiveSessions("42", { [session.activityKey]: session })

		expect(mocked.setJsonStrict).toHaveBeenCalledWith(
			"activity:active:42",
			{ [session.activityKey]: session },
			7 * 24 * 60 * 60
		)
		expect(mocked.setJson).not.toHaveBeenCalled()
	})

	it("propagates a write failure", async () => {
		mocked.setJsonStrict.mockRejectedValueOnce(new Error("redis down"))

		await expect(setActiveSessions("42", {})).rejects.toThrow("redis down")
	})
})

describe("getActiveSessions", () => {
	it("returns an empty map when the key is absent", async () => {
		mocked.getJsonStrict.mockResolvedValueOnce(null)

		await expect(getActiveSessions("42")).resolves.toEqual({})
	})

	it("propagates a read failure", async () => {
		mocked.getJsonStrict.mockRejectedValueOnce(new Error("redis down"))

		await expect(getActiveSessions("42")).rejects.toThrow("redis down")
	})

	it("drops a payload that is not a session map", async () => {
		mocked.getJsonStrict.mockResolvedValueOnce("corrupt")

		await expect(getActiveSessions("42")).resolves.toEqual({})
		expect(mocked.deleteKey).toHaveBeenCalledWith("activity:active:42")
	})

	it("keeps valid entries and drops corrupt ones", async () => {
		mocked.getJsonStrict.mockResolvedValueOnce({
			[session.activityKey]: session,
			bad: { id: 1 },
		})

		await expect(getActiveSessions("42")).resolves.toEqual({
			[session.activityKey]: session,
		})
	})
})
