import type {
	ActiveActivitySessions,
	OpenSessionRow,
} from "@/features/activity/types"

export const ORPHAN_STALE_SECONDS = 15 * 60
export const ORPHAN_RECOVERY_LIMIT = 500

export type OrphanRecoveryDeps = {
	findOpenSessions: (input: {
		startedBefore: number
		limit: number
	}) => Promise<OpenSessionRow[]>
	getActiveSessions: (userId: string) => Promise<ActiveActivitySessions>
	finishSession: (input: {
		id: string
		endedAt: number
		durationSeconds: number
	}) => Promise<void>
	acquireUserLock: (userId: string) => Promise<string | null>
	releaseUserLock: (userId: string, token: string) => Promise<void>
}

export type OrphanRecoveryResult = {
	scanned: number
	recovered: number
	usersSkipped: number
	usersDegraded: number
}

export async function recoverOrphanedSessions(
	deps: OrphanRecoveryDeps & { now: number }
): Promise<OrphanRecoveryResult> {
	const rows = await deps.findOpenSessions({
		startedBefore: deps.now - ORPHAN_STALE_SECONDS,
		limit: ORPHAN_RECOVERY_LIMIT,
	})

	if (rows.length === 0) {
		return { scanned: 0, recovered: 0, usersSkipped: 0, usersDegraded: 0 }
	}

	const rowsByUser = new Map<string, OpenSessionRow[]>()

	for (const row of rows) {
		const existing = rowsByUser.get(row.userId)

		if (existing) {
			existing.push(row)
		} else {
			rowsByUser.set(row.userId, [row])
		}
	}

	async function readSessions(
		userId: string
	): Promise<ActiveActivitySessions | null> {
		try {
			return await deps.getActiveSessions(userId)
		} catch {
			return null
		}
	}

	let recovered = 0
	let usersSkipped = 0
	let usersDegraded = 0

	for (const [userId, userRows] of rowsByUser) {
		const token = await deps.acquireUserLock(userId)

		if (token === null) {
			usersSkipped += 1
			continue
		}

		try {
			const sessions = await readSessions(userId)

			if (!sessions) {
				usersDegraded += 1
				continue
			}

			for (const row of userRows) {
				if (sessions[row.activityKey]?.id === row.id) {
					continue
				}

				await deps.finishSession({
					id: row.id,
					endedAt: row.startedAt,
					durationSeconds: 0,
				})

				recovered += 1
			}
		} finally {
			await deps.releaseUserLock(userId, token)
		}
	}

	return {
		scanned: rows.length,
		recovered,
		usersSkipped,
		usersDegraded,
	}
}
