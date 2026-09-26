import { resolveUser } from "@/features/system/services/users"
import type { ProfileVisibility } from "@/features/system/types"

export async function resolveProfileVisibility(
	viewerId: string,
	targetId: string,
	{
		isDirectMessage,
	}: {
		isDirectMessage: boolean
	}
): Promise<ProfileVisibility> {
	if (isDirectMessage && viewerId === targetId) {
		return { allowed: true, ephemeral: false }
	}

	const resolution = await resolveUser(targetId)

	if (resolution.kind === "unavailable") {
		return { allowed: false, reason: "unavailable" }
	}

	if (!resolution.user.isProfilePrivate) {
		return {
			allowed: true,
			ephemeral: false,
		}
	}

	return viewerId === targetId
		? { allowed: true, ephemeral: true }
		: { allowed: false, reason: "private" }
}
