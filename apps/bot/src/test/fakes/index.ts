import type { ChatInputCommandInteraction } from "discord.js"
import type { FakeChatInputCommandInteraction } from "@/test/fakes/interaction"

export * from "@/test/fakes/collector"
export * from "@/test/fakes/ids"
export * from "@/test/fakes/interaction"
export * from "@/test/fakes/message"

export function asCommandInteraction(
	interaction: FakeChatInputCommandInteraction
): ChatInputCommandInteraction {
	return interaction as unknown as ChatInputCommandInteraction
}
