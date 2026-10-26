import type { Client, Presence } from "discord.js"

export type PresenceLookup = (userId: string) => Presence | undefined

export function createPresenceLookup(client: Client): PresenceLookup {
	return (userId: string) => {
		for (const guild of client.guilds.cache.values()) {
			const presence = guild.presences.cache.get(userId)

			if (presence) {
				return presence
			}
		}

		return undefined
	}
}
