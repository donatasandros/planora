export const ACTIVITY_REDIS_KEYS = {
	ACTIVE_SESSION_PREFIX: "activity:active:",
	SWEEP_LOCK: "activity:sweep:lock",
	USER_LOCK: (userId: string) => `activity:user:${userId}:lock`,
} as const

export const TRACK_CUSTOM_ACTIVITIES = false
