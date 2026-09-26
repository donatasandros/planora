import { resolveUser } from "@/features/system/services/users"
import type { ProfileVisibility } from "@/features/system/types"

export async function resolveProfileVisibility(
	viewerId: string,
	targetId: string
): Promise<ProfileVisibility> {
	if (viewerId === targetId) {
		return { allowed: true }
	}

	const resolution = await resolveUser(targetId)

	if (resolution.kind === "unavailable") {
		return { allowed: false, reason: "unavailable" }
	}

	return resolution.user.isProfilePrivate
		? { allowed: false, reason: "private" }
		: { allowed: true }
}
