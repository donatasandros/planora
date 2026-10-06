import type { activitySessionsTable } from "@workspace/db"
import type { PaginationCursor } from "@/shared/utils/pagination"

export type ActiveActivitySession = {
	id: string
	activityKey: string
	activityName: string
	activityType: number
	applicationId: string | null
	isCustom: boolean
	startedAt: number
	lastSeenAt: number
}

export type ActiveActivitySessions = Record<string, ActiveActivitySession>

export type CurrentActivity = {
	activityName: string
	startedAt: number | null
}

export type ActivityTotal = {
	activityName: string
	timePlayed: number | null
	lastPlayed: number | null
}

export type HistorySession = {
	id: string
	activityName: string
	activityKey: string
	startedAt: number
	endedAt: number | null
	durationSeconds: number
	isCustom: boolean
}

export type HistoryPage = {
	sessions: HistorySession[]
	nextCursor: PaginationCursor | null
	totalPages?: number
}

export type SessionSweeper = {
	stop: () => Promise<void>
}

export type SessionStartRow = typeof activitySessionsTable.$inferInsert

export type StartOperation = {
	kind: "start"
	row: SessionStartRow
	resolve: (inserted: boolean) => void
	reject: (err: unknown) => void
}

export type FinishOperation = {
	kind: "finish"
	id: string
	endedAt: number
	durationSeconds: number
	resolve: () => void
	reject: (err: unknown) => void
}

export type PendingOperation = StartOperation | FinishOperation
