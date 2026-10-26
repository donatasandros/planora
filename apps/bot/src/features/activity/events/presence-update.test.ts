import * as redis from "@workspace/redis"
import {
	type Activity,
	ActivityType,
	type Client,
	type Presence,
} from "discord.js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { trackPresenceListener } from "@/features/activity/events/presence-update"
import { getActivityKey } from "@/features/activity/identity/activity-key"
import * as sessions from "@/features/activity/services/sessions"
import {
	getPresenceFingerprint,
	hashFingerprint,
} from "@/features/activity/tracking/fingerprint"
import { LAST_FINGERPRINT_TTL_SECONDS } from "@/features/activity/tracking/last-fingerprint"
import type { ActiveActivitySession } from "@/features/activity/types"
import { resolveUser } from "@/features/system"

vi.mock("@workspace/redis", () => ({
	acquireLock: vi.fn(),
	deleteKeyStrict: vi.fn(),
	getJson: vi.fn(),
	releaseLock: vi.fn(),
	setJson: vi.fn(),
}))

vi.mock("@/features/activity/services/sessions", () => ({
	finishActivitySession: vi.fn(),
	getActiveSessions: vi.fn(),
	setActiveSessions: vi.fn(),
	startActivitySession: vi.fn(),
}))

vi.mock("@/features/system", () => ({ resolveUser: vi.fn() }))

vi.mock("@/core/logger", () => ({
	logger: {
		debug: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
	},
}))

const USER_ID = "user-1"
const FINGERPRINT_KEY = `activity:user:${USER_ID}:fingerprint`

const mockedRedis = vi.mocked(redis)
const mockedSessions = vi.mocked(sessions)

function activity(overrides: Partial<Activity> = {}): Activity {
	return {
		type: ActivityType.Playing,
		name: "Chess",
		applicationId: "app-1",
		...overrides,
	} as Activity
}

function presence(activities: Activity[]): Presence {
	return {
		userId: USER_ID,
		status: "online",
		activities,
		member: { user: { bot: false } },
	} as unknown as Presence
}

function clientWith(cached: Presence | undefined): Client {
	const presences = new Map<string, Presence>()

	if (cached) {
		presences.set(USER_ID, cached)
	}

	return {
		guilds: {
			cache: new Map([["guild-1", { presences: { cache: presences } }]]),
		},
	} as unknown as Client
}

function sessionFor(value: Activity): ActiveActivitySession {
	return {
		id: `session:${value.name}`,
		activityKey: getActivityKey(value),
		activityName: value.name,
		activityType: value.type,
		applicationId: value.applicationId ?? null,
		isCustom: false,
		startedAt: 1_700_000_000,
		lastSeenAt: 1_700_000_000,
	}
}

const chess = activity()
const doom = activity({ name: "Doom", applicationId: "app-2" })
const chessHash = hashFingerprint(getPresenceFingerprint(presence([chess])))
const doomHash = hashFingerprint(getPresenceFingerprint(presence([doom])))

beforeEach(() => {
	vi.clearAllMocks()

	mockedRedis.acquireLock.mockResolvedValue("lock-token")
	mockedRedis.releaseLock.mockResolvedValue(undefined)
	mockedRedis.setJson.mockResolvedValue(undefined)
	mockedRedis.deleteKeyStrict.mockResolvedValue(undefined)
	mockedRedis.getJson.mockResolvedValue({ hash: "committed" } as never)

	mockedSessions.getActiveSessions.mockResolvedValue({})
	mockedSessions.setActiveSessions.mockResolvedValue(undefined)
	mockedSessions.finishActivitySession.mockResolvedValue(undefined)
	mockedSessions.startActivitySession.mockImplementation(
		async (_userId, value) => sessionFor(value)
	)

	vi.mocked(resolveUser).mockResolvedValue({
		kind: "found",
		user: {
			id: USER_ID,
			isTrackingEnabled: true,
			isProfilePrivate: false,
			isBlacklisted: false,
		},
	})
})

describe("presence update under lock contention", () => {
	it("reconciles the latest cached presence, not the delivered event", async () => {
		mockedRedis.acquireLock
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce("lock-token")

		await trackPresenceListener.execute(
			clientWith(presence([doom])),
			presence([chess]),
			presence([chess])
		)

		expect(mockedRedis.acquireLock).toHaveBeenCalledTimes(3)
		expect(mockedSessions.startActivitySession).toHaveBeenCalledTimes(1)

		const [, started] = mockedSessions.startActivitySession.mock.calls[0]

		expect(started.name).toBe("Doom")
		expect(mockedRedis.setJson).toHaveBeenCalledWith(
			FINGERPRINT_KEY,
			{ hash: doomHash },
			LAST_FINGERPRINT_TTL_SECONDS
		)
	})

	it("falls back to the delivered event when presence is not cached", async () => {
		await trackPresenceListener.execute(
			clientWith(undefined),
			presence([chess]),
			presence([chess])
		)

		const [, started] = mockedSessions.startActivitySession.mock.calls[0]

		expect(started.name).toBe("Chess")
	})

	it("drops the update without touching state when the lock stays held", async () => {
		mockedRedis.acquireLock.mockResolvedValue(null)

		await trackPresenceListener.execute(
			clientWith(presence([chess])),
			presence([chess]),
			presence([chess])
		)

		expect(mockedRedis.acquireLock).toHaveBeenCalledTimes(3)
		expect(resolveUser).not.toHaveBeenCalled()
		expect(mockedRedis.setJson).not.toHaveBeenCalled()
		expect(mockedSessions.startActivitySession).not.toHaveBeenCalled()
	})

	it("skips an exact repeat before taking the lock", async () => {
		mockedRedis.getJson.mockResolvedValue({ hash: chessHash } as never)

		await trackPresenceListener.execute(
			clientWith(presence([chess])),
			presence([chess]),
			presence([chess])
		)

		expect(mockedRedis.acquireLock).not.toHaveBeenCalled()
		expect(mockedSessions.startActivitySession).not.toHaveBeenCalled()
	})

	it("skips when the cached state already matches after the lock is taken", async () => {
		mockedRedis.getJson
			.mockResolvedValueOnce({ hash: "committed" } as never)
			.mockResolvedValueOnce({ hash: doomHash } as never)

		await trackPresenceListener.execute(
			clientWith(presence([doom])),
			presence([chess]),
			presence([chess])
		)

		expect(mockedRedis.acquireLock).toHaveBeenCalledTimes(1)
		expect(mockedRedis.releaseLock).toHaveBeenCalledWith(
			`activity:user:${USER_ID}:lock`,
			"lock-token"
		)
		expect(mockedSessions.startActivitySession).not.toHaveBeenCalled()
	})
})
