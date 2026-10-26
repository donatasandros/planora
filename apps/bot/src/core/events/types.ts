import type { Client, ClientEvents } from "discord.js"

export type FeatureEventListener<
	K extends keyof ClientEvents = keyof ClientEvents,
> = {
	event: K
	/** Lower number = higher priority (e.g., priority 10 executes before priority 20) */
	priority?: number
	/** Return `false` to stop subsequent listeners from executing */
	execute: (
		client: Client,
		...args: ClientEvents[K]
	) => Promise<boolean | undefined> | boolean | undefined
}
