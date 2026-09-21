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

export type PastActivity = {
   activityName: string
   timePlayed: number | null
   lastPlayed: number | null
}
