export const USER_REDIS_KEYS = {
   CACHE: (userId: string) => `bot:user:${userId}`,
   REGISTRATION: (userId: string) => `bot:user:registration:${userId}`,
} as const
