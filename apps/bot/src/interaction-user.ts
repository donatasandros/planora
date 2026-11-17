import { Discord } from "dfx"
import { DiscordUserId } from "@planora/core"
import { Schema } from "effect"

export const interactionUserId = (
  interaction: Discord.APIInteraction,
): DiscordUserId | undefined => {
  const id = interaction.member?.user.id ?? interaction.user?.id

  return id === undefined ? undefined : Schema.decodeSync(DiscordUserId)(id)
}
