import { z } from "zod"
import type { ActiveActivitySessions } from "@/features/activity/types"

export const activeActivitySessionSchema = z.object({
	id: z.string(),
	activityKey: z.string(),
	activityName: z.string(),
	activityType: z.number().int(),
	applicationId: z.string().nullable(),
	isCustom: z.boolean(),
	startedAt: z.number().int(),
	lastSeenAt: z.number().int(),
})

export type ActiveSessionsParseResult =
	| { kind: "invalid" }
	| { kind: "ok"; sessions: ActiveActivitySessions; dropped: number }

export function parseActiveSessions(value: unknown): ActiveSessionsParseResult {
	if (!isRecord(value)) {
		return { kind: "invalid" }
	}

	const sessions: ActiveActivitySessions = {}
	let dropped = 0

	for (const [key, entry] of Object.entries(value)) {
		const result = activeActivitySessionSchema.safeParse(entry)

		if (result.success) {
			sessions[key] = result.data
		} else {
			dropped += 1
		}
	}

	return { kind: "ok", sessions, dropped }
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}
