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
