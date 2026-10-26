import { describe, expect, it, vi } from "vitest"
import {
	ORPHAN_RECOVERY_LIMIT,
	ORPHAN_STALE_SECONDS,
	recoverOrphanedSessions,
} from "@/features/activity/sweeper/orphan-recovery"
import type {
	ActiveActivitySession,
	ActiveActivitySessions,
	OpenSessionRow,
} from "@/features/activity/types"

const NOW = 1_700_000_000

function openRow(overrides: Partial<OpenSessionRow> = {}): OpenSessionRow {
	return {
		id: "session-1",
		userId: "user-1",
		activityKey: "key-1",
		startedAt: NOW - 3600,
		...overrides,
	}
}

function activeSession(
	overrides: Partial<ActiveActivitySession> = {}
): ActiveActivitySession {
	return {
		id: "session-1",
		activityKey: "key-1",
		activityName: "Chess",
		activityType: 0,
		applicationId: null,
		isCustom: false,
		startedAt: NOW - 3600,
		lastSeenAt: NOW - 300,
		...overrides,
	}
}

type HarnessOptions = {
	rows?: OpenSessionRow[]
	sessionsByUser?: Record<string, ActiveActivitySessions>
	readFailsFor?: string[]
	lockUnavailableFor?: string[]
	finishError?: Error
}

function createHarness(options: HarnessOptions = {}) {
	const readFails = new Set(options.readFailsFor ?? [])
	const lockUnavailable = new Set(options.lockUnavailableFor ?? [])

	const findOpenSessions = vi.fn(async () => options.rows ?? [])
	const getActiveSessions = vi.fn(async (userId: string) => {
		if (readFails.has(userId)) {
			throw new Error("redis down")
		}

		return options.sessionsByUser?.[userId] ?? {}
	})
	const finishSession = vi.fn(async () => {
		if (options.finishError) {
			throw options.finishError
		}
	})
	const acquireUserLock = vi.fn(async (userId: string) =>
		lockUnavailable.has(userId) ? null : `token:${userId}`
	)
	const releaseUserLock = vi.fn(async () => {})

	return {
		...{
			findOpenSessions,
			getActiveSessions,
			finishSession,
			acquireUserLock,
			releaseUserLock,
		},
	}
}

describe("recoverOrphanedSessions", () => {
	it("queries open sessions behind the stale cutoff", async () => {
		const deps = createHarness()

		await recoverOrphanedSessions({ ...deps, now: NOW })

		expect(deps.findOpenSessions).toHaveBeenCalledWith({
			startedBefore: NOW - ORPHAN_STALE_SECONDS,
			limit: ORPHAN_RECOVERY_LIMIT,
		})
	})

	it("does nothing when no open sessions are old enough", async () => {
		const deps = createHarness()

		const result = await recoverOrphanedSessions({ ...deps, now: NOW })

		expect(result).toEqual({
			scanned: 0,
			recovered: 0,
			usersSkipped: 0,
			usersDegraded: 0,
		})
		expect(deps.getActiveSessions).not.toHaveBeenCalled()
		expect(deps.finishSession).not.toHaveBeenCalled()
	})

	it("keeps a session Redis still tracks", async () => {
		const deps = createHarness({
			rows: [openRow()],
			sessionsByUser: { "user-1": { "key-1": activeSession() } },
		})

		const result = await recoverOrphanedSessions({ ...deps, now: NOW })

		expect(result.recovered).toBe(0)
		expect(result.scanned).toBe(1)
		expect(deps.finishSession).not.toHaveBeenCalled()
	})

	it("finishes a session Redis no longer tracks with zero duration", async () => {
		const deps = createHarness({ rows: [openRow()] })

		const result = await recoverOrphanedSessions({ ...deps, now: NOW })

		expect(result.recovered).toBe(1)
		expect(deps.finishSession).toHaveBeenCalledWith({
			id: "session-1",
			endedAt: NOW - 3600,
			durationSeconds: 0,
		})
	})

	it("finishes a row whose activity key now points at another session", async () => {
		const deps = createHarness({
			rows: [openRow()],
			sessionsByUser: {
				"user-1": { "key-1": activeSession({ id: "session-2" }) },
			},
		})

		const result = await recoverOrphanedSessions({ ...deps, now: NOW })

		expect(result.recovered).toBe(1)
		expect(deps.finishSession).toHaveBeenCalledWith({
			id: "session-1",
			endedAt: NOW - 3600,
			durationSeconds: 0,
		})
	})

	it("finishes nothing for a user whose state cannot be read", async () => {
		const deps = createHarness({
			rows: [openRow({ userId: "user-1" }), openRow({ userId: "user-2" })],
			readFailsFor: ["user-1"],
			sessionsByUser: { "user-2": {} },
		})

		const result = await recoverOrphanedSessions({ ...deps, now: NOW })

		expect(result.usersDegraded).toBe(1)
		expect(result.recovered).toBe(1)
		expect(deps.finishSession).toHaveBeenCalledTimes(1)
		expect(deps.finishSession).toHaveBeenCalledWith({
			id: "session-1",
			endedAt: NOW - 3600,
			durationSeconds: 0,
		})
	})

	it("reads each user's sessions once", async () => {
		const deps = createHarness({
			rows: [
				openRow({ id: "session-1", activityKey: "key-1" }),
				openRow({ id: "session-2", activityKey: "key-2" }),
			],
		})

		await recoverOrphanedSessions({ ...deps, now: NOW })

		expect(deps.getActiveSessions).toHaveBeenCalledTimes(1)
		expect(deps.finishSession).toHaveBeenCalledTimes(2)
	})

	it("skips a user whose lock is held", async () => {
		const deps = createHarness({
			rows: [openRow()],
			lockUnavailableFor: ["user-1"],
		})

		const result = await recoverOrphanedSessions({ ...deps, now: NOW })

		expect(result.usersSkipped).toBe(1)
		expect(result.recovered).toBe(0)
		expect(deps.getActiveSessions).not.toHaveBeenCalled()
		expect(deps.finishSession).not.toHaveBeenCalled()
	})

	it("releases the user lock when a finish fails", async () => {
		const deps = createHarness({
			rows: [openRow()],
			finishError: new Error("db down"),
		})

		await expect(
			recoverOrphanedSessions({ ...deps, now: NOW })
		).rejects.toThrow("db down")

		expect(deps.releaseUserLock).toHaveBeenCalledWith(
			"user-1",
			"token:user-1"
		)
	})
})
