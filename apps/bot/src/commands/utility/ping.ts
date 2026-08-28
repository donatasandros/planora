import {
  type Client,
  type CommandInteraction,
  SlashCommandBuilder,
} from "discord.js"

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("ping description")

export async function execute(
  _client: Client,
  interaction: CommandInteraction
) {
  await interaction.reply("Pong!")
}
