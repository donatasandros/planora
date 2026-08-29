import {
  type Client,
  type CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js"
import { formatTime } from "@/helpers/time"

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("ping description")

export async function execute(client: Client, interaction: CommandInteraction) {
  await interaction.deferReply()

  const reply = await interaction.fetchReply()

  const clientLatency = reply.createdTimestamp - interaction.createdTimestamp
  const websocketLatency = client.ws.ping
  const botUptime = formatTime(client.uptime ?? 0)

  const embed = new EmbedBuilder()
    .setColor(0x8762e4)
    .setTitle("Pong!")
    .setDescription(
      `• Client latency: \`${clientLatency}ms\`\n` +
        `• API latency: \`${websocketLatency}ms\`\n` +
        `• Uptime: \`${botUptime}\``
    )

  await interaction.editReply({ content: null, embeds: [embed] })
}
