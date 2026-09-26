export type User = {
	id: string
	isTrackingEnabled: boolean
	isProfilePrivate: boolean
	isBlacklisted: boolean
}

/**
 * Outcome of resolving a Discord user against the database.
 *
 * - `found` - a stored record, or cached defaults for a user who hasn't been registered yet.
 * - `absent` - no row exists; `user` holds the defaults that were applied
 * - `unavailable` - the lookup failed and the user's settings are unknown
 */
export type UserResolution =
	| { kind: "found"; user: User }
	| { kind: "absent"; user: User }
	| { kind: "unavailable" }

export type ProfileVisibility =
	| {
			allowed: true
			ephemeral: boolean
	  }
	| {
			allowed: false
			reason: "private" | "unavailable"
	  }
