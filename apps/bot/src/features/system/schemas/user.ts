import { z } from "zod"
import type { User } from "@/features/system/types"

export const userSchema = z.object({
	id: z.string(),
	isTrackingEnabled: z.boolean(),
	isProfilePrivate: z.boolean(),
	isBlacklisted: z.boolean(),
})

export function parseUser(value: unknown): User | null {
	const result = userSchema.safeParse(value)

	return result.success ? result.data : null
}
