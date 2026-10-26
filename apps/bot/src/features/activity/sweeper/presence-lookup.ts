import type { Activity, Client } from "discord.js"

export type PresenceLookup = (userId: string) => Activity[] | undefined

export function createPresenceLookup(client: Client): PresenceLookup {
	return (userId: string) => {
		for (const guild of client.guilds.cache.values()) {
			const presence = guild.presences.cache.get(userId)

			if (presence) {
				return presence.activities
			}
		}

		return undefined
	}
}
