import { resolveUser } from "@/features/system/services/users"
import type { ProfileVisibility, UserResolution } from "@/features/system/types"

type ResolveUser = (userId: string) => Promise<UserResolution>

export async function resolveProfileVisibility(
	viewerId: string,
	targetId: string,
	{
		isDirectMessage,
	}: {
		isDirectMessage: boolean
	},
	resolve: ResolveUser = resolveUser
): Promise<ProfileVisibility> {
	const resolution = await resolve(targetId)

	if (resolution.kind === "unavailable") {
		return { allowed: false, reason: "unavailable" }
	}

	const target = resolution.user

	if (target.isBlacklisted) {
		return {
			allowed: false,
			reason: "blacklisted",
		}
	}

	if (!target.isTrackingEnabled && viewerId !== targetId) {
		return {
			allowed: false,
			reason: "untracked",
		}
	}

	if (isDirectMessage && viewerId === targetId) {
		return {
			allowed: true,
			ephemeral: false,
		}
	}

	if (!target.isProfilePrivate) {
		return {
			allowed: true,
			ephemeral: false,
		}
	}

	return viewerId === targetId
		? { allowed: true, ephemeral: true }
		: { allowed: false, reason: "private" }
}
