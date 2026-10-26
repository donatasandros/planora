import type { ClientEvents } from "discord.js"
import type { FeatureEventListener } from "@/core/events/types"

export function defineEvent<K extends keyof ClientEvents>(
	event: K,
	listener: Omit<FeatureEventListener<K>, "event">
): FeatureEventListener<K> {
	return {
		event,
		...listener,
	}
}
