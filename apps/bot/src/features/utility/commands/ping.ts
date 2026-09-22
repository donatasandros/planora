import {
   type ChatInputCommandInteraction,
   type Client,
   EmbedBuilder,
   SlashCommandBuilder,
} from "discord.js"
import { COLORS } from "@/shared/constants/colors"
import { formatTime } from "@/shared/utils/time"

export const data = new SlashCommandBuilder()
   .setName("ping")
   .setDescription("Check the bot's response time and websocket latency.")

export async function execute(
   client: Client,
   interaction: ChatInputCommandInteraction
) {
   await interaction.deferReply()

   const reply = await interaction.fetchReply()

   const clientLatency = reply.createdTimestamp - interaction.createdTimestamp
   const websocketLatency = client.ws.ping
   const botUptime = formatTime(Math.floor((client.uptime ?? 0) / 1000))

   const embed = new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle("Pong!")
      .setDescription(
         `• Client latency: \`${clientLatency} ms\`\n` +
            `• Websocket latency: \`${websocketLatency} ms\`\n` +
            `• Uptime: \`${botUptime}\``
      )

   await interaction.editReply({ content: null, embeds: [embed] })
}
